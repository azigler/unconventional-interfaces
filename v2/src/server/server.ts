import express from 'express';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
try {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
} catch (error) {
  console.warn('Firebase initialization error:', error);
  console.warn('Will attempt to use Application Default Credentials');
  
  // Try initializing with application default credentials
  initializeApp();
}

// Get Firestore instance
const db = getFirestore();

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP/HTTPS server
let server;
try {
  // Try to use HTTPS (required for device orientation API)
  // First, try the localhost+2 format in the project root
  let sslOptions;
  if (fs.existsSync(path.join(__dirname, '../../localhost+2-key.pem')) && 
      fs.existsSync(path.join(__dirname, '../../localhost+2.pem'))) {
    sslOptions = {
      key: fs.readFileSync(path.join(__dirname, '../../localhost+2-key.pem')),
      cert: fs.readFileSync(path.join(__dirname, '../../localhost+2.pem'))
    };
    console.log('Using localhost+2 certificates from project root');
  } 
  // Fall back to the original certificate path
  else if (fs.existsSync(path.join(__dirname, '../../../certs/localhost-key.pem')) && 
           fs.existsSync(path.join(__dirname, '../../../certs/localhost.pem'))) {
    sslOptions = {
      key: fs.readFileSync(path.join(__dirname, '../../../certs/localhost-key.pem')),
      cert: fs.readFileSync(path.join(__dirname, '../../../certs/localhost.pem'))
    };
    console.log('Using localhost certificates from certs directory');
  }
  else {
    throw new Error('No SSL certificates found');
  }
  
  server = https.createServer(sslOptions, app);
  console.log('Using HTTPS server');
} catch (error) {
  // Fall back to HTTP if certificates are not available
  console.warn('SSL certificates not found or error occurred, falling back to HTTP (device orientation may not work):', 
    error instanceof Error ? error.message : 'Unknown error');
  server = http.createServer(app);
}

// Create Socket.IO server
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Join a room
  socket.on('joinRoom', async (roomId) => {
    socket.join(roomId);
    console.log(`Client ${socket.id} joined room ${roomId}`);
  });
  
  // Leave a room
  socket.on('leaveRoom', async (roomId) => {
    socket.leave(roomId);
    console.log(`Client ${socket.id} left room ${roomId}`);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API endpoints
app.get('/api/rooms', async (req, res) => {
  try {
    const roomsSnapshot = await db.collection('game_rooms').get();
    const rooms = roomsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Get players in a room
app.get('/api/rooms/:roomId/players', async (req, res) => {
  try {
    const { roomId } = req.params;
    const playersSnapshot = await db.collection('game_rooms').doc(roomId).collection('players').get();
    
    const players = playersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
