import React, { useState, useEffect } from 'react';
import useDeviceOrientation from '../../hooks/useDeviceOrientation';
import { formatOrientationForDebug, orientationToMovement } from '../../utils/orientation';
import './OrientationControls.css';

interface OrientationControlsProps {
  onOrientationChange?: (movement: { x: number, y: number }) => void;
  debug?: boolean;
  sensitivity?: number;
}

/**
 * Component that handles device orientation controls for the game
 */
const OrientationControls: React.FC<OrientationControlsProps> = ({
  onOrientationChange,
  debug = false,
  sensitivity: initialSensitivity = 0.5
}) => {
  // States for UI elements
  const [showCalibrationMessage, setShowCalibrationMessage] = useState(false);
  const [showPermissionMessage, setShowPermissionMessage] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  
  // Get orientation data and control functions from hook
  const {
    alpha,
    beta,
    gamma,
    absolute,
    error,
    isSupported,
    hasPermission,
    requestPermission,
    calibrate,
    resetCalibration,
    sensitivity,
    setSensitivity,
    permissionState
  } = useDeviceOrientation();

  // Handle orientation changes
  useEffect(() => {
    if (onOrientationChange && beta !== null && gamma !== null) {
      const movement = orientationToMovement(beta, gamma);
      onOrientationChange(movement);
    }
  }, [beta, gamma, onOrientationChange]);

  // Handle initial permission request (for iOS)
  useEffect(() => {
    if (isSupported && hasPermission === false && !permissionRequested) {
      setShowPermissionMessage(true);
    } else {
      setShowPermissionMessage(false);
    }
  }, [isSupported, hasPermission, permissionRequested]);

  // Handle permission request
  const handleRequestPermission = async () => {
    try {
      console.log("Requesting permission...");
      setPermissionRequested(true);
      const granted = await requestPermission();
      console.log("Permission request result:", granted);
      setShowPermissionMessage(!granted);
      
      // If permission was granted, we might need to wait a moment before the system is ready
      if (granted) {
        // Give the browser a moment to register the permission change
        setTimeout(() => {
          console.log("Permission granted, forcing re-check");
          // Force a re-check of permission state
          setPermissionRequested(false);
        }, 1000);
      }
    } catch (e) {
      console.error("Error in handleRequestPermission:", e);
      setShowPermissionMessage(true);
    }
  };

  // Handle calibration
  const handleCalibrate = () => {
    calibrate();
    setShowCalibrationMessage(true);
    
    // Hide calibration message after 2 seconds
    setTimeout(() => {
      setShowCalibrationMessage(false);
    }, 2000);
  };

  // If orientation is not supported, show message
  if (!isSupported) {
    return (
      <div className="orientation-controls fallback">
        <div className="message error">
          <p>Device orientation is not supported on this device.</p>
          <p>Please use the fallback controls below:</p>
          <FallbackControls onControlChange={onOrientationChange} />
          {debug && (
            <div className="debug-info">
              <h4>Debug Information:</h4>
              <p>Support Status: Not supported</p>
              <p>Permission State: {permissionState}</p>
              <p>Has Permission: {hasPermission === null ? 'null' : hasPermission ? 'true' : 'false'}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If permission is needed but not granted, show request button
  if ((hasPermission === false || permissionState === 'prompt' || permissionState === 'denied') && showPermissionMessage) {
    return (
      <div className="orientation-controls permission">
        <div className="message">
          <h3>Permission Required</h3>
          <p>This game uses your device's orientation to control the marble.</p>
          <p>Please allow access to device motion and orientation when prompted.</p>
          <button 
            className="permission-button" 
            onClick={handleRequestPermission}
          >
            Enable Tilt Controls
          </button>
          {debug && (
            <div className="debug-info">
              <h4>Debug Information:</h4>
              <p>Support Status: {isSupported ? 'Supported' : 'Not supported'}</p>
              <p>Permission State: {permissionState}</p>
              <p>Has Permission: {hasPermission === null ? 'null' : hasPermission ? 'true' : 'false'}</p>
              <p>Permission Requested: {permissionRequested ? 'true' : 'false'}</p>
              {error && <p>Error: {error}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render controls interface
  return (
    <div className="orientation-controls">
      {/* Calibration message */}
      {showCalibrationMessage && (
        <div className="message success">
          <p>Calibration successful! This position is now neutral.</p>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="message error">
          <p>{error}</p>
        </div>
      )}
      
      {/* Control buttons */}
      <div className="controls-buttons">
        <button onClick={handleCalibrate} className="control-button calibrate">
          Calibrate
        </button>
        <button onClick={resetCalibration} className="control-button reset">
          Reset
        </button>
      </div>
      
      {/* Sensitivity slider */}
      <div className="sensitivity-control">
        <label htmlFor="sensitivity">Sensitivity: {(sensitivity * 100).toFixed(0)}%</label>
        <input
          id="sensitivity"
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={sensitivity}
          onChange={(e) => setSensitivity(parseFloat(e.target.value))}
        />
      </div>
      
      {/* Debug information */}
      {debug && (
        <div className="debug-info">
          <h4>Orientation Data:</h4>
          <pre>{formatOrientationForDebug(alpha, beta, gamma)}</pre>
          <p>Absolute: {absolute ? 'Yes' : 'No'}</p>
          <p>Movement: {JSON.stringify(orientationToMovement(beta, gamma))}</p>
          <p>Support Status: {isSupported ? 'Supported' : 'Not supported'}</p>
          <p>Permission State: {permissionState}</p>
          <p>Has Permission: {hasPermission === null ? 'null' : hasPermission ? 'true' : 'false'}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Fallback controls for devices that don't support orientation
 */
interface FallbackControlsProps {
  onControlChange?: (movement: { x: number, y: number }) => void;
}

const FallbackControls: React.FC<FallbackControlsProps> = ({ onControlChange }) => {
  // State for keyboard/touch controls
  const [movement, setMovement] = useState({ x: 0, y: 0 });
  
  // Handle key events for fallback controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let newMovement = { ...movement };
      
      switch (e.key) {
        case 'ArrowUp':
          newMovement.y = -5;
          break;
        case 'ArrowDown':
          newMovement.y = 5;
          break;
        case 'ArrowLeft':
          newMovement.x = -5;
          break;
        case 'ArrowRight':
          newMovement.x = 5;
          break;
      }
      
      setMovement(newMovement);
      if (onControlChange) onControlChange(newMovement);
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      let newMovement = { ...movement };
      
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
          newMovement.y = 0;
          break;
        case 'ArrowLeft':
        case 'ArrowRight':
          newMovement.x = 0;
          break;
      }
      
      setMovement(newMovement);
      if (onControlChange) onControlChange(newMovement);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [movement, onControlChange]);
  
  return (
    <div className="fallback-controls">
      <div className="control-pad">
        <button 
          className="control-button up"
          onMouseDown={() => {
            const newMovement = { ...movement, y: -5 };
            setMovement(newMovement);
            if (onControlChange) onControlChange(newMovement);
          }}
          onMouseUp={() => {
            const newMovement = { ...movement, y: 0 };
            setMovement(newMovement);
            if (onControlChange) onControlChange(newMovement);
          }}
          onTouchStart={() => {
            const newMovement = { ...movement, y: -5 };
            setMovement(newMovement);
            if (onControlChange) onControlChange(newMovement);
          }}
          onTouchEnd={() => {
            const newMovement = { ...movement, y: 0 };
            setMovement(newMovement);
            if (onControlChange) onControlChange(newMovement);
          }}
        >
          ▲
        </button>
        
        <div className="horizontal-controls">
          <button 
            className="control-button left"
            onMouseDown={() => {
              const newMovement = { ...movement, x: -5 };
              setMovement(newMovement);
              if (onControlChange) onControlChange(newMovement);
            }}
            onMouseUp={() => {
              const newMovement = { ...movement, x: 0 };
              setMovement(newMovement);
              if (onControlChange) onControlChange(newMovement);
            }}
            onTouchStart={() => {
              const newMovement = { ...movement, x: -5 };
              setMovement(newMovement);
              if (onControlChange) onControlChange(newMovement);
            }}
            onTouchEnd={() => {
              const newMovement = { ...movement, x: 0 };
              setMovement(newMovement);
              if (onControlChange) onControlChange(newMovement);
            }}
          >
            ◄
          </button>
          
          <button 
            className="control-button right"
            onMouseDown={() => {
              const newMovement = { ...movement, x: 5 };
              setMovement(newMovement);
              if (onControlChange) onControlChange(newMovement);
            }}
            onMouseUp={() => {
              const newMovement = { ...movement, x: 0 };
              setMovement(newMovement);
              if (onControlChange) onControlChange(newMovement);
            }}
            onTouchStart={() => {
              const newMovement = { ...movement, x: 5 };
              setMovement(newMovement);
              if (onControlChange) onControlChange(newMovement);
            }}
            onTouchEnd={() => {
              const newMovement = { ...movement, x: 0 };
              setMovement(newMovement);
              if (onControlChange) onControlChange(newMovement);
            }}
          >
            ►
          </button>
        </div>
        
        <button 
          className="control-button down"
          onMouseDown={() => {
            const newMovement = { ...movement, y: 5 };
            setMovement(newMovement);
            if (onControlChange) onControlChange(newMovement);
          }}
          onMouseUp={() => {
            const newMovement = { ...movement, y: 0 };
            setMovement(newMovement);
            if (onControlChange) onControlChange(newMovement);
          }}
          onTouchStart={() => {
            const newMovement = { ...movement, y: 5 };
            setMovement(newMovement);
            if (onControlChange) onControlChange(newMovement);
          }}
          onTouchEnd={() => {
            const newMovement = { ...movement, y: 0 };
            setMovement(newMovement);
            if (onControlChange) onControlChange(newMovement);
          }}
        >
          ▼
        </button>
      </div>
      
      <p className="controls-help">
        Use arrow keys or touch buttons to control the marble
      </p>
    </div>
  );
};

export default OrientationControls;
