import React, { useEffect, useState, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { FiUser, FiMessageCircle } from 'react-icons/fi';
import { useChat } from '../context/ChatContext';
import { API_BASE_URL } from '../config/api';

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

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // SOCKET EVENTS
  useEffect(() => {
    if (!socket || !savedUser?.email) return;

    const handleHistory = (history) => {
      setMessages(history || []);
    };

    const handleReceive = (message) => {
      if (!selectedUser) return;

      const belongsToCurrentConversation =
        (message.senderEmail === savedUser.email &&
          message.receiverEmail === selectedUser.email) ||
        (message.senderEmail === selectedUser.email &&
          message.receiverEmail === savedUser.email);

      if (!belongsToCurrentConversation) return;

      setMessages((prev) => {
        const alreadyExists = prev.some(
          (m) =>
            (m._id && m._id === message._id) ||
            (m.id && m.id === message.id)
        );

        if (alreadyExists) return prev;

        return [...prev, message];
      });
    };

    socket.on('chatHistory', handleHistory);
    socket.on('receiveMessage', handleReceive);

    return () => {
      socket.off('chatHistory', handleHistory);
      socket.off('receiveMessage', handleReceive);
    };
  }, [socket, selectedUser, savedUser?.email]);

  // CLEAR ACTIVE CHAT
  useEffect(() => {
    return () => {
      if (setActiveChatUser) {
        setActiveChatUser(null);
      }
    };
  }, [setActiveChatUser]);

  // FETCH USERS
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
          setUsers(
            data.filter(
              (u) => u.email !== savedUser.email
            )
          );
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    };

    fetchUsers();
  }, [savedUser.email]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);

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
    if (!text.trim()) return;
    if (!selectedUser) return;
    if (!socket) return;

    socket.emit('sendMessage', {
      senderName: savedUser.fullName,
      senderEmail: savedUser.email,
      receiverEmail: selectedUser.email,
      text: text.trim()
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
    <div
      className="dashboard-layout"
      style={{
        height: '100vh',
        overflow: 'hidden'
      }}
    >
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
        <h1 style={{ marginBottom: '20px' }}>
          Direct Messages
        </h1>

        <div
          style={{
            display: 'flex',
            flex: 1,
            gap: '20px',
            minHeight: 0
          }}
        >
          {/* CONTACTS */}
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

            <div
              style={{
                flex: 1,
                overflowY: 'auto'
              }}
            >
              {users.map((u) => {
                const unreadCount =
                  unreadCounts?.[u.email] || 0;

                return (
                  <div
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    style={{
                      padding: '15px',
                      borderBottom:
                        '1px solid #f1f1f1',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      backgroundColor:
                        selectedUser?.id === u.id
                          ? '#eef4f1'
                          : '#fff'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
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
                        <div
                          style={{
                            fontWeight: 'bold',
                            color: '#333'
                          }}
                        >
                          {u.fullName}
                        </div>

                        <div
                          style={{
                            fontSize: '12px',
                            color: '#888'
                          }}
                        >
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
                        {unreadCount > 9
                          ? '9+'
                          : unreadCount}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CHAT */}
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
                    borderBottom:
                      '1px solid #e0e0e0',
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
                  {messages.map((message) => {
                    const isMe =
                      message.senderEmail ===
                      savedUser.email;

                    return (
                      <div
                        key={
                          message._id ||
                          message.id
                        }
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe
                            ? 'flex-end'
                            : 'flex-start'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '12px',
                            color: '#888',
                            marginBottom: '4px'
                          }}
                        >
                          {message.senderName}
                        </span>

                        <div
                          style={{
                            backgroundColor: isMe
                              ? '#2d4b3b'
                              : '#ffffff',
                            color: isMe
                              ? '#ffffff'
                              : '#333333',
                            padding: '10px 16px',
                            borderRadius: isMe
                              ? '16px 16px 4px 16px'
                              : '16px 16px 16px 4px',
                            maxWidth: '70%',
                            boxShadow:
                              '0 2px 4px rgba(0,0,0,0.05)',
                            border: isMe
                              ? 'none'
                              : '1px solid #e0e0e0',
                            lineHeight: '1.4'
                          }}
                        >
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
                    borderTop:
                      '1px solid #e0e0e0',
                    display: 'flex',
                    gap: '12px'
                  }}
                >
                  <input
                    type="text"
                    placeholder={`Message ${selectedUser.fullName}...`}
                    value={text}
                    onChange={(e) =>
                      setText(e.target.value)
                    }
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
                    style={{
                      padding: '12px 24px',
                      borderRadius: '24px',
                      border: 'none',
                      backgroundColor: '#2d4b3b',
                      color: 'white',
                      fontWeight: 'bold',
                      cursor: 'pointer'
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
                <FiMessageCircle
                  size={48}
                  color="#ccc"
                />

                <p>
                  Select a contact to start chatting
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
export default Chat;