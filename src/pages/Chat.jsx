import React, { useEffect, useRef, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { FiUser, FiMessageCircle } from 'react-icons/fi';
import { useChat } from '../context/ChatContext';
import { API_BASE_URL } from '../config/api';
import '../styles/Chat.css';

const mergeMessages = (existingMsgs, newMsgs) => {
  const map = new Map();

  existingMsgs.forEach((msg) => {
    const key = msg.tempId || msg._id || msg.id;
    if (key) map.set(key, msg);
  });

  newMsgs.forEach((msg) => {
    const realId = msg._id || msg.id;
    const tempId = msg.tempId;

    if (tempId && map.has(tempId)) {
      map.set(tempId, { ...map.get(tempId), ...msg, status: msg.status || 'sent' });
      return;
    }

    if (realId && map.has(realId)) {
      map.set(realId, { ...map.get(realId), ...msg, status: msg.status || 'sent' });
      return;
    }

    if (realId) map.set(realId, { ...msg, status: msg.status || 'sent' });
    else if (tempId) map.set(tempId, msg);
  });

  return Array.from(new Set(map.values())).sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
};

function Chat() {
  const savedUser = JSON.parse(localStorage.getItem('user'));

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [showConversationMobile, setShowConversationMobile] = useState(false);

  const { socket, unreadCounts, markAsRead, setActiveChatUser } = useChat();

  const selectedUserRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    const handleHistory = (history) => {
      if (!selectedUserRef.current) return;

      const currentSelectedEmail = selectedUserRef.current.email?.toLowerCase();

      const isForCurrentChat =
        history.length === 0 ||
        history.some(
          (msg) =>
            msg.senderEmail?.toLowerCase() === currentSelectedEmail ||
            msg.receiverEmail?.toLowerCase() === currentSelectedEmail
        );

      if (isForCurrentChat) {
        setMessages((prev) => mergeMessages(prev, history));
      }
    };

    const handleReceive = (message) => {
      if (!selectedUserRef.current) return;

      const currentSelectedEmail = selectedUserRef.current.email?.toLowerCase();
      const messageSenderEmail = message.senderEmail?.toLowerCase();
      const messageReceiverEmail = message.receiverEmail?.toLowerCase();
      const savedUserEmail = savedUser.email?.toLowerCase();

      const isFromSelected = messageSenderEmail === currentSelectedEmail;
      const isFromUs =
        messageSenderEmail === savedUserEmail &&
        messageReceiverEmail === currentSelectedEmail;

      if (isFromSelected || isFromUs) {
        setMessages((prev) => mergeMessages(prev, [message]));

        if (isFromSelected) {
          socket.emit('markAsRead', {
            currentUserEmail: savedUser.email,
            otherUserEmail: message.senderEmail
          });
        }
      }
    };

    socket.on('chatHistory', handleHistory);
    socket.on('receiveMessage', handleReceive);

    return () => {
      socket.off('chatHistory', handleHistory);
      socket.off('receiveMessage', handleReceive);
    };
  }, [socket, savedUser.email]);

  useEffect(() => {
    return () => {
      if (setActiveChatUser) {
        setActiveChatUser(null);
      }
    };
  }, [setActiveChatUser]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');

        const res = await fetch(`${API_BASE_URL}/api/users`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();

        if (Array.isArray(data)) {
          setUsers(data.filter((u) => u.email !== savedUser.email));
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    };

    fetchUsers();
  }, [savedUser.email]);

  const activeMessages = messages.filter((msg) => {
    if (!selectedUser) return false;

    const msgSender = msg.senderEmail?.toLowerCase();
    const msgReceiver = msg.receiverEmail?.toLowerCase();
    const currentMe = savedUser.email?.toLowerCase();
    const currentSelected = selectedUser.email?.toLowerCase();

    return (
      (msgSender === currentMe && msgReceiver === currentSelected) ||
      (msgSender === currentSelected && msgReceiver === currentMe)
    );
  });

  const handleSelectUser = (user) => {
    selectedUserRef.current = user;
    setSelectedUser(user);
    setMessages([]);
    setShowConversationMobile(true);

    if (setActiveChatUser) {
      setActiveChatUser(user.email);
    }

    if (markAsRead) {
      markAsRead(user.email);
    }

    if (socket) {
      socket.emit('getChatHistory', {
        user1: savedUser.email,
        user2: user.email
      });
    }
  };

  const handleBackToContacts = () => {
    setShowConversationMobile(false);
  };

  const handleSend = () => {
    if (!text.trim() || !selectedUser || !socket) return;

    const cleanText = text.trim();

    const tempId =
      'temp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    const optimisticMessage = {
      id: tempId,
      tempId,
      senderName: savedUser.fullName,
      senderEmail: savedUser.email,
      receiverEmail: selectedUser.email,
      text: cleanText,
      status: 'sending',
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    socket.emit('sendMessage', {
      tempId,
      senderName: savedUser.fullName,
      senderEmail: savedUser.email,
      receiverEmail: selectedUser.email,
      text: cleanText
    });

    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="dashboard-layout chat-layout">
      <Sidebar />

      <main className="dashboard-main chat-main">
        <h1 className="chat-page-title">Direct Messages</h1>

        <div className="chat-content">
          <section
            className={`chat-contacts-panel ${
              showConversationMobile ? 'mobile-hidden' : ''
            }`}
          >
            <div className="chat-panel-title">Contacts</div>

            <div className="chat-users-list">
              {users.map((u) => {
                const unreadCount = unreadCounts?.[u.email.toLowerCase()] || 0;

                return (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className={`chat-user-row ${
                      selectedUser?.id === u.id ? 'selected' : ''
                    }`}
                  >
                    <div className="chat-user-left">
                      <div className="chat-avatar">
                        <FiUser size={20} />
                      </div>

                      <div className="chat-user-text">
                        <div className="chat-user-name">{u.fullName}</div>
                        <div className="chat-user-email">{u.email}</div>
                      </div>
                    </div>

                    {unreadCount > 0 && (
                      <div className="chat-unread-badge">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section
            className={`chat-conversation-panel ${
              showConversationMobile ? 'mobile-visible' : ''
            }`}
          >
            {selectedUser ? (
              <>
                <div className="chat-header">
                  <button
                    type="button"
                    className="chat-back-btn"
                    onClick={handleBackToContacts}
                  >
                    ←
                  </button>

                  <div className="chat-small-avatar">
                    <FiUser size={16} />
                  </div>

                  <span>{selectedUser.fullName}</span>
                </div>

                <div className="chat-messages">
                  {activeMessages.map((message) => {
                    const isMe =
                      message.senderEmail?.toLowerCase() ===
                      savedUser.email?.toLowerCase();

                    return (
                      <div
                        key={message.tempId || message._id || message.id}
                        className={`chat-message-row ${isMe ? 'me' : 'other'}`}
                      >
                        <span className="chat-message-sender">
                          {message.senderName}
                        </span>

                        <div
                          className={`chat-bubble ${isMe ? 'me' : 'other'} ${
                            message.status === 'sending' ? 'sending' : ''
                          }`}
                        >
                          {message.text}
                        </div>
                      </div>
                    );
                  })}

                  <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-area">
                  <input
                    type="text"
                    placeholder={`Message ${selectedUser.fullName}...`}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />

                  <button type="button" onClick={handleSend} disabled={!socket}>
                    Send
                  </button>
                </div>
              </>
            ) : (
              <div className="chat-empty-state">
                <FiMessageCircle size={48} color="#ccc" />
                <p>Select a contact to start chatting</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default Chat;