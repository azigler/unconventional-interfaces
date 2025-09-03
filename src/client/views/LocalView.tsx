import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useGameContext } from '../contexts/GameContext';
import Marble from '../components/Marble/Marble';
import './LocalView.css';

/**
 * LocalView Component
 * 
 * Displays the game from a player's perspective, with their marble
 * centered on the screen. This view is intended for mobile devices
 * where players use tilt controls.
 */
const LocalView: React.FC = () => {
  const { playerId, players, sendPosition, isConnected } = useWebSocket();
  const { boundaries, obstacles, gameState } = useGameContext();
  
  // Check if we're in portrait mode and need to prompt rotation
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  
  // Handle screen orientation changes
  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Handle position updates from the local marble
  const handlePositionUpdate = (x: number, y: number, vx: number, vy: number) => {
    sendPosition(x, y, vx, vy);
  };
  
  // Find the local player
  const localPlayer = players.find(player => player.id === playerId);
  
  // Get other players to render
  const otherPlayers = players.filter(player => player.id !== playerId);
  
  // If we don't have a local player yet, show loading
  if (!localPlayer) {
    return (
      <div className="local-view loading">
        <div className="loading-spinner"></div>
        <p>Connecting to game...</p>
        {!isConnected && (
          <p className="error-message">
            Connection lost. Attempting to reconnect...
          </p>
        )}
      </div>
    );
  }
  
  // If we're in portrait mode, show rotation prompt
  if (isPortrait) {
    return (
      <div className="orientation-prompt">
        <div className="phone-rotation-icon"></div>
        <p>Please rotate your device to landscape mode</p>
      </div>
    );
  }
  
  return (
    <div className="local-view">
      {gameState === 'waiting' && (
        <div className="game-status-overlay">
          <h2>Waiting for the game to start</h2>
          <p>The game host will start the game soon</p>
          <div className="player-info">
            <div 
              className="player-color-sample"
              style={{ backgroundColor: localPlayer.color }}
            ></div>
            <span>You are Player {playerId}</span>
          </div>
        </div>
      )}
      
      {gameState === 'finished' && (
        <div className="game-status-overlay">
          <h2>Game Over!</h2>
          <p>Waiting for a new game to start...</p>
        </div>
      )}
      
      <div 
        className="game-world"
        style={{
          // Position the game world so that the local marble is in the center
          // This creates a camera that follows the player
          transform: `translate(${window.innerWidth/2 - localPlayer.x}px, ${window.innerHeight/2 - localPlayer.y}px)`
        }}
      >
        {/* Game boundaries visualization */}
        <div 
          className="game-boundaries"
          style={{
            left: `${boundaries.left}px`,
            top: `${boundaries.top}px`,
            width: `${boundaries.right - boundaries.left}px`,
            height: `${boundaries.bottom - boundaries.top}px`
          }}
        ></div>
        
        {/* Render obstacles */}
        {obstacles.map(obstacle => (
          <div
            key={obstacle.id}
            className={`obstacle obstacle-${obstacle.type}`}
            style={{
              left: `${obstacle.x}px`,
              top: `${obstacle.y}px`,
              width: `${obstacle.radius * 2}px`,
              height: `${obstacle.radius * 2}px`,
            }}
          />
        ))}
        
        {/* Render other players */}
        {otherPlayers.map(player => (
          <Marble
            key={player.id}
            id={player.id}
            initialX={player.x}
            initialY={player.y}
            color={player.color}
            isLocal={false}
          />
        ))}
        
        {/* Render local player (centered) */}
        <Marble
          id={localPlayer.id}
          initialX={localPlayer.x}
          initialY={localPlayer.y}
          color={localPlayer.color}
          isLocal={true}
          onPositionUpdate={handlePositionUpdate}
        />
      </div>
      
      {/* Mini-map */}
      <div className="mini-map">
        <div className="mini-map-content">
          <div className="mini-map-boundaries"></div>
          
          {/* Render player positions on mini-map */}
          {players.map(player => (
            <div
              key={player.id}
              className={`mini-map-player ${player.id === playerId ? 'local' : ''}`}
              style={{
                left: `${(player.x - boundaries.left) / (boundaries.right - boundaries.left) * 100}%`,
                top: `${(player.y - boundaries.top) / (boundaries.bottom - boundaries.top) * 100}%`,
                backgroundColor: player.color
              }}
            ></div>
          ))}
        </div>
      </div>
      
      {/* Connection status indicator */}
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>
    </div>
  );
};

export default LocalView;
