import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

// Define the type for a player in the game
export interface Player {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  color: string;
}

// Define the WebSocket context interface
interface WebSocketContextType {
  isConnected: boolean;
  playerId: string | null;
  players: Player[];
  sendPosition: (x: number, y: number, vx: number, vy: number) => void;
  reconnect: () => void;
}

// Create the context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  playerId: null,
  players: [],
  sendPosition: () => {},
  reconnect: () => {}
});

// Hook to use the WebSocket context
export const useWebSocket = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: React.ReactNode;
  serverUrl: string;
}

// Provider component for the WebSocket context
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children, 
  serverUrl 
}) => {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  
  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  
  // Connect to WebSocket server
  const connect = useCallback(() => {
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    // Create new WebSocket connection
    const ws = new WebSocket(serverUrl);
    wsRef.current = ws;
    
    // Connection opened
    ws.addEventListener('open', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    });
    
    // Connection closed
    ws.addEventListener('close', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          connect();
        }
      }, 3000);
    });
    
    // Connection error
    ws.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
    });
    
    // Message received
    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different message types
        switch (data.type) {
          case 'init':
            // Initial connection, server assigns player ID
            setPlayerId(data.playerId);
            console.log(`Assigned player ID: ${data.playerId}`);
            break;
            
          case 'gameState':
            // Update game state with all players
            setPlayers(data.players);
            break;
            
          default:
            console.warn(`Unknown message type: ${data.type}`);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
  }, [serverUrl]);
  
  // Connect on component mount
  useEffect(() => {
    connect();
    
    // Clean up on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);
  
  // Send position update to server
  const sendPosition = useCallback((x: number, y: number, vx: number, vy: number) => {
    if (wsRef.current && isConnected && playerId) {
      wsRef.current.send(JSON.stringify({
        type: 'update',
        playerId,
        x,
        y,
        velocityX: vx,
        velocityY: vy
      }));
    }
  }, [isConnected, playerId]);
  
  // Provide the WebSocket context
  const value = {
    isConnected,
    playerId,
    players,
    sendPosition,
    reconnect: connect
  };
  
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;
