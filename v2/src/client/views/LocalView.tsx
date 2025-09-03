import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import OrientationControls from '../components/Controls/OrientationControls';
import MarbleWorld from '../components/MarbleWorld/MarbleWorld';
import './LocalView.css';

// Add debug functionality to window object
declare global {
  interface Window {
    MarbleDebug?: {
      debugOrientationData: (data: any) => void;
      debugPhysicsUpdate: (body: any) => void;
      debugServerUpdate: (x: number, y: number, vx: number, vy: number) => void;
      debugVelocityChange: (oldVel: any, newVel: any) => void;
      debugPositionDelta: (oldPos: any, newPos: any) => void;
      enable: (option?: string) => void;
      disable: (option?: string) => void;
    };
  }
}

interface MarblePosition {
  x: number;
  y: number;
}

const LocalView: React.FC = () => {
  const navigate = useNavigate();
  const { currentPlayer, gameState, updatePlayerPosition, leaveGame } = useGame();
  
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [marblePosition, setMarblePosition] = useState<MarblePosition>({ x: 0, y: 0 });
  const [orientationData, setOrientationData] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const lastUpdateTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  
  // Redirect to home if not in active game
  useEffect(() => {
    if (gameState !== 'active' || !currentPlayer) {
      navigate('/');
    }
  }, [gameState, currentPlayer, navigate]);
  
  // Debugging setup
  useEffect(() => {
    // Load the debugging script
    const script = document.createElement('script');
    script.src = '/debug-marbles.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      // Clean up script when component unmounts
      document.body.removeChild(script);
    };
  }, []);
  
  // Handle orientation changes from the controls
  const handleOrientationChange = (movement: { x: number, y: number }) => {
    if (!currentPlayer) return;
    
    // Store orientation data for the physics simulation
    setOrientationData(movement);
    
    // Debug output for orientation data
    if (showDebug) {
      console.log('Orientation data:', movement);
    }
  };
  
  // Handle leave game
  const handleLeaveGame = async () => {
    await leaveGame();
    navigate('/');
  };
  
  // Loading state
  if (!currentPlayer) {
    return (
      <div className="local-view">
        <div className="loading-screen">
          <h2>Loading Game...</h2>
        </div>
      </div>
    );
  }
  
  return (
    <div className="local-view">
      <header className="local-header">
        <h1>Marble Tilt</h1>
        <div className="player-info">
          <div 
            className="player-color" 
            style={{ backgroundColor: currentPlayer?.color }}
          ></div>
          <span className="player-name">{currentPlayer?.name}</span>
        </div>
      </header>
      
      <main className="local-main">
        <div className="marble-view">
          <MarbleWorld 
            isLocalView={true}
            width={window.innerWidth}
            height={window.innerHeight * 0.5}
            orientationData={orientationData}
          />
        </div>
        
        <div className="controls-container">
          <OrientationControls 
            onOrientationChange={handleOrientationChange}
            debug={showDebug}
            sensitivity={0.4} 
          />
          
          <div className="debug-toggle-container">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="debug-toggle"
            >
              {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
            </button>
            
            {/* Debug Control Buttons */}
            {showDebug && window.MarbleDebug && (
              <div className="debug-controls">
                <button onClick={() => window.MarbleDebug?.enable()} className="debug-button">
                  Enable All Debugging
                </button>
                <button onClick={() => window.MarbleDebug?.disable()} className="debug-button">
                  Disable All Debugging
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="local-footer">
        <button 
          onClick={handleLeaveGame}
          className="leave-button"
        >
          Leave Game
        </button>
        
        <button
          onClick={() => navigate('/store')}
          className="store-button"
        >
          Visit Store
        </button>
      </footer>
    </div>
  );
};

export default LocalView;
