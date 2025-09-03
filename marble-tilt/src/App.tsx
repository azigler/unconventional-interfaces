import React, { useState } from 'react';
import './App.css';
import OrientationDemo from './OrientationDemo';

function App() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Marble Tilt</h1>
        <p>A game using device orientation controls</p>
      </header>

      {showDemo ? (
        <OrientationDemo />
      ) : (
        <div className="start-container">
          <p>
            This demo uses your device's orientation sensors to control a marble.
            You'll need to allow permission for device orientation if prompted.
          </p>
          <p>
            For the best experience, use this on a mobile device with orientation sensors.
            Make sure you're on HTTPS for the orientation API to work.
          </p>
          <button
            className="start-button"
            onClick={() => setShowDemo(true)}
          >
            Start Demo
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
