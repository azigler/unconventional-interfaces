import { Timestamp } from 'firebase/firestore';

/**
 * Cart item interface
 */
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Player interface
 */
export interface Player {
  id: string;
  roomId: string;
  name: string;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  lastUpdated: Timestamp;
  connected: boolean;
  cart: CartItem[];
}

/**
 * Game room interface
 */
export interface GameRoom {
  id: string;
  name: string;
  createdAt: Timestamp;
  active: boolean;
  playerCount: number;
}

/**
 * Store item interface
 */
export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
}

/**
 * Game state enum
 */
export enum GameState {
  IDLE = 'idle',
  JOINING = 'joining',
  ACTIVE = 'active',
  ERROR = 'error'
}

/**
 * Orientation data interface
 */
export interface OrientationData {
  alpha: number | null;  // z-axis rotation in degrees (0-360)
  beta: number | null;   // x-axis rotation in degrees (-180-180)
  gamma: number | null;  // y-axis rotation in degrees (-90-90)
  absolute: boolean;     // whether the device provides absolute orientation data
  error: string | null;  // error message if device orientation is not available
}
