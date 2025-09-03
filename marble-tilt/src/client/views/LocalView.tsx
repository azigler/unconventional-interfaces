import React, { useState, useEffect } from 'react';
import OrientationControls from '../components/Controls/OrientationControls';
import { useGame } from '../contexts/GameContext';
import './LocalView.css';

const LocalView: React.FC = () => {
  const { joinGame, leaveGame, gameState, errorMessage, updatePlayerPosition, playerMarble } = useGame();
  const [playerName, setPlayerName] = useState<string>('');
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [showDebug, setShowDebug] = useState<boolean>(false);

  // Handle joining the game
  const handleJoinGame = () => {
    setIsJoining(true);
    joinGame(playerName);
  };

  // Handle orientation changes from the controls
  const handleOrientationChange = (movement: { x: number, y: number }) => {
    if (gameState === 'active') {
      updatePlayerPosition(movement.x, movement.y);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (gameState === 'active') {
        leaveGame();
      }
    };
  }, [gameState, leaveGame]);

  // Show join screen if not yet joined
  if (gameState === 'idle' && !isJoining) {
    return (
      <div className="local-view">
        <h1>Marble Tilt</h1>
        <div className="join-container">
          <h2>Join the Game</h2>
          <p>
            Enter your name and join the shared marble world. Tilt your device
            to control your marble!
          </p>
          
          <div className="join-form">
            <input
              type="text"
              placeholder="Your Name (optional)"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="name-input"
            />
            
            <button 
              onClick={handleJoinGame}
              className="join-button"
            >
              Join Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading screen while joining
  if (gameState === 'joining' || (gameState === 'idle' && isJoining)) {
    return (
      <div className="local-view">
        <h1>Marble Tilt</h1>
        <div className="loading">
          <p>Connecting to the game...</p>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // Show error screen if there's an error
  if (gameState === 'error') {
    return (
      <div className="local-view">
        <h1>Marble Tilt</h1>
        <div className="error-container">
          <h2>Error</h2>
          <p>{errorMessage || 'Something went wrong'}</p>
          <button 
            onClick={() => {
              setIsJoining(false);
              joinGame(playerName);
            }}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show game view once active
  return (
    <div className="local-view">
      <h1>Marble Tilt</h1>
      
      <div className="player-info">
        <div 
          className="player-color" 
          style={{ backgroundColor: playerMarble?.color || '#ccc' }}
        ></div>
        <p className="player-name">
          {playerMarble?.name || 'Your Marble'}
        </p>
      </div>

      <div className="controls-container">
        <OrientationControls 
          onOrientationChange={handleOrientationChange}
          debug={showDebug}
        />
      </div>

      <div className="game-info">
        <p className="status">
          Game active! Tilt your device to move.
        </p>
        
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="debug-toggle"
        >
          {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
        </button>
      </div>

      <div className="local-instructions">
        <h2>How to Play</h2>
        <p>
          <strong>Tilt your device</strong> to control your marble in the shared world.
        </p>
        <p>
          <strong>Calibrate</strong> if needed to set your current device position as neutral.
        </p>
        <p>
          For the best view of all marbles, open the LOBBY view on a larger screen.
        </p>
      </div>
    </div>
  );
};

export default LocalView;
