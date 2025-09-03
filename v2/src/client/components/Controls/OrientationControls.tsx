import React, { useState, useEffect } from 'react';
import useDeviceOrientation from '../../hooks/useDeviceOrientation';
import './OrientationControls.css';

interface OrientationControlsProps {
  onOrientationChange: (movement: { x: number, y: number }) => void;
  debug?: boolean;
  sensitivity?: number;
}

const OrientationControls: React.FC<OrientationControlsProps> = ({
  onOrientationChange,
  debug = false,
  sensitivity: initialSensitivity = 0.4
}) => {
  const [showCalibrationInfo, setShowCalibrationInfo] = useState(false);
  
  // Use the device orientation hook
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
  
  // Update sensitivity if passed as a prop
  useEffect(() => {
    if (initialSensitivity !== sensitivity) {
      setSensitivity(initialSensitivity);
    }
  }, [initialSensitivity, sensitivity, setSensitivity]);
  
  // Convert orientation data to movement
  useEffect(() => {
    if (beta !== null && gamma !== null && permissionState === 'granted') {
      // Map beta/gamma to x/y movement
      // Gamma controls left-right (x-axis)
      // Beta controls forward-backward (y-axis)
      
      // Since we've already applied calibration and sensitivity in the hook,
      // we can use these values directly
      onOrientationChange({ 
        x: gamma,
        y: beta
      });
    }
  }, [beta, gamma, permissionState, onOrientationChange]);
  
  // Handle permission request
  const handleRequestPermission = async () => {
    await requestPermission();
  };
  
  // Handle calibration
  const handleCalibrate = () => {
    calibrate();
    setShowCalibrationInfo(true);
    
    // Hide calibration info after 3 seconds
    setTimeout(() => {
      setShowCalibrationInfo(false);
    }, 3000);
  };
  
  // Handle sensitivity change
  const handleSensitivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSensitivity(parseFloat(e.target.value));
  };
  
  // Render permission request button if needed
  if (permissionState === 'prompt') {
    return (
      <div className="orientation-controls permission-request">
        <p>This game uses your device's motion sensors to control the marble.</p>
        <button 
          onClick={handleRequestPermission}
          className="permission-button"
        >
          Enable Tilt Controls
        </button>
      </div>
    );
  }
  
  // Render error message if device orientation is not supported
  if (!isSupported || permissionState === 'unsupported') {
    return (
      <div className="orientation-controls error">
        <p className="error-message">
          Your device or browser doesn't support the orientation sensors needed for this game.
        </p>
        <p className="fallback-message">
          Try using a mobile device with Chrome, Safari, or Firefox.
        </p>
      </div>
    );
  }
  
  // Render error message if permission was denied
  if (permissionState === 'denied') {
    return (
      <div className="orientation-controls error">
        <p className="error-message">
          Permission to access orientation sensors was denied.
        </p>
        <p className="fallback-message">
          Please reload the page and grant permission when prompted.
        </p>
        <button 
          onClick={handleRequestPermission}
          className="permission-button"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  // Render normal controls
  return (
    <div className="orientation-controls">
      <div className="controls-row">
        <button 
          onClick={handleCalibrate}
          className="calibrate-button"
        >
          Calibrate
        </button>
        
        <button 
          onClick={resetCalibration}
          className="reset-button"
        >
          Reset
        </button>
      </div>
      
      {showCalibrationInfo && (
        <div className="calibration-info">
          Calibrated! Hold your device in this position for neutral.
        </div>
      )}
      
      <div className="sensitivity-control">
        <label htmlFor="sensitivity">Sensitivity</label>
        <input
          id="sensitivity"
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={sensitivity}
          onChange={handleSensitivityChange}
        />
        <span className="sensitivity-value">
          {sensitivity.toFixed(1)}
        </span>
      </div>
      
      {debug && (
        <div className="debug-info">
          <h3>Orientation Data</h3>
          <p>Alpha: {alpha !== null ? alpha.toFixed(2) : 'null'}°</p>
          <p>Beta: {beta !== null ? beta.toFixed(2) : 'null'}°</p>
          <p>Gamma: {gamma !== null ? gamma.toFixed(2) : 'null'}°</p>
          <p>Absolute: {absolute ? 'true' : 'false'}</p>
          {error && <p className="error">Error: {error}</p>}
        </div>
      )}
    </div>
  );
};

export default OrientationControls;
