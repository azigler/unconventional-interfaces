import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomeView.css';

/**
 * HomeView Component
 * 
 * Landing page that allows users to choose between LOBBY and LOCAL views
 */
const HomeView: React.FC = () => {
  // Detect if the user is on a mobile device
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Simple mobile detection based on screen size
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Check on mount and window resize
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  return (
    <div className="home-view">
      <div className="home-content">
        <h1 className="game-title">Marble Tilt</h1>
        <p className="game-subtitle">Tilt your phone to control the marble!</p>
        
        <div className="view-selection">
          <Link 
            to="/local" 
            className={`view-option local-option ${isMobile ? 'recommended' : ''}`}
          >
            <div className="view-icon local-icon"></div>
            <div className="view-info">
              <h2>Player View</h2>
              <p>Join the game and tilt your phone to control your marble</p>
              {isMobile && <span className="recommended-tag">Recommended for your device</span>}
            </div>
          </Link>
          
          <Link 
            to="/lobby" 
            className={`view-option lobby-option ${!isMobile ? 'recommended' : ''}`}
          >
            <div className="view-icon lobby-icon"></div>
            <div className="view-info">
              <h2>Lobby View</h2>
              <p>See all players in the game world (ideal for tablets/desktops)</p>
              {!isMobile && <span className="recommended-tag">Recommended for your device</span>}
            </div>
          </Link>
        </div>
        
        <div className="game-instructions">
          <h3>How to Play</h3>
          <ol>
            <li>On a large screen (tablet/desktop), open the <strong>Lobby View</strong></li>
            <li>On your phone, scan the QR code or visit this site and choose <strong>Player View</strong></li>
            <li>Tilt your phone to control your marble</li>
            <li>Collect points and avoid obstacles</li>
            <li>Compete with friends in the same room!</li>
          </ol>
        </div>
      </div>
      
      <footer className="home-footer">
        <p>Created for the Unconventional Interfaces Hackathon</p>
      </footer>
    </div>
  );
};

export default HomeView;
