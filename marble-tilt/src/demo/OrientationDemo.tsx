import React, { useState, useEffect, useRef } from 'react';
import OrientationControls from '../client/components/Controls/OrientationControls';
import { formatMovement } from '../client/utils/orientation';
import './OrientationDemo.css';

const OrientationDemo: React.FC = () => {
  const [movement, setMovement] = useState({ x: 0, y: 0 });
  const [showDebug, setShowDebug] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorLog, setErrorLog] = useState<string[]>([]);
  
  // Refs to prevent infinite update loops
  const errorLogRef = useRef<string[]>([]);
  const isProcessingErrorRef = useRef(false);

  // Update ref when state changes
  useEffect(() => {
    errorLogRef.current = errorLog;
  }, [errorLog]);

  // Global error handler to catch and display any unhandled errors
  useEffect(() => {
    const originalConsoleError = console.error;
    const originalConsoleLog = console.log;
    const originalWindowError = window.onerror;

    // Override console.error to capture error messages
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      
      // Prevent recursive calls and infinite loops
      if (isProcessingErrorRef.current) {
        return;
      }
      
      try {
        isProcessingErrorRef.current = true;
        
        const errorMessage = args.map(arg => {
          if (arg instanceof Error) {
            return arg.message;
          }
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg);
            } catch (e) {
              return 'Object';
            }
          }
          return String(arg);
        }).join(' ');
        
        // Use timeout to break the call stack and prevent infinite loops
        setTimeout(() => {
          setErrorLog(prev => {
            const newLog = [...prev, `ERROR: ${errorMessage}`].slice(-10);
            errorLogRef.current = newLog;
            return newLog;
          });
          setShowError(true);
          isProcessingErrorRef.current = false;
        }, 0);
      } catch (e) {
        isProcessingErrorRef.current = false;
      }
    };

    // Override console.log to capture log messages in debug mode
    console.log = (...args) => {
      originalConsoleLog.apply(console, args);
      
      // Only process logs when debug is enabled and not in a recursive call
      if (!showDebug || isProcessingErrorRef.current) {
        return;
      }
      
      try {
        isProcessingErrorRef.current = true;
        
        const logMessage = args.map(arg => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg);
            } catch (e) {
              return 'Object';
            }
          }
          return String(arg);
        }).join(' ');
        
        // Use timeout to break the call stack
        setTimeout(() => {
          setErrorLog(prev => {
            const newLog = [...prev, `LOG: ${logMessage}`].slice(-10);
            errorLogRef.current = newLog;
            return newLog;
          });
          isProcessingErrorRef.current = false;
        }, 0);
      } catch (e) {
        isProcessingErrorRef.current = false;
      }
    };

    // Catch window errors
    window.onerror = (message, source, lineno, colno, error) => {
      if (isProcessingErrorRef.current) {
        if (originalWindowError) {
          return originalWindowError(message, source, lineno, colno, error);
        }
        return false;
      }
      
      try {
        isProcessingErrorRef.current = true;
        
        const errorMessage = `${message} at ${source}:${lineno}:${colno}`;
        
        setTimeout(() => {
          setErrorLog(prev => {
            const newLog = [...prev, `WINDOW ERROR: ${errorMessage}`].slice(-10);
            errorLogRef.current = newLog;
            return newLog;
          });
          setShowError(true);
          isProcessingErrorRef.current = false;
        }, 0);
      } catch (e) {
        isProcessingErrorRef.current = false;
      }
      
      if (originalWindowError) {
        return originalWindowError(message, source, lineno, colno, error);
      }
      return false;
    };

    // Catch unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isProcessingErrorRef.current) {
        return;
      }
      
      try {
        isProcessingErrorRef.current = true;
        
        const errorMessage = `Unhandled Promise Rejection: ${event.reason}`;
        
        setTimeout(() => {
          setErrorLog(prev => {
            const newLog = [...prev, errorMessage].slice(-10);
            errorLogRef.current = newLog;
            return newLog;
          });
          setShowError(true);
          isProcessingErrorRef.current = false;
        }, 0);
      } catch (e) {
        isProcessingErrorRef.current = false;
      }
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
