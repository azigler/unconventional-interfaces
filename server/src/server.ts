import express from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';

// Express app setup
const app = express();
app.use(cors());
const PORT = process.env.PORT || 3001;

// SSL options using the certificates we generated
const sslOptions = {
  key: fs.readFileSync(path.resolve(__dirname, '../../certs/key.pem')),
  cert: fs.readFileSync(path.resolve(__dirname, '../../certs/cert.pem'))
};

// Create HTTPS server
const server = https.createServer(sslOptions, app);

// WebSocket server
const wss = new WebSocketServer({ server });

// Game state
const gameState = {
  players: new Map(),
  nextPlayerId: 1
};

// WebSocket connection handling
wss.on('connection', (ws) => {
  // Assign player ID and color
  const playerId = gameState.nextPlayerId++;
  const playerColor = getRandomColor();
  
  console.log(`Player ${playerId} connected`);
  
  // Add player to game state
  gameState.players.set(playerId, {
    id: playerId,
    x: 250,
    y: 250,
    color: playerColor,
    velocityX: 0,
    velocityY: 0,
    lastUpdate: Date.now()
  });
  
  // Send player their ID
  ws.send(JSON.stringify({
    type: 'init',
    playerId: playerId,
    color: playerColor
  }));
  
  // Send current game state to new player
  const playersArray = Array.from(gameState.players.values());
  ws.send(JSON.stringify({
    type: 'gameState',
    players: playersArray
  }));
  
  // Message handling
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'update') {
        // Update player position
        const player = gameState.players.get(data.playerId);
        if (player) {
          player.x = data.x;
          player.y = data.y;
          player.velocityX = data.velocityX;
          player.velocityY = data.velocityY;
          player.lastUpdate = Date.now();
        }
        
        // Broadcast updated game state to all clients
        broadcastGameState();
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    console.log(`Player ${playerId} disconnected`);
    gameState.players.delete(playerId);
    broadcastGameState();
  });
});

// Broadcast game state to all connected clients
function broadcastGameState() {
  const playersArray = Array.from(gameState.players.values());
  const message = JSON.stringify({
    type: 'gameState',
    players: playersArray
  });
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Generate random color for players
function getRandomColor() {
  const colors = [
    '#2196F3', // Blue
    '#4CAF50', // Green
    '#F44336', // Red
    '#FF9800', // Orange
    '#9C27B0', // Purple
    '#FFEB3B', // Yellow
    '#E91E63', // Pink
    '#00BCD4'  // Cyan
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Add a basic route for testing
app.get('/', (req, res) => {
  res.send('Marble Tilt WebSocket Server Running');
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on https://localhost:${PORT}`);
});
