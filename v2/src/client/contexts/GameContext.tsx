import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  addPlayer, 
  updatePlayerPosition as updateFirestorePosition, 
  updatePlayerConnection,
  removePlayer,
  subscribeToroomPlayers,
  createGameRoom,
  getGameRooms,
  subscribeToGameRooms,
  addItemToCart as addFirestoreItemToCart
} from '../firebase/gameState';
import { Player, GameRoom, GameState, CartItem } from '@shared/types/game';

interface GameContextType {
  gameState: GameState;
  currentPlayer: Player | null;
  players: Player[];
  gameRooms: GameRoom[];
  currentRoomId: string | null;
  errorMessage: string | null;
  joinGame: (name: string, roomId?: string) => Promise<void>;
  leaveGame: () => Promise<void>;
  updatePlayerPosition: (x: number, y: number) => void;
  createRoom: (name: string) => Promise<string>;
  addItemToCart: (roomId: string, playerId: string, item: Omit<CartItem, 'id'>) => Promise<void>;
}

// Create context with default values
const GameContext = createContext<GameContextType>({
  gameState: GameState.IDLE,
  currentPlayer: null,
  players: [],
  gameRooms: [],
  currentRoomId: null,
  errorMessage: null,
  joinGame: async () => {},
  leaveGame: async () => {},
  updatePlayerPosition: () => {},
  createRoom: async () => '',
  addItemToCart: async () => {}
});

// Custom hook to use the game context
export const useGame = () => useContext(GameContext);

// Provider component
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  
  // State
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameRooms, setGameRooms] = useState<GameRoom[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Load game rooms on mount
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const rooms = await getGameRooms();
        setGameRooms(rooms);
      } catch (error) {
        console.error('Error loading game rooms:', error);
        setErrorMessage('Failed to load game rooms');
      }
    };
    
    loadRooms();
    
    // Subscribe to game rooms changes
    const unsubscribe = subscribeToGameRooms((rooms) => {
      setGameRooms(rooms);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Subscribe to players when room changes
  useEffect(() => {
    if (!currentRoomId) return;
    
    // Subscribe to players in the room
    const unsubscribe = subscribeToroomPlayers(currentRoomId, (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });
    
    return () => {
      unsubscribe();
    };
  }, [currentRoomId]);
  
  // Handle window/tab close to disconnect player
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (currentPlayer && currentRoomId) {
        try {
          await updatePlayerConnection(currentRoomId, currentPlayer.id, false);
        } catch (error) {
          console.error('Error updating player connection on unload:', error);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentPlayer, currentRoomId]);
  
  // Create a new game room
  const createRoom = useCallback(async (name: string): Promise<string> => {
    try {
      const room = await createGameRoom(name);
      return room.id;
    } catch (error) {
      console.error('Error creating game room:', error);
      setErrorMessage('Failed to create game room');
      throw error;
    }
  }, []);
  
  // Join a game
  const joinGame = useCallback(async (name: string, roomId?: string): Promise<void> => {
    try {
      setGameState(GameState.JOINING);
      setErrorMessage(null);
      
      // If no roomId is provided, use the first available room or create a new one
      let selectedRoomId = roomId;
      
      if (!selectedRoomId) {
        if (gameRooms.length > 0) {
          selectedRoomId = gameRooms[0].id;
        } else {
          // Create a default room
          const newRoom = await createGameRoom('Default Room');
          selectedRoomId = newRoom.id;
        }
      }
      
      // Add player to the selected room
      const player = await addPlayer(selectedRoomId, name);
      
      // Update state
      setCurrentPlayer(player);
      setCurrentRoomId(selectedRoomId);
      setGameState(GameState.ACTIVE);
      
      // Navigate to local view
      navigate('/local');
    } catch (error) {
      console.error('Error joining game:', error);
      setErrorMessage('Failed to join the game');
      setGameState(GameState.ERROR);
    }
  }, [gameRooms, navigate, createRoom]);
  
  // Leave the game
  const leaveGame = useCallback(async (): Promise<void> => {
    if (currentPlayer && currentRoomId) {
      try {
        await removePlayer(currentRoomId, currentPlayer.id);
        
        // Reset state
        setCurrentPlayer(null);
        setCurrentRoomId(null);
        setGameState(GameState.IDLE);
        
        // Navigate to home
        navigate('/');
      } catch (error) {
        console.error('Error leaving game:', error);
        setErrorMessage('Failed to leave the game');
      }
    }
  }, [currentPlayer, currentRoomId, navigate]);
  
  // Update player position
  const updatePlayerPosition = useCallback((x: number, y: number): void => {
    if (!currentPlayer || !currentRoomId) return;
    
    // Calculate velocity based on position changes
    const vx = x - (currentPlayer.x || 0);
    const vy = y - (currentPlayer.y || 0);
    
    // Update in Firestore
    updateFirestorePosition(currentRoomId, currentPlayer.id, x, y, vx, vy)
      .catch((error) => {
        console.error('Error updating player position:', error);
      });
      
    // Update local state for immediate feedback
    setCurrentPlayer(prev => prev ? {
      ...prev,
      x,
      y,
      vx,
      vy
    } : null);
  }, [currentPlayer, currentRoomId]);
  
  // Context value
  const contextValue: GameContextType = {
    gameState,
    currentPlayer,
    players,
    gameRooms,
    currentRoomId,
    errorMessage,
    joinGame,
    leaveGame,
    updatePlayerPosition,
    createRoom,
    addItemToCart: addFirestoreItemToCart
  };
  
  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

export default GameContext;
