import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Contexts
import { WebSocketProvider } from './client/contexts/WebSocketContext';
import { GameProvider } from './client/contexts/GameContext';
import { GameStateProvider } from './client/contexts/GameStateContext';

// Views
import HomeView from './client/views/HomeView';
import LobbyView from './client/views/LobbyView';
import LocalView from './client/views/LocalView';
import StoreView from './client/views/StoreView';
import OrientationDemo from './demo/OrientationDemo';

const App: React.FC = () => {
  return (
    <Router>
      <WebSocketProvider>
        <GameStateProvider>
          <div className="App">
            <Routes>
              <Route path="/" element={<HomeView />} />
              <Route path="/lobby" element={<LobbyView />} />
              <Route path="/local" element={<LocalView />} />
              <Route path="/store" element={<StoreView />} />
              <Route path="/demo" element={<OrientationDemo />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </GameStateProvider>
      </WebSocketProvider>
    </Router>
  );
};

export default App;
