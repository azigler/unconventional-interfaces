import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  Player, 
  addPlayer, 
  updatePlayerPosition as updateFirestorePlayerPosition,
  updatePlayerConnection, 
  removePlayer, 
  subscribeToPlayers 
} from '../../firebase/gameState';
import { getRandomColor } from '../../firebase/gameState';

// Define the context interface
interface GameStateContextType {
  players: Player[];
  currentPlayer: Player | null;
  joinGame: (name?: string) => Promise<void>;
  leaveGame: () => Promise<void>;
  updatePlayerPosition: (x: number, y: number) => Promise<void>;
  gameState: 'idle' | 'joining' | 'active' | 'error';
  errorMessage: string | null;
}

// Create the context with default values
const GameStateContext = createContext<GameStateContextType>({
  players: [],
  currentPlayer: null,
  joinGame: async () => {},
  leaveGame: async () => {},
  updatePlayerPosition: async () => {},
  gameState: 'idle',
  errorMessage: null,
});

// Custom hook to use the GameState context
export const useGameState = () => useContext(GameStateContext);

interface GameStateProviderProps {
  children: ReactNode;
}

// Provider component
export const GameStateProvider: React.FC<GameStateProviderProps> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'joining' | 'active' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Subscribe to player updates from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToPlayers((updatedPlayers) => {
      setPlayers(updatedPlayers);
      
      // Update current player if it exists in the updated players
      if (currentPlayer) {
        const updated = updatedPlayers.find(p => p.id === currentPlayer.id);
        if (updated) {
          setCurrentPlayer(updated);
        }
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [currentPlayer]);

  // Join the game
  const joinGame = useCallback(async (name?: string) => {
    try {
      setGameState('joining');
      
      // Add player to Firestore
      const player = await addPlayer(name);
      setCurrentPlayer(player);
      
      // Store player ID in localStorage for persistence
      localStorage.setItem('playerId', player.id);
      
      setGameState('active');
    } catch (error) {
      console.error('Failed to join game:', error);
      setErrorMessage('Failed to join game');
      setGameState('error');
    }
  }, []);

  // Leave the game
  const leaveGame = useCallback(async () => {
    if (!currentPlayer) return;
    
    try {
      await removePlayer(currentPlayer.id);
      setCurrentPlayer(null);
      setGameState('idle');
      
      // Remove player ID from localStorage
      localStorage.removeItem('playerId');
    } catch (error) {
      console.error('Failed to leave game:', error);
      setErrorMessage('Failed to leave game');
    }
  }, [currentPlayer]);

  // Update player position
  const updatePlayerPosition = useCallback(async (x: number, y: number) => {
    if (!currentPlayer) return;
    
    try {
      // Scale the input values for smoother movement
      const scaledX = currentPlayer.x + (x * 5);
      const scaledY = currentPlayer.y + (y * 5);
      
      // Update Firestore with the new position
      await updateFirestorePlayerPosition(currentPlayer.id, scaledX, scaledY);
      
      // Update local state for immediate feedback
      setCurrentPlayer(prev => {
        if (!prev) return null;
        return {
          ...prev,
          x: scaledX,
          y: scaledY
        };
      });
    } catch (error) {
      console.error('Failed to update position:', error);
      setErrorMessage('Failed to update position');
    }
  }, [currentPlayer]);

  // Clean up on unmount - mark player as disconnected
  useEffect(() => {
    return () => {
      if (currentPlayer) {
        updatePlayerConnection(currentPlayer.id, false).catch(console.error);
      }
    };
  }, [currentPlayer]);

  // Context value
  const value = {
    players,
    currentPlayer,
    joinGame,
    leaveGame,
    updatePlayerPosition,
    gameState,
    errorMessage,
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
};

export default GameStateContext;
