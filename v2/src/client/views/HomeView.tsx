import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import './HomeView.css';

interface HomeViewProps {
  isOrientationSupported: boolean;
}

const HomeView: React.FC<HomeViewProps> = ({ isOrientationSupported }) => {
  const navigate = useNavigate();
  const { joinGame, gameRooms, createRoom } = useGame();
  
  const [playerName, setPlayerName] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle room selection
  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
  };
  
  // Handle join game
  const handleJoinGame = async () => {
    setIsLoading(true);
    try {
      await joinGame(playerName, selectedRoomId || undefined);
      navigate('/local');
    } catch (error) {
      console.error('Error joining game:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle create room
  const handleCreateRoom = async () => {
    setIsLoading(true);
    try {
      const roomId = await createRoom(newRoomName);
      setSelectedRoomId(roomId);
      setShowCreateRoom(false);
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle spectate mode
  const handleSpectateGame = () => {
    navigate('/lobby');
  };
  
  // Show device not supported message
  if (!isOrientationSupported) {
    return (
      <div className="home-view">
        <h1>Marble Tilt</h1>
        <div className="unsupported-device">
          <h2>Device Not Supported</h2>
          <p>
            Your device or browser doesn't support the orientation sensors needed to play Marble Tilt.
          </p>
          <p>
            Please try using a mobile device with Chrome, Safari, or Firefox.
          </p>
          <button 
            onClick={handleSpectateGame}
            className="spectate-button"
          >
            Spectate Mode
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="home-view">
      <h1>Marble Tilt</h1>
      
      <div className="game-card">
        <h2>Join the Game</h2>
        
        <div className="input-group">
          <label htmlFor="player-name">Your Name</label>
          <input
            id="player-name"
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        {showCreateRoom ? (
          <div className="create-room-form">
            <div className="input-group">
              <label htmlFor="room-name">Room Name</label>
              <input
                id="room-name"
                type="text"
                placeholder="Enter room name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="button-group">
              <button
                onClick={handleCreateRoom}
                className="primary-button"
                disabled={isLoading || !newRoomName.trim()}
              >
                {isLoading ? 'Creating...' : 'Create Room'}
              </button>
              
              <button
                onClick={() => setShowCreateRoom(false)}
                className="secondary-button"
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="room-selection">
              <h3>Select a Room</h3>
              
              {gameRooms.length === 0 ? (
                <p className="no-rooms">No active game rooms. Create one!</p>
              ) : (
                <ul className="room-list">
                  {gameRooms.map((room) => (
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
              )}
              
              <button
                onClick={() => setShowCreateRoom(true)}
                className="create-room-button"
                disabled={isLoading}
              >
                Create New Room
              </button>
            </div>
            
            <div className="action-buttons">
              <button
                onClick={handleJoinGame}
                className="primary-button"
                disabled={isLoading || (!selectedRoomId && gameRooms.length > 0)}
              >
                {isLoading ? 'Joining...' : 'Start Game'}
              </button>
              
              <button
                onClick={handleSpectateGame}
                className="secondary-button"
                disabled={isLoading}
              >
                Spectate
              </button>
            </div>
          </>
        )}
      </div>
      
      <div className="game-instructions">
        <h3>How to Play</h3>
        <ul>
          <li>Tilt your device to move your marble</li>
          <li>Collect items in the store</li>
          <li>Interact with other players</li>
          <li>Have fun!</li>
        </ul>
      </div>
    </div>
  );
};

export default HomeView;
