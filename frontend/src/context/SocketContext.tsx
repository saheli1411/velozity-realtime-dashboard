import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext<{ socket: Socket | null; onlineCount: number }>({
  socket: null,
  onlineCount: 1,
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineCount, setOnlineCount] = useState<number>(1);

  useEffect(() => {
    if (!token) {
      if (socket) socket.disconnect();
      return;
    }

    const s = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
    });

    s.on('presence_update', (data: { onlineCount: number }) => {
      setOnlineCount(data.onlineCount);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, onlineCount }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);