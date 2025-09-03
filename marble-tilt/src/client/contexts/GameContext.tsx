import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useWebSocket } from './WebSocketContext';
import { v4 as uuidv4 } from 'uuid';

// Define marble interface
export interface Marble {
  id: string;
  x: number;
  y: number;
  color: string;
  name?: string;
}

// Define game context interface
interface GameContextType {
  marbles: Marble[];
  playerId: string;
  playerMarble: Marble | null;
  updatePlayerPosition: (x: number, y: number) => void;
  joinGame: (name?: string) => void;
  leaveGame: () => void;
  gameState: 'idle' | 'joining' | 'active' | 'error';
  errorMessage: string | null;
}

// Create the context with default values
const GameContext = createContext<GameContextType>({
  marbles: [],
  playerId: '',
  playerMarble: null,
  updatePlayerPosition: () => {},
  joinGame: () => {},
  leaveGame: () => {},
  gameState: 'idle',
  errorMessage: null,
});

// Custom hook to use the Game context
export const useGame = () => useContext(GameContext);

interface GameProviderProps {
  children: ReactNode;
  serverUrl?: string;
}

// Generate a random color for marbles
const getRandomColor = (): string => {
  const colors = [
    '#2196F3', // Blue
    '#F44336', // Red
    '#4CAF50', // Green
    '#FF9800', // Orange
    '#9C27B0', // Purple
    '#00BCD4', // Cyan
    '#FFEB3B', // Yellow
    '#795548', // Brown
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Provider component
export const GameProvider: React.FC<GameProviderProps> = ({ 
  children, 
  serverUrl = 'wss://localhost:3001'
}) => {
  const { connect, disconnect, sendMessage, lastMessage, isConnected } = useWebSocket();
  const [marbles, setMarbles] = useState<Marble[]>([]);
  const [playerId, setPlayerId] = useState<string>(localStorage.getItem('playerId') || uuidv4());
  const [playerMarble, setPlayerMarble] = useState<Marble | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'joining' | 'active' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Save player ID to localStorage for persistence
  useEffect(() => {
    localStorage.setItem('playerId', playerId);
  }, [playerId]);

  // Connect to WebSocket when component mounts
  useEffect(() => {
    try {
      connect(serverUrl);
    } catch (error) {
      console.error('Failed to connect to game server:', error);
      setErrorMessage('Failed to connect to game server');
      setGameState('error');
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, serverUrl]);

  // Process incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    try {
      switch (lastMessage.type) {
        case 'gameState':
          setMarbles(lastMessage.data.marbles);
          setGameState('active');
          break;
        case 'playerJoined':
          // Find our player in the updated marble list
          const ourMarble = lastMessage.data.marbles.find((m: Marble) => m.id === playerId);
          if (ourMarble) {
            setPlayerMarble(ourMarble);
          }
          setMarbles(lastMessage.data.marbles);
          setGameState('active');
          break;
        case 'playerLeft':
          setMarbles(lastMessage.data.marbles);
          break;
        case 'error':
          setErrorMessage(lastMessage.data.message);
          setGameState('error');
          break;
        default:
          console.log('Unknown message type:', lastMessage.type);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }, [lastMessage, playerId]);

  // Join the game
  const joinGame = useCallback((name?: string) => {
    if (!isConnected) {
      try {
        connect(serverUrl);
      } catch (error) {
        console.error('Failed to connect to game server:', error);
        setErrorMessage('Failed to connect to game server');
        setGameState('error');
        return;
      }
    }

    setGameState('joining');
    
    // Create new marble with random position
    const newMarble: Marble = {
      id: playerId,
      x: 0, // Center position, will be adjusted by server
      y: 0, // Center position, will be adjusted by server
      color: getRandomColor(),
      name: name || `Player ${playerId.substring(0, 4)}`
    };
    
    setPlayerMarble(newMarble);
    
    // Send join message to server
    sendMessage('joinGame', {
      playerId,
      marble: newMarble
    });
  }, [connect, isConnected, playerId, sendMessage, serverUrl]);

  // Leave the game
  const leaveGame = useCallback(() => {
    sendMessage('leaveGame', { playerId });
    setPlayerMarble(null);
    setGameState('idle');
  }, [playerId, sendMessage]);

  // Update player position
  const updatePlayerPosition = useCallback((x: number, y: number) => {
    if (gameState !== 'active' || !playerMarble) return;

    // Scale the input values to make movement more responsive
    const scaledX = x * 5; // Adjust multiplier as needed
    const scaledY = y * 5; // Adjust multiplier as needed

    // Update local marble position for smoother experience
    setPlayerMarble(prev => {
      if (!prev) return null;
      return {
        ...prev,
        x: prev.x + scaledX,
        y: prev.y + scaledY
      };
    });

    // Update local marbles array for immediate feedback
    setMarbles(prev => {
      return prev.map(marble => {
        if (marble.id === playerId) {
          return {
            ...marble,
            x: marble.x + scaledX,
            y: marble.y + scaledY
          };
        }
        return marble;
      });
    });

    // Send position update to server
    sendMessage('updatePosition', {
      playerId,
      x: scaledX,
      y: scaledY,
      absolute: false // We're sending relative movement, not absolute position
    });
  }, [gameState, playerId, playerMarble, sendMessage]);

  // Context value
  const value = {
    marbles,
    playerId,
    playerMarble,
    updatePlayerPosition,
    joinGame,
    leaveGame,
    gameState,
    errorMessage,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export default GameContext;
