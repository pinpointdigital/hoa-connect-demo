import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

interface SocketContextType {
  socket: any | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionStatus: 'disconnected'
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 5000,
    });

    setSocket(newSocket);
    setConnectionStatus('connecting');

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
      setConnectionStatus('connected');
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      setConnectionStatus('error');
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const value = {
    socket,
    isConnected,
    connectionStatus
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Export connection status component for Layout
export const ConnectionStatus: React.FC = () => {
  const { connectionStatus, isConnected } = useSocket();

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      default: return 'Disconnected';
    }
  };

  return (
    <div className={`text-xs ${getStatusColor()}`}>
      <span className="inline-block w-2 h-2 rounded-full bg-current mr-1"></span>
      {getStatusText()}
    </div>
  );
};

export default SocketContext;
