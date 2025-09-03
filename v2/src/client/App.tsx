import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { GameProvider } from './contexts/GameContext';
import HomeView from './views/HomeView';
import LobbyView from './views/LobbyView';
import LocalView from './views/LocalView';
import StoreView from './views/StoreView';
import './App.css';

const App = () => {
  const [isOrientationSupported, setIsOrientationSupported] = useState<boolean>(false);
  
  // Check for device orientation support on component mount
  useEffect(() => {
    const checkOrientationSupport = () => {
      const isSupported = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
      setIsOrientationSupported(isSupported);
    };
    
    checkOrientationSupport();
  }, []);
  
  return (
    <GameProvider>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<HomeView isOrientationSupported={isOrientationSupported} />} />
          <Route path="/lobby" element={<LobbyView />} />
          <Route path="/local" element={<LocalView />} />
          <Route path="/store" element={<StoreView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </GameProvider>
  );
};

export default App;
