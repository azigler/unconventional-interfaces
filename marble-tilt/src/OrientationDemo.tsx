import React, { useState, useEffect } from 'react';
import OrientationControls from './client/components/Controls/OrientationControls';
import './OrientationDemo.css';

const OrientationDemo: React.FC = () => {
  const [movement, setMovement] = useState({ x: 0, y: 0 });
  const [showDebug, setShowDebug] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorLog, setErrorLog] = useState<string[]>([]);

  // Global error handler to catch and display any unhandled errors
  useEffect(() => {
    const originalConsoleError = console.error;
    const originalConsoleLog = console.log;
    const originalWindowError = window.onerror;

    // Override console.error to capture error messages
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      const errorMessage = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      setErrorLog(prev => [...prev, `ERROR: ${errorMessage}`].slice(-10));
      setShowError(true);
    };

    // Override console.log to capture log messages in debug mode
    console.log = (...args) => {
      originalConsoleLog.apply(console, args);
      if (showDebug) {
        const logMessage = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        
        setErrorLog(prev => [...prev, `LOG: ${logMessage}`].slice(-10));
      }
    };

    // Catch window errors
    window.onerror = (message, source, lineno, colno, error) => {
      const errorMessage = `${message} at ${source}:${lineno}:${colno}`;
      setErrorLog(prev => [...prev, `WINDOW ERROR: ${errorMessage}`].slice(-10));
      setShowError(true);
      
      if (originalWindowError) {
        return originalWindowError(message, source, lineno, colno, error);
      }
      return false;
    };

    // Catch unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = `Unhandled Promise Rejection: ${event.reason}`;
      setErrorLog(prev => [...prev, errorMessage].slice(-10));
      setShowError(true);
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup function to restore original functions
    return () => {
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
      window.onerror = originalWindowError;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [showDebug]);

  // Handle orientation changes from the controls
  const handleOrientationChange = (newMovement: { x: number, y: number }) => {
    setMovement(newMovement);
  };

  // Calculate the marble position based on the movement values
  const marbleStyle = {
    transform: `translate(${movement.x * 5}px, ${movement.y * 5}px)`
  };

  return (
    <div className="orientation-demo">
      <h1>Device Orientation Demo</h1>
      <p className="instructions">
        Tilt your device to move the marble. If device orientation is not supported,
        fallback controls will be provided.
      </p>

      {/* Error display */}
      {showError && (
        <div className="error-display">
          <h3>Debug Information</h3>
          <div className="error-log">
            {errorLog.map((error, index) => (
              <div key={index} className="error-message">
                {error}
              </div>
            ))}
          </div>
          <button 
            className="error-close-button"
            onClick={() => setShowError(false)}
          >
            Hide Errors
          </button>
        </div>
      )}

      <div className="marble-container">
        <div className="marble" style={marbleStyle}></div>
      </div>

      <OrientationControls 
        onOrientationChange={handleOrientationChange}
        debug={showDebug}
      />

      <div className="demo-controls">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="debug-toggle"
        >
          {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
        </button>
        
        <button
          onClick={() => setShowError(!showError)}
          className="debug-toggle error-toggle"
        >
          {showError ? 'Hide Error Log' : 'Show Error Log'}
        </button>
      </div>

      <div className="info-section">
        <h2>About Device Orientation</h2>
        <p>
          Device orientation uses your device's accelerometer to detect tilt.
          The marble moves based on how you tilt your device.
        </p>
        <p>
          <strong>Beta</strong> (x-axis): Controls forward/backward movement.<br />
          <strong>Gamma</strong> (y-axis): Controls left/right movement.
        </p>
        <p>
          Use the <strong>Calibrate</strong> button to set your current device position
          as the neutral position. This helps accommodate different holding positions.
        </p>
        <p>
          Adjust the <strong>Sensitivity</strong> slider to make the controls more or
          less responsive to tilt.
        </p>
        
        <div className="troubleshooting">
          <h3>Troubleshooting</h3>
          <p>
            <strong>For iOS users:</strong> You must be on HTTPS and grant permission when prompted.
            If controls don't work after granting permission, try reloading the page.
          </p>
          <p>
            <strong>For Android users:</strong> Most Android devices should work automatically.
            If controls aren't working, check that your device has orientation sensors.
          </p>
          <p>
            <strong>For all users:</strong> If you experience issues, try enabling the debug mode
            using the "Show Debug Info" button to see more information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrientationDemo;
