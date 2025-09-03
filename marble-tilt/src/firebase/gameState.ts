import { db } from './config';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot,
  query,
  Timestamp 
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

// Define player interface
export interface CartItem {
  id: string;
  name: string;
  quantity: number;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  lastUpdated: Timestamp;
  connected: boolean;
  cart: CartItem[];
}

// Collection references
const GAME_STATE_COLLECTION = 'game_state';
const PLAYERS_COLLECTION = 'players';

// Generate a random color for players
export const getRandomColor = (): string => {
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

// Add a new player to the game
export const addPlayer = async (name: string = ''): Promise<Player> => {
  const playerId = uuidv4();
  const playerName = name || `Player ${playerId.substring(0, 4)}`;
  
  const player: Player = {
    id: playerId,
    name: playerName,
    color: getRandomColor(),
    x: 0,
    y: 0,
    lastUpdated: Timestamp.now(),
    connected: true,
    cart: []
  };
  
  await setDoc(
    doc(db, GAME_STATE_COLLECTION, PLAYERS_COLLECTION, playerId), 
    player
  );
  
  return player;
};

// Update a player's position
export const updatePlayerPosition = async (
  playerId: string, 
  x: number, 
  y: number
): Promise<void> => {
  const playerRef = doc(db, GAME_STATE_COLLECTION, PLAYERS_COLLECTION, playerId);
  
  await updateDoc(playerRef, {
    x,
    y,
    lastUpdated: Timestamp.now()
  });
};

// Update player connection status
export const updatePlayerConnection = async (
  playerId: string,
  connected: boolean
): Promise<void> => {
  const playerRef = doc(db, GAME_STATE_COLLECTION, PLAYERS_COLLECTION, playerId);
  
  await updateDoc(playerRef, {
    connected,
    lastUpdated: Timestamp.now()
  });
};

// Add an item to a player's cart
export const addItemToCart = async (
  playerId: string,
  item: Omit<CartItem, 'id'>
): Promise<void> => {
  const playerRef = doc(db, GAME_STATE_COLLECTION, PLAYERS_COLLECTION, playerId);
  const itemId = uuidv4();
  
  // Get current player data to append to the cart
  const playerDoc = await getDocs(query(collection(db, GAME_STATE_COLLECTION, PLAYERS_COLLECTION)));
  const playerData = playerDoc.docs.find(doc => doc.id === playerId)?.data() as Player | undefined;
  
  if (!playerData) {
    throw new Error(`Player with ID ${playerId} not found`);
  }
  
  const newCart = [
    ...playerData.cart,
    {
      id: itemId,
      name: item.name,
      quantity: item.quantity
    }
  ];
  
  await updateDoc(playerRef, {
    cart: newCart,
    lastUpdated: Timestamp.now()
  });
};

// Remove a player from the game
export const removePlayer = async (playerId: string): Promise<void> => {
  await deleteDoc(doc(db, GAME_STATE_COLLECTION, PLAYERS_COLLECTION, playerId));
};

// Subscribe to changes in all players
export const subscribeToPlayers = (
  callback: (players: Player[]) => void
): (() => void) => {
  const playersRef = collection(db, GAME_STATE_COLLECTION, PLAYERS_COLLECTION);
  
  return onSnapshot(playersRef, (snapshot) => {
    const players = snapshot.docs.map(doc => doc.data() as Player);
    callback(players);
  });
};
