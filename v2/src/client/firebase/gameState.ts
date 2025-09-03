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
  Timestamp,
  serverTimestamp,
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Player, CartItem, GameRoom } from '@shared/types/game';

// Collection references
const GAME_ROOMS_COLLECTION = 'game_rooms';
const PLAYERS_COLLECTION = 'players';

// Get a random color for players
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

/**
 * Create a new game room
 */
export const createGameRoom = async (name: string): Promise<GameRoom> => {
  const roomId = uuidv4();
  
  const gameRoom: GameRoom = {
    id: roomId,
    name: name || `Game ${roomId.substring(0, 4)}`,
    createdAt: serverTimestamp() as Timestamp,
    active: true,
    playerCount: 0
  };
  
  await setDoc(doc(db, GAME_ROOMS_COLLECTION, roomId), gameRoom);
  
  return gameRoom;
};

/**
 * Get all active game rooms
 */
export const getGameRooms = async (): Promise<GameRoom[]> => {
  const roomsQuery = query(collection(db, GAME_ROOMS_COLLECTION));
  const snapshot = await getDocs(roomsQuery);
  
  return snapshot.docs
    .map(doc => doc.data() as GameRoom)
    .filter(room => room.active);
};

/**
 * Subscribe to changes in game rooms
 */
export const subscribeToGameRooms = (
  callback: (rooms: GameRoom[]) => void
): (() => void) => {
  const roomsQuery = query(collection(db, GAME_ROOMS_COLLECTION));
  
  return onSnapshot(roomsQuery, (snapshot) => {
    const rooms = snapshot.docs
      .map(doc => doc.data() as GameRoom)
      .filter(room => room.active);
    
    callback(rooms);
  });
};

/**
 * Add a player to a game room
 */
export const addPlayer = async (
  roomId: string,
  name: string = ''
): Promise<Player> => {
  const playerId = uuidv4();
  const playerName = name || `Player ${playerId.substring(0, 4)}`;
  
  const player: Player = {
    id: playerId,
    roomId,
    name: playerName,
    color: getRandomColor(),
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    lastUpdated: serverTimestamp() as Timestamp,
    connected: true,
    cart: []
  };
  
  // Use a batch to update both the player document and increment the room's player count
  const batch = writeBatch(db);
  
  // Add player document
  batch.set(doc(db, GAME_ROOMS_COLLECTION, roomId, PLAYERS_COLLECTION, playerId), player);
  
  // Update room's player count
  const roomRef = doc(db, GAME_ROOMS_COLLECTION, roomId);
  const roomSnap = await getDoc(roomRef);
  
  if (roomSnap.exists()) {
    const roomData = roomSnap.data() as GameRoom;
    batch.update(roomRef, { 
      playerCount: (roomData.playerCount || 0) + 1 
    });
  }
  
  await batch.commit();
  
  return player;
};

/**
 * Update a player's position and velocity
 */
export const updatePlayerPosition = async (
  roomId: string,
  playerId: string,
  x: number,
  y: number,
  vx: number,
  vy: number
): Promise<void> => {
  const playerRef = doc(db, GAME_ROOMS_COLLECTION, roomId, PLAYERS_COLLECTION, playerId);
  
  await updateDoc(playerRef, {
    x,
    y,
    vx,
    vy,
    lastUpdated: serverTimestamp()
  });
};

/**
 * Update player connection status
 */
export const updatePlayerConnection = async (
  roomId: string,
  playerId: string,
  connected: boolean
): Promise<void> => {
  const playerRef = doc(db, GAME_ROOMS_COLLECTION, roomId, PLAYERS_COLLECTION, playerId);
  
  await updateDoc(playerRef, {
    connected,
    lastUpdated: serverTimestamp()
  });
};

/**
 * Add an item to a player's cart
 */
export const addItemToCart = async (
  roomId: string,
  playerId: string,
  item: Omit<CartItem, 'id'>
): Promise<void> => {
  const playerRef = doc(db, GAME_ROOMS_COLLECTION, roomId, PLAYERS_COLLECTION, playerId);
  const itemId = uuidv4();
  
  // Get current player data to append to the cart
  const playerDoc = await getDoc(playerRef);
  
  if (!playerDoc.exists()) {
    throw new Error(`Player with ID ${playerId} not found in room ${roomId}`);
  }
  
  const playerData = playerDoc.data() as Player;
  
  const newCart = [
    ...playerData.cart,
    {
      id: itemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }
  ];
  
  await updateDoc(playerRef, {
    cart: newCart,
    lastUpdated: serverTimestamp()
  });
};

/**
 * Remove a player from a game room
 */
export const removePlayer = async (
  roomId: string,
  playerId: string
): Promise<void> => {
  // Use a batch to update both the player document and decrement the room's player count
  const batch = writeBatch(db);
  
  // Delete player document
  batch.delete(doc(db, GAME_ROOMS_COLLECTION, roomId, PLAYERS_COLLECTION, playerId));
  
  // Update room's player count
  const roomRef = doc(db, GAME_ROOMS_COLLECTION, roomId);
  const roomSnap = await getDoc(roomRef);
  
  if (roomSnap.exists()) {
    const roomData = roomSnap.data() as GameRoom;
    batch.update(roomRef, { 
      playerCount: Math.max(0, (roomData.playerCount || 0) - 1) 
    });
  }
  
  await batch.commit();
};

/**
 * Subscribe to changes in all players in a game room
 */
export const subscribeToroomPlayers = (
  roomId: string,
  callback: (players: Player[]) => void
): (() => void) => {
  const playersRef = collection(db, GAME_ROOMS_COLLECTION, roomId, PLAYERS_COLLECTION);
  
  return onSnapshot(playersRef, (snapshot) => {
    const players = snapshot.docs.map(doc => doc.data() as Player);
    callback(players);
  });
};
