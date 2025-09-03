#!/bin/bash

# Marble Tilt - Project Setup Script
# This script initializes the project structure and sets up the development environment

# Print colored messages
print_green() {
  echo -e "\033[0;32m$1\033[0m"
}

print_blue() {
  echo -e "\033[0;34m$1\033[0m"
}

print_red() {
  echo -e "\033[0;31m$1\033[0m"
}

print_yellow() {
  echo -e "\033[0;33m$1\033[0m"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  print_red "Node.js is not installed. Please install Node.js and try again."
  exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  print_red "npm is not installed. Please install npm and try again."
  exit 1
fi

# Create project directories
print_blue "Creating project directories..."
mkdir -p certs

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
  print_yellow "mkcert is not installed."
  
  # Check the OS
  if [[ "$OSTYPE" == "darwin"* ]]; then
    print_yellow "Installing mkcert using Homebrew..."
    brew install mkcert
    brew install nss  # For Firefox support
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    print_yellow "Please install mkcert manually:"
    print_yellow "  - For Ubuntu/Debian: sudo apt install libnss3-tools"
    print_yellow "  - Then download mkcert from https://github.com/FiloSottile/mkcert/releases"
    exit 1
  elif [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "cygwin"* ]]; then
    print_yellow "Please install mkcert using Chocolatey:"
    print_yellow "  choco install mkcert"
    exit 1
  else
    print_red "Unknown OS. Please install mkcert manually."
    exit 1
  fi
fi

# Generate certificates
print_blue "Generating SSL certificates for local development..."
cd certs
mkcert -install
mkcert localhost 127.0.0.1 ::1
mv localhost+2.pem cert.pem
mv localhost+2-key.pem key.pem
cd ..

# Create React + Vite project
print_blue "Creating React + Vite project with TypeScript..."
npm create vite@latest marble-tilt -- --template react-ts

# Navigate to the client directory and install dependencies
print_blue "Installing client dependencies..."
cd marble-tilt
npm install react-router-dom socket.io-client qrcode.react
npm install -D @types/react-router-dom @types/qrcode.react

# Configure Vite for HTTPS
print_blue "Configuring Vite for HTTPS..."
cat > vite.config.ts << EOF
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
EOF

# Return to project root
cd ..

# Create server directory
print_blue "Setting up server with TypeScript..."
mkdir -p server/src
cd server

# Initialize package.json for the server
npm init -y

# Install server dependencies
npm install express ws https cors
npm install -D typescript ts-node ts-node-dev @types/express @types/ws @types/node @types/cors

# Create TypeScript configuration
cat > tsconfig.json << EOF
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
EOF

# Add scripts to package.json
npm pkg set scripts.start="ts-node src/server.ts"
npm pkg set scripts.dev="ts-node-dev --respawn src/server.ts"
npm pkg set scripts.build="tsc"
npm pkg set scripts.serve="node dist/server.js"

# Create a basic server file
print_blue "Creating basic WebSocket server..."
cat > src/server.ts << EOF
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
  
  console.log(\`Player \${playerId} connected\`);
  
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
    console.log(\`Player \${playerId} disconnected\`);
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
  console.log(\`Server running on https://localhost:\${PORT}\`);
});
EOF

# Return to project root
cd ..

# Create root package.json for running both client and server
print_blue "Creating root package.json for project management..."
cat > package.json << EOF
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
EOF

# Install root dependencies
npm install

print_green "Setup complete! To start the development server:"
print_yellow "  npm run install-all  # Install all dependencies"
print_yellow "  npm run dev          # Start both client and server"
print_blue "Client will be available at: https://localhost:3000"
print_blue "Server will be available at: https://localhost:3001"

print_yellow "Note: When accessing on mobile devices, you'll need to accept the certificate warning."
print_yellow "Use your computer's local IP address instead of localhost when accessing from other devices."
