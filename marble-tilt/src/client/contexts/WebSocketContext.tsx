import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

// Define types for our WebSocket context
interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  connect: (url: string) => void;
  disconnect: () => void;
  sendMessage: (type: string, data: any) => void;
  lastMessage: any;
}

// Create the context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
  sendMessage: () => {},
  lastMessage: null,
});

// Custom hook to use the WebSocket context
export const useWebSocket = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: ReactNode;
}

// Provider component
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);

  // Connect to WebSocket
  const connect = useCallback((url: string) => {
    // Close existing connection if there is one
    if (socket) {
      socket.close();
    }

    try {
      const newSocket = new WebSocket(url);
      
      newSocket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };
      
      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          setLastMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      newSocket.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };
      
      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      setSocket(newSocket);
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  }, [socket]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  // Send a message through the WebSocket
  const sendMessage = useCallback((type: string, data: any) => {
    if (socket && isConnected) {
      try {
        const message = JSON.stringify({ type, data });
        socket.send(message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    } else {
      console.warn('Cannot send message: WebSocket is not connected');
    }
  }, [socket, isConnected]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  // Context value
  const value = {
    socket,
    isConnected,
    connect,
    disconnect,
    sendMessage,
    lastMessage,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;
