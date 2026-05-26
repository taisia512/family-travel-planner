import React, { useEffect, useRef, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { FiUser, FiMessageCircle } from 'react-icons/fi';
import { useChat } from '../context/ChatContext';
import { API_BASE_URL } from '../config/api';

const mergeMessages = (existingMsgs, newMsgs) => {
  const map = new Map();
  
  existingMsgs.forEach(msg => {
    const key = msg.tempId || msg._id || msg.id;
    if (key) map.set(key, msg);
  });
  
  newMsgs.forEach(msg => {
    const key = msg.tempId || msg._id || msg.id;
    if (key) {
      if (msg.tempId) {
        map.set(msg.tempId, msg);
      }
      const realId = msg._id || msg.id;
      if (realId) {
        map.set(realId, msg);
      }
    }
  });

  const uniqueMessages = Array.from(new Set(map.values()));
  return uniqueMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

function Chat() {
  const savedUser = JSON.parse(localStorage.getItem('user'));

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  const {
    socket,
    unreadCounts,
    markAsRead,
    setActiveChatUser
  } = useChat();

  const selectedUserRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

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
      
      const isForCurrentChat = history.length === 0 || 
        history[0].senderEmail === selectedUserRef.current.email || 
        history[0].receiverEmail === selectedUserRef.current.email;
        
      if (isForCurrentChat) {
        setMessages(prev => mergeMessages(prev, history));
      }
    };

    const handleReceive = (message) => {
      if (!selectedUserRef.current) return;

      const isFromSelected = message.senderEmail === selectedUserRef.current.email;
      const isFromUs = message.senderEmail === savedUser.email && message.receiverEmail === selectedUserRef.current.email;

      if (isFromSelected || isFromUs) {
        setMessages(prev => mergeMessages(prev, [message]));
        
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
  }, [socket]);

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

  const activeMessages = messages.filter(msg => {
    if (!selectedUser) return false;
    return (msg.senderEmail === savedUser.email && msg.receiverEmail === selectedUser.email) ||
           (msg.senderEmail === selectedUser.email && msg.receiverEmail === savedUser.email);
  });

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setMessages([]);

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

  const handleSend = () => {
    if (!text.trim() || !selectedUser || !socket) return;

    const tempId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const optimisticMessage = {
      id: tempId,
      tempId: tempId,
      senderName: savedUser.fullName,
      senderEmail: savedUser.email,
      receiverEmail: selectedUser.email,
      text: text,
      status: 'sending',
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    socket.emit('sendMessage', {
      tempId: tempId,
      senderName: savedUser.fullName,
      senderEmail: savedUser.email,
      receiverEmail: selectedUser.email,
      text: text
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
    <div className="dashboard-layout" style={{ height: '100vh', overflow: 'hidden' }}>
      <Sidebar />

      <main
        className="dashboard-main"
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        <h1 style={{ marginBottom: '20px' }}>Direct Messages</h1>

        <div style={{ display: 'flex', flex: 1, gap: '20px', minHeight: 0 }}>
          <div
            style={{
              width: '300px',
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '15px',
                borderBottom: '1px solid #eee',
                fontWeight: 'bold',
                backgroundColor: '#ffffff'
              }}
            >
              Contacts
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {users.map((u) => {
                const unreadCount = unreadCounts?.[u.email] || 0;

                return (
                  <div
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    style={{
                      padding: '15px',
                      borderBottom: '1px solid #f1f1f1',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      backgroundColor:
                        selectedUser?.id === u.id ? '#eef4f1' : '#fff'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: '#2d4b3b',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <FiUser size={20} />
                      </div>

                      <div>
                        <div style={{ fontWeight: 'bold', color: '#333' }}>
                          {u.fullName}
                        </div>

                        <div style={{ fontSize: '12px', color: '#888' }}>
                          {u.email}
                        </div>
                      </div>
                    </div>

                    {unreadCount > 0 && (
                      <div
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          borderRadius: '12px',
                          padding: '2px 8px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e0e0e0',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {selectedUser ? (
              <>
                <div
                  style={{
                    padding: '15px 20px',
                    backgroundColor: '#fff',
                    borderBottom: '1px solid #e0e0e0',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#2d4b3b',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <FiUser size={16} />
                  </div>

                  {selectedUser.fullName}
                </div>

                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  {activeMessages.map((message) => {
                    const isMe = message.senderEmail === savedUser.email;
                    return (
                      <div key={message.tempId || message._id || message.id} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start'
                      }}>
                        <span style={{ fontSize: '12px', color: '#888', marginBottom: '4px', marginLeft: isMe ? '0' : '8px', marginRight: isMe ? '8px' : '0' }}>
                          {message.senderName}
                        </span>
                        <div style={{
                          backgroundColor: isMe ? '#2d4b3b' : '#ffffff',
                          color: isMe ? '#ffffff' : '#333333',
                          padding: '10px 16px',
                          borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          maxWidth: '70%',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                          border: isMe ? 'none' : '1px solid #e0e0e0',
                          lineHeight: '1.4',
                          opacity: message.status === 'sending' ? 0.6 : 1
                        }}>
                          {message.text}
                        </div>
                      </div>
                    );
                  })}

                  <div ref={messagesEndRef} />
                </div>

                <div
                  style={{
                    padding: '20px',
                    backgroundColor: '#fff',
                    borderTop: '1px solid #e0e0e0',
                    display: 'flex',
                    gap: '12px'
                  }}
                >
                  <input
                    type="text"
                    placeholder={`Message ${selectedUser.fullName}...`}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      borderRadius: '24px',
                      border: '1px solid #ccc',
                      outline: 'none',
                      fontSize: '15px'
                    }}
                  />

                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!socket}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '24px',
                      border: 'none',
                      backgroundColor: '#2d4b3b',
                      color: 'white',
                      fontWeight: 'bold',
                      cursor: socket ? 'pointer' : 'not-allowed',
                      opacity: socket ? 1 : 0.6
                    }}
                  >
                    Send
                  </button>
                </div>
              </>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#888',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <FiMessageCircle size={48} color="#ccc" />
                <p>Select a contact to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Chat;