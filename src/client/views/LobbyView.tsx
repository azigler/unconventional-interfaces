import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useGameContext } from '../contexts/GameContext';
import Marble from '../components/Marble/Marble';
import QRCode from 'qrcode.react'; // We would need to install this package
import './LobbyView.css';

/**
 * LobbyView Component
 * 
 * Displays all marbles and game elements from a global perspective.
 * This view is intended for a larger screen (tablet/desktop) that can be
 * seen by all players.
 */
const LobbyView: React.FC = () => {
  const { players, isConnected } = useWebSocket();
  const { boundaries, obstacles, gameState, setGameState } = useGameContext();
  const [gameUrl, setGameUrl] = useState('');
  
  // Generate game URL for QR code
  useEffect(() => {
    // Get current URL without path
    const url = new URL(window.location.href);
    // Set path to local view
    url.pathname = '/local';
    setGameUrl(url.toString());
  }, []);
  
  return (
    <div className="lobby-view">
      <div className="game-header">
        <h1>Marble Tilt</h1>
        <div className="game-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
      
      <div className="game-container">
        {/* Game board with boundaries */}
        <div 
          className="game-board"
          style={{
            width: `${boundaries.right - boundaries.left}px`,
            height: `${boundaries.bottom - boundaries.top}px`
          }}
        >
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
          
          {/* Render all marbles */}
          {players.map(player => (
            <Marble
              key={player.id}
              id={player.id}
              initialX={player.x}
              initialY={player.y}
              color={player.color}
              isLocal={false}
            />
          ))}
        </div>
      </div>
      
      <div className="lobby-sidebar">
        <div className="player-list">
          <h2>Players ({players.length})</h2>
          <ul>
            {players.map(player => (
              <li key={player.id} style={{ color: player.color }}>
                Player {player.id}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="game-controls">
          {gameState === 'waiting' && (
            <button 
              className="start-game-button"
              onClick={() => setGameState('playing')}
              disabled={players.length < 1}
            >
              Start Game
            </button>
          )}
          
          {gameState === 'playing' && (
            <button 
              className="end-game-button"
              onClick={() => setGameState('finished')}
            >
              End Game
            </button>
          )}
          
          {gameState === 'finished' && (
            <button 
              className="restart-game-button"
              onClick={() => setGameState('waiting')}
            >
              New Game
            </button>
          )}
        </div>
        
        <div className="join-game">
          <h2>Join Game</h2>
          <p>Scan this QR code with your phone to join:</p>
          <div className="qr-code-container">
            <QRCode value={gameUrl} size={150} />
          </div>
          <p className="join-url">{gameUrl}</p>
        </div>
      </div>
    </div>
  );
};

export default LobbyView;
