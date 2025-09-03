import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWebSocket, Player } from './WebSocketContext';

// Define game boundaries
export interface Boundaries {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

// Define obstacle
export interface Obstacle {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: 'wall' | 'bumper' | 'hole' | 'teleporter';
}

// Define game context interface
interface GameContextType {
  isLobby: boolean;
  setIsLobby: (isLobby: boolean) => void;
  boundaries: Boundaries;
  obstacles: Obstacle[];
  score: number;
  localPlayer: Player | null;
  otherPlayers: Player[];
  gameState: 'waiting' | 'playing' | 'finished';
  setGameState: (state: 'waiting' | 'playing' | 'finished') => void;
  restartGame: () => void;
}

// Create the context with default values
const GameContext = createContext<GameContextType>({
  isLobby: false,
  setIsLobby: () => {},
  boundaries: { left: 0, right: window.innerWidth, top: 0, bottom: window.innerHeight },
  obstacles: [],
  score: 0,
  localPlayer: null,
  otherPlayers: [],
  gameState: 'waiting',
  setGameState: () => {},
  restartGame: () => {}
});

// Hook to use the game context
export const useGameContext = () => useContext(GameContext);

interface GameProviderProps {
  children: React.ReactNode;
  initialObstacles?: Obstacle[];
}

// Provider component for the game context
export const GameProvider: React.FC<GameProviderProps> = ({ 
  children,
  initialObstacles = []
}) => {
  // Get WebSocket context
  const { playerId, players } = useWebSocket();
  
  // Game state
  const [isLobby, setIsLobby] = useState(false);
  const [boundaries, setBoundaries] = useState<Boundaries>({
    left: 0,
    right: window.innerWidth,
    top: 0,
    bottom: window.innerHeight
  });
  const [obstacles, setObstacles] = useState<Obstacle[]>(initialObstacles);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  
  // Update boundaries on window resize
  useEffect(() => {
    const handleResize = () => {
      setBoundaries({
        left: 0,
        right: window.innerWidth,
        top: 0,
        bottom: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Filter players into local player and other players
  const localPlayer = players.find(player => player.id === playerId) || null;
  const otherPlayers = players.filter(player => player.id !== playerId);
  
  // Restart the game
  const restartGame = () => {
    setScore(0);
    setGameState('waiting');
  };
  
  // Provide the game context
  const value = {
    isLobby,
    setIsLobby,
    boundaries,
    obstacles,
    score,
    localPlayer,
    otherPlayers,
    gameState,
    setGameState,
    restartGame
  };
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export default GameContext;
