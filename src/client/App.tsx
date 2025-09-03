import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { GameProvider } from './contexts/GameContext';
import LobbyView from './views/LobbyView';
import LocalView from './views/LocalView';
import HomeView from './views/HomeView';
import './App.css';

// Sample obstacles for testing
const sampleObstacles = [
  {
    id: 'wall1',
    x: 150,
    y: 150,
    radius: 30,
    type: 'wall' as const,
  },
  {
    id: 'bumper1',
    x: 300,
    y: 200,
    radius: 25,
    type: 'bumper' as const,
  },
  {
    id: 'hole1',
    x: 450,
    y: 350,
    radius: 20,
    type: 'hole' as const,
  },
  {
    id: 'teleporter1',
    x: 100,
    y: 400,
    radius: 15,
    type: 'teleporter' as const,
  },
];

/**
 * Main App component
 * Sets up routing and context providers
 */
const App: React.FC = () => {
  // WebSocket server URL (secure connection)
  const wsUrl = window.location.hostname === 'localhost' 
    ? `wss://localhost:3001` 
    : `wss://${window.location.host}/ws`;
  
  return (
    <WebSocketProvider serverUrl={wsUrl}>
      <GameProvider initialObstacles={sampleObstacles}>
        <Router>
          <Routes>
            {/* Home screen */}
            <Route path="/" element={<HomeView />} />
            
            {/* Lobby view (for large screens) */}
            <Route path="/lobby" element={<LobbyView />} />
            
            {/* Local player view (for mobile) */}
            <Route path="/local" element={<LocalView />} />
            
            {/* Redirect unmatched routes to home */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </GameProvider>
    </WebSocketProvider>
  );
};

export default App;
