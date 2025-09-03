import React, { useEffect } from 'react';
import MarbleWorld from '../components/MarbleWorld/MarbleWorld';
import { useGame } from '../contexts/GameContext';
import './LobbyView.css';

const LobbyView: React.FC = () => {
  const { marbles, joinGame, leaveGame, gameState, errorMessage } = useGame();

  // Auto-join the game when the lobby is opened
  useEffect(() => {
    if (gameState === 'idle') {
      joinGame();
    }

    return () => {
      if (gameState === 'active') {
        leaveGame();
      }
    };
  }, [gameState, joinGame, leaveGame]);

  return (
    <div className="lobby-view">
      <h1>Marble Tilt - Lobby</h1>
      
      <div className="game-status">
        {gameState === 'joining' && <p>Connecting to game...</p>}
        {gameState === 'active' && <p>Game active: {marbles.length} player(s) connected</p>}
        {gameState === 'error' && <p className="error">Error: {errorMessage}</p>}
      </div>

      <div className="lobby-container">
        <MarbleWorld marbles={marbles} />
      </div>

      <div className="player-list">
        <h2>Players</h2>
        {marbles.length === 0 ? (
          <p>No players connected</p>
        ) : (
          <ul>
            {marbles.map(marble => (
              <li key={marble.id} style={{ color: marble.color }}>
                {marble.name || `Player ${marble.id.substring(0, 4)}`}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="lobby-info">
        <h2>How to Play</h2>
        <p>
          Open this game on your mobile device and tilt to control your marble.
          Each connected device will add a new marble to the shared world.
        </p>
        <p>
          <strong>For best experience:</strong> Keep this LOBBY view open on a larger
          screen (tablet/desktop) and use your phone as a controller.
        </p>
      </div>
    </div>
  );
};

export default LobbyView;
