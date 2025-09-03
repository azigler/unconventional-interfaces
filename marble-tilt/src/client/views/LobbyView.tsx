import React, { useEffect } from 'react';
import MarbleWorld from '../components/MarbleWorld/MarbleWorld';
import { useGameState } from '../contexts/GameStateContext';
import './LobbyView.css';

const LobbyView: React.FC = () => {
  const { players, joinGame, leaveGame, gameState, errorMessage } = useGameState();

  // Convert Firestore players to marble format for MarbleWorld component
  const marbles = players.map(player => ({
    id: player.id,
    x: player.x,
    y: player.y,
    color: player.color,
    name: player.name
  }));

  // Auto-join the game when the lobby is opened
  useEffect(() => {
    if (gameState === 'idle') {
      joinGame('Lobby Host');
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
        {gameState === 'active' && <p>Game active: {players.length} player(s) connected</p>}
        {gameState === 'error' && <p className="error">Error: {errorMessage}</p>}
      </div>

      <div className="lobby-container">
        <MarbleWorld marbles={marbles} />
      </div>

      <div className="player-list">
        <h2>Players</h2>
        {players.length === 0 ? (
          <p>No players connected</p>
        ) : (
          <ul>
            {players.map(player => (
              <li key={player.id} style={{ color: player.color }}>
                {player.name} {player.cart.length > 0 ? `(${player.cart.length} items)` : ''}
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
