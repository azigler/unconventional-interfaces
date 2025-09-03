import express from 'express';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { WebSocketServer } from 'ws';
import cors from 'cors';

// Game state
interface Marble {
  id: string;
  x: number;
  y: number;
  color: string;
  name?: string;
}

interface GameState {
  marbles: Marble[];
}

// Initialize game state
const gameState: GameState = {
  marbles: []
};

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP/HTTPS server
let server;
try {
  // Try to use HTTPS (required for device orientation API)
  const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, '../../certs/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../../certs/cert.pem'))
  };
  server = https.createServer(sslOptions, app);
  console.log('Using HTTPS server');
} catch (error) {
  // Fall back to HTTP if certificates are not available
  console.warn('SSL certificates not found, falling back to HTTP (device orientation may not work)');
  server = http.createServer(app);
}

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Map to store WebSocket connections by player ID
const clients = new Map<string, WebSocket>();

// Helper functions
const broadcast = (message: any) => {
  const messageStr = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
};

const sendToPlayer = (playerId: string, message: any) => {
  const client = clients.get(playerId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
};

// Game logic
const addPlayer = (playerId: string, marble: Marble): boolean => {
  // Check if player already exists
  const existingPlayer = gameState.marbles.find(m => m.id === playerId);
  if (existingPlayer) {
    return false;
  }

  // Add player to game
  gameState.marbles.push({
    ...marble,
    // Center the marble
    x: 0,
    y: 0
  });

  return true;
};

const removePlayer = (playerId: string): boolean => {
  const initialLength = gameState.marbles.length;
  gameState.marbles = gameState.marbles.filter(marble => marble.id !== playerId);
  return gameState.marbles.length !== initialLength;
};

const updatePlayerPosition = (playerId: string, x: number, y: number, absolute: boolean): boolean => {
  const marbleIndex = gameState.marbles.findIndex(marble => marble.id === playerId);
  if (marbleIndex === -1) return false;

  const marble = gameState.marbles[marbleIndex];
  
  // Ensure the marble stays within bounds (assuming a 800x500 world)
  const worldWidth = 800;
  const worldHeight = 500;
  const marbleRadius = 15; // Half of marble width
  const maxX = worldWidth / 2 - marbleRadius;
  const maxY = worldHeight / 2 - marbleRadius;
  
  if (absolute) {
    // Absolute positioning
    marble.x = Math.max(-maxX, Math.min(maxX, x));
    marble.y = Math.max(-maxY, Math.min(maxY, y));
  } else {
    // Relative positioning
    marble.x = Math.max(-maxX, Math.min(maxX, marble.x + x));
    marble.y = Math.max(-maxY, Math.min(maxY, marble.y + y));
  }
  
  return true;
};

// WebSocket connection handling
wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');
  let playerId: string | null = null;

  // Send current game state to new client
  ws.send(JSON.stringify({
    type: 'gameState',
    data: gameState
  }));

  // Handle messages from client
  ws.on('message', (message: string) => {
    try {
      const parsedMessage = JSON.parse(message.toString());
      const { type, data } = parsedMessage;

      switch (type) {
        case 'joinGame':
          playerId = data.playerId;
          clients.set(playerId, ws);
          
          if (addPlayer(playerId, data.marble)) {
            console.log(`Player ${playerId} joined`);
            broadcast({
              type: 'playerJoined',
              data: {
                player: data,
                marbles: gameState.marbles
              }
            });
          }
          break;
        
        case 'leaveGame':
          if (data.playerId && removePlayer(data.playerId)) {
            console.log(`Player ${data.playerId} left`);
            broadcast({
              type: 'playerLeft',
              data: {
                playerId: data.playerId,
                marbles: gameState.marbles
              }
            });
          }
          break;
        
        case 'updatePosition':
          if (data.playerId && updatePlayerPosition(data.playerId, data.x, data.y, data.absolute)) {
            // Broadcast updated positions to all clients
            broadcast({
              type: 'gameState',
              data: gameState
            });
          }
          break;
        
        default:
          console.log(`Unknown message type: ${type}`);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
    
    // Remove player from game if they were logged in
    if (playerId) {
      clients.delete(playerId);
      
      if (removePlayer(playerId)) {
        console.log(`Player ${playerId} removed due to disconnection`);
        broadcast({
          type: 'playerLeft',
          data: {
            playerId,
            marbles: gameState.marbles
          }
        });
      }
    }
  });
});

// API endpoints
app.get('/api/game-state', (req, res) => {
  res.json(gameState);
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
