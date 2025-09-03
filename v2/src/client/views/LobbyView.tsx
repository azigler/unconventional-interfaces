import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import MarbleWorld from '../components/MarbleWorld/MarbleWorld';
import './LobbyView.css';

const LobbyView: React.FC = () => {
  const navigate = useNavigate();
  const { players, gameRooms, currentRoomId } = useGame();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(currentRoomId);
  
  // Use the first room if none selected
  useEffect(() => {
    if (!selectedRoomId && gameRooms.length > 0) {
      setSelectedRoomId(gameRooms[0].id);
    }
  }, [gameRooms, selectedRoomId]);
  
  // Filter players by selected room
  const roomPlayers = players.filter(player => player.roomId === selectedRoomId);
  
  // Handle room selection
  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
  };
  
  // Handle play button
  const handlePlay = () => {
    navigate('/');
  };
  
  return (
    <div className="lobby-view">
      <header className="lobby-header">
        <h1>Marble Tilt - Lobby View</h1>
        <button
          onClick={handlePlay}
          className="play-button"
        >
          Play Game
        </button>
      </header>
      
      <main className="lobby-main">
        <aside className="lobby-sidebar">
          <h2>Game Rooms</h2>
          
          <ul className="room-list">
            {gameRooms.map(room => (
              <li
                key={room.id}
                className={`room-item ${selectedRoomId === room.id ? 'selected' : ''}`}
                onClick={() => handleRoomSelect(room.id)}
              >
                <span className="room-name">{room.name}</span>
                <span className="player-count">{room.playerCount} players</span>
              </li>
            ))}
          </ul>
          
          <h2>Players</h2>
          
          <ul className="player-list">
            {roomPlayers.map(player => (
              <li key={player.id} className="player-item">
                <div 
                  className="player-color" 
                  style={{ backgroundColor: player.color }}
                ></div>
                <span className="player-name">{player.name}</span>
                <span className={`player-status ${player.connected ? 'online' : 'offline'}`}>
                  {player.connected ? 'Online' : 'Offline'}
                </span>
              </li>
            ))}
          </ul>
          
          <div className="qr-section">
            <h2>Join Game</h2>
            <p>Scan this QR code to join:</p>
            <div className="qr-placeholder">
              {/* QR code would be generated here */}
              <div className="qr-code-img">QR</div>
            </div>
            <p className="join-url">https://marble-tilt.example.com</p>
          </div>
        </aside>
        
        <div className="game-display">
          <MarbleWorld 
            isLocalView={false}
            width={window.innerWidth - 300} // Account for sidebar
            height={window.innerHeight - 100} // Account for header
          />
        </div>
      </main>
    </div>
  );
};

export default LobbyView;
