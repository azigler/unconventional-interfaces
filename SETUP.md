# Project Setup Guide

This guide will walk you through setting up the Marble Tilt development environment, including local HTTPS which is required for the device orientation API.

## Prerequisites

- Node.js (v14+ recommended)
- npm or yarn
- mkcert (for local SSL certificates)

## Step 1: Install mkcert for Local SSL Certificates

mkcert is a simple tool for creating locally-trusted development certificates. It's necessary because the Device Orientation API requires HTTPS.

### On macOS:

```bash
# Using Homebrew
brew install mkcert
brew install nss  # For Firefox support (optional)

# Install the local CA
mkcert -install
```

### On Windows:

```bash
# Using Chocolatey
choco install mkcert

# Install the local CA
mkcert -install
```

### On Linux:

```bash
# Install certutil
sudo apt install libnss3-tools

# Install mkcert
# Download from https://github.com/FiloSottile/mkcert/releases
# Or build from source

# Install the local CA
mkcert -install
```

## Step 2: Generate SSL Certificates

Create a directory for your certificates and generate them:

```bash
# Create a certs directory
mkdir -p certs
cd certs

# Generate certificates for localhost and local IP
mkcert localhost 127.0.0.1 ::1

# Rename for easier access in code
mv localhost+2.pem cert.pem
mv localhost+2-key.pem key.pem

# Go back to project root
cd ..
```

## Step 3: Initialize the React + Vite Project

Create a new React project using Vite with TypeScript:

```bash
# Create a new project
npm create vite@latest marble-tilt -- --template react-ts

# Navigate to the project directory
cd marble-tilt

# Install dependencies
npm install
```

## Step 4: Configure Vite for HTTPS

Create or modify the `vite.config.ts` file to use HTTPS:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../certs/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../certs/cert.pem')),
    },
    host: true, // Expose to local network
    port: 3000,
  },
});
```

## Step 5: Install Additional Dependencies

```bash
# React Router for navigation
npm install react-router-dom

# WebSocket client
npm install socket.io-client

# QR code generation
npm install qrcode.react

# For TypeScript types
npm install -D @types/react-router-dom @types/qrcode.react
```

## Step 6: Set Up the Backend Server

Create a directory for the server code:

```bash
# Create server directory
mkdir -p server
cd server

# Initialize package.json
npm init -y

# Install server dependencies
npm install express ws https cors
npm install -D typescript ts-node @types/express @types/ws @types/node @types/cors
```

Create a TypeScript configuration file (`tsconfig.json`):

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Step 7: Create a Basic Server

Create a file at `server/src/server.ts`:

```typescript
import express from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { WebSocketServer } from 'ws';
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
```

## Step 8: Add npm Scripts

Add these scripts to the server's `package.json`:

```json
"scripts": {
  "start": "ts-node src/server.ts",
  "dev": "ts-node-dev --respawn src/server.ts",
  "build": "tsc",
  "serve": "node dist/server.js"
}
```

Add these scripts to the client's `package.json`:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "serve": "vite preview",
  "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
}
```

## Step 9: Create Project Root package.json

Create a package.json in the project root for running both client and server:

```json
{
  "name": "marble-tilt",
  "version": "1.0.0",
  "description": "Multiplayer marble game using phone tilt controls",
  "scripts": {
    "client": "cd marble-tilt && npm run dev",
    "server": "cd server && npm run dev",
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "install-all": "npm install && cd marble-tilt && npm install && cd ../server && npm install",
    "build": "cd marble-tilt && npm run build && cd ../server && npm run build"
  },
  "dependencies": {
    "concurrently": "^7.0.0"
  }
}
```

## Step 10: Testing the Setup

1. Install all dependencies:
   ```bash
   npm run install-all
   ```

2. Start the development environment:
   ```bash
   npm run dev
   ```

3. Access the client in your browser:
   - HTTPS client: `https://localhost:3000`
   - Server check: `https://localhost:3001`

4. To test on mobile devices:
   - Make sure your computer and phone are on the same network
   - Use your computer's local IP address instead of localhost
   - Accept the SSL certificate warning on your mobile device

## Troubleshooting

### Certificate Issues
- Make sure to trust the mkcert root CA on all devices
- For mobile testing, you may need to manually install the CA certificate

### Network Issues
- Check firewall settings to ensure ports 3000 and 3001 are open
- If using a VPN, it might interfere with local network discovery

### WebSocket Connection Problems
- Verify that the WebSocket URL is using WSS (secure WebSocket)
- Check browser console for any CORS-related errors
