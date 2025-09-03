import React from 'react';
import { Link } from 'react-router-dom';
import './HomeView.css';

const HomeView: React.FC = () => {
  return (
    <div className="home-view">
      <h1>Marble Tilt</h1>
      <div className="logo">
        <div className="marble-logo"></div>
      </div>
      
      <p className="tagline">
        A multiplayer marble game using phone tilt controls
      </p>
      
      <div className="view-options">
        <Link to="/local" className="view-option local">
          <h2>LOCAL View</h2>
          <p>Use your phone to control a marble</p>
          <div className="device-icon phone-icon">📱</div>
        </Link>
        
        <Link to="/lobby" className="view-option lobby">
          <h2>LOBBY View</h2>
          <p>See all marbles in the shared world</p>
          <div className="device-icon desktop-icon">🖥️</div>
        </Link>
        
        <Link to="/store" className="view-option store">
          <h2>STORE View</h2>
          <p>Shop with your marble as a controller!</p>
          <div className="device-icon store-icon">🛒</div>
        </Link>
      </div>
      
      <div className="home-instructions">
        <h2>How to Play</h2>
        <p>
          <strong>Best Experience:</strong> Open the LOBBY view on a larger screen (tablet/desktop)
          and the LOCAL view on your phone to use as a controller.
        </p>
        <p>
          <strong>Each Device:</strong> Every device that connects adds a new marble to the
          shared world. Tilt your phone to control your marble!
        </p>
        <p>
          <strong>STORE Experience:</strong> Try our unconventional shopping interface where
          you roll your marble into "buy holes" to add items to your cart!
        </p>
        <p>
          <strong>HTTPS Required:</strong> The device orientation API requires HTTPS.
          If you're running locally, make sure you've set up SSL certificates.
        </p>
      </div>
      
      <div className="demo-link">
        <Link to="/demo">Try the Orientation Demo</Link>
      </div>
    </div>
  );
};

export default HomeView;
