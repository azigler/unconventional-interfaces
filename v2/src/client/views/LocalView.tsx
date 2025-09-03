import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import OrientationControls from '../components/Controls/OrientationControls';
import MarbleWorldStore from '../components/MarbleWorldStore/MarbleWorldStore';
import './LocalView.css';

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
        <h1>Marble Store</h1>
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
          <MarbleWorldStore 
            isLocalView={true}
            width={window.innerWidth}
            height={window.innerHeight * 0.7}
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
      </footer>
    </div>
  );
};

export default LocalView;
