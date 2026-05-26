import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const savedUser = JSON.parse(localStorage.getItem('user'));
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();
  
  // Track unread message counts. Key: senderEmail, Value: count
  const [unreadCounts, setUnreadCounts] = useState(() => {
    const saved = localStorage.getItem('unreadCounts');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Real-time toast notifications
  const [toasts, setToasts] = useState([]);
  
  const [activeChatUser, setActiveChatUser] = useState(null);
  const activeChatUserRef = useRef(null);

  // Keep a ref synchronized so the socket event listener can read the current value
  useEffect(() => {
    activeChatUserRef.current = activeChatUser;
  }, [activeChatUser]);

  // Persist unread counts
  useEffect(() => {
    localStorage.setItem('unreadCounts', JSON.stringify(unreadCounts));
  }, [unreadCounts]);

  const addToast = (senderName, senderEmail, text) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, senderName, senderEmail, text }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleToastClick = (toast) => {
    setToasts(prev => prev.filter(t => t.id !== toast.id));
    navigate('/chat');
  };

  useEffect(() => {
    if (!savedUser?.email) return;

    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);

    newSocket.emit('join', savedUser.email);

    // Sync database unread counts immediately on join & other user updates
    newSocket.on('unreadCounts', (counts) => {
      setUnreadCounts(counts || {});
    });

    newSocket.on('receiveMessage', (message) => {
      // If we are the sender, we don't increment our own unread count
      if (message.senderEmail === savedUser.email) return;

      // If the message is from someone else, check if we are actively chatting with them
      if (activeChatUserRef.current !== message.senderEmail) {
        setUnreadCounts(prev => ({
          ...prev,
          [message.senderEmail]: (prev[message.senderEmail] || 0) + 1
        }));
        
        // Show premium glassmorphism notification toast!
        addToast(message.senderName, message.senderEmail, message.text);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [savedUser?.email]);

  const markAsRead = (email) => {
    setUnreadCounts(prev => {
      const newCounts = { ...prev };
      delete newCounts[email];
      return newCounts;
    });
    
    // Tell the backend to clear unread counts for this contact
    if (socket && savedUser?.email) {
      socket.emit('markAsRead', {
        currentUserEmail: savedUser.email,
        otherUserEmail: email
      });
    }
  };

  const totalUnread = Object.values(unreadCounts).reduce((acc, count) => acc + count, 0);

  return (
    <ChatContext.Provider value={{
      socket,
      unreadCounts,
      totalUnread,
      markAsRead,
      activeChatUser,
      setActiveChatUser
    }}>
      {children}

      {/* Floating Glassmorphism Toast Notification Container */}
      <div className="chat-toast-container">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className="chat-toast" 
            onClick={() => handleToastClick(toast)}
          >
            <div className="chat-toast-header">
              <span className="chat-toast-sender">{toast.senderName}</span>
              <span className="chat-toast-time">Just now</span>
            </div>
            <div className="chat-toast-body">{toast.text}</div>
          </div>
        ))}
      </div>
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}