import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const savedUser = JSON.parse(localStorage.getItem('user'));

  const [socket, setSocket] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState(() => {
    const saved = localStorage.getItem('unreadCounts');
    return saved ? JSON.parse(saved) : {};
  });

  const [activeChatUser, setActiveChatUser] = useState(null);

  useEffect(() => {
    localStorage.setItem('unreadCounts', JSON.stringify(unreadCounts));
  }, [unreadCounts]);

  useEffect(() => {
    if (!savedUser?.email) return;

    const newSocket = io(API_BASE_URL, {
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join', savedUser.email);
    });

    newSocket.on('unreadCounts', (counts) => {
      setUnreadCounts(counts || {});
    });

    return () => {
      newSocket.off('connect');
      newSocket.off('unreadCounts');
      newSocket.disconnect();
    };
  }, [savedUser?.email]);

  const markAsRead = (email) => {
    setUnreadCounts((prev) => {
      const newCounts = { ...prev };
      delete newCounts[email];
      return newCounts;
    });
  };

  const totalUnread = Object.values(unreadCounts).reduce(
    (acc, count) => acc + count,
    0
  );

  return (
    <ChatContext.Provider
      value={{
        socket,
        unreadCounts,
        totalUnread,
        markAsRead,
        activeChatUser,
        setActiveChatUser
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}