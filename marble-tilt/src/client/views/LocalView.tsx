import React, { useState, useEffect, useRef } from 'react';
import OrientationControls from '../components/Controls/OrientationControls';
import './LocalView.css';

interface MarblePosition {
  x: number;
  y: number;
}

const LocalView: React.FC = () => {
  const [playerName, setPlayerName] = useState<string>('');
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [marblePosition, setMarblePosition] = useState<MarblePosition>({ x: 0, y: 0 });
  const [marbleColor, setMarbleColor] = useState<string>('#2196F3');
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);

  // Handle joining the game
  const handleJoinGame = () => {
    setIsPlaying(true);
    // Generate random color for the marble
    const colors = [
      '#2196F3', // Blue
      '#F44336', // Red
      '#4CAF50', // Green
      '#FF9800', // Orange
      '#9C27B0', // Purple
      '#00BCD4', // Cyan
      '#FFEB3B', // Yellow
      '#795548', // Brown
    ];
    setMarbleColor(colors[Math.floor(Math.random() * colors.length)]);
  };

  // Handle orientation changes from the controls
  const handleOrientationChange = (movement: { x: number, y: number }) => {
    if (!isPlaying) return;

    // Update the marble position with physics simulation
    updateMarblePhysics(movement);
  };

  // Update marble position based on movement input and physics
  const updateMarblePhysics = (movement: { x: number, y: number }) => {
    if (!containerRef.current) return;

    setMarblePosition(prev => {
      // Get container dimensions
      const containerWidth = containerRef.current?.clientWidth || 300;
      const containerHeight = containerRef.current?.clientHeight || 300;
      const marbleSize = 30; // Marble diameter in pixels
      
      // Apply movement with a reduced multiplier to adjust sensitivity
      // Reduced from 4 to 1 to prevent ball from getting stuck in corners
      const movementMultiplier = 1;
      const newX = prev.x + movement.x * movementMultiplier;
      const newY = prev.y + movement.y * movementMultiplier;

      // Calculate the boundaries to keep the marble inside the container
      const halfMarble = marbleSize / 2;
      const maxX = containerWidth / 2 - halfMarble;
      const maxY = containerHeight / 2 - halfMarble;
      
      // Apply boundary constraints
      const boundedX = Math.max(-maxX, Math.min(maxX, newX));
      const boundedY = Math.max(-maxY, Math.min(maxY, newY));

      return { x: boundedX, y: boundedY };
    });
  };

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Show join screen if not yet joined
  if (!isPlaying) {
    return (
      <div className="local-view">
        <h1>Marble Tilt</h1>
        <div className="join-container">
          <h2>Join the Game</h2>
          <p>
            Enter your name and start playing! Tilt your device
            to control your marble.
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
              Start Game
            </button>
          </div>
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
          style={{ backgroundColor: marbleColor }}
        ></div>
        <p className="player-name">
          {playerName || 'Your Marble'}
        </p>
      </div>

      <div 
        className="marble-container" 
        ref={containerRef}
      >
        <div 
          className="marble" 
          style={{
            backgroundColor: marbleColor,
            transform: `translate(${marblePosition.x}px, ${marblePosition.y}px)`
          }}
        ></div>
      </div>

      <div className="controls-container">
        <OrientationControls 
          onOrientationChange={handleOrientationChange}
          debug={showDebug}
          sensitivity={0.4} // Decreased default sensitivity from 0.8 to 0.4
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
          <strong>Tilt your device</strong> to control your marble.
        </p>
        <p>
          <strong>Calibrate</strong> if needed to set your current device position as neutral.
        </p>
        <p>
          Try to move the marble around the entire play area!
        </p>
      </div>
    </div>
  );
};

export default LocalView;
