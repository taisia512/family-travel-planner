import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
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
  const activeChatUserRef = useRef(null);

  useEffect(() => {
    activeChatUserRef.current = activeChatUser;
  }, [activeChatUser]);

  useEffect(() => {
    localStorage.setItem('unreadCounts', JSON.stringify(unreadCounts));
  }, [unreadCounts]);

  useEffect(() => {
    if (!savedUser?.email) return;

    const newSocket = io(API_BASE_URL);

    setSocket(newSocket);

    newSocket.emit('join', savedUser.email);

    newSocket.on('unreadCounts', (counts) => {
      setUnreadCounts(counts || {});
    });

    newSocket.on('receiveMessage', (message) => {
      if (message.senderEmail === savedUser.email) return;

      if (activeChatUserRef.current === message.senderEmail) {
        newSocket.emit('getChatHistory', {
          user1: savedUser.email,
          user2: message.senderEmail
        });

        return;
      }

      setUnreadCounts((prev) => ({
        ...prev,
        [message.senderEmail]: (prev[message.senderEmail] || 0) + 1
      }));
    });

    return () => {
      newSocket.off('unreadCounts');
      newSocket.off('receiveMessage');
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