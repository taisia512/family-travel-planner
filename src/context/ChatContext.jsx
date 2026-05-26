import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';
const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const savedUser = JSON.parse(localStorage.getItem('user'));
  const [socket, setSocket] = useState(null);
  
  // Track unread message counts. Key: senderEmail, Value: count
  const [unreadCounts, setUnreadCounts] = useState(() => {
    const saved = localStorage.getItem('unreadCounts');
    return saved ? JSON.parse(saved) : {};
  });
  
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

  useEffect(() => {
    if (!savedUser?.email) return;

    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);

    newSocket.emit('join', savedUser.email);

    newSocket.on('receiveMessage', (message) => {
      // If we are the sender, we don't increment our own unread count
      if (message.senderEmail === savedUser.email) return;

      // If the message is from someone else, check if we are actively chatting with them
      if (activeChatUserRef.current !== message.senderEmail) {
        setUnreadCounts(prev => ({
          ...prev,
          [message.senderEmail]: (prev[message.senderEmail] || 0) + 1
        }));
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
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
