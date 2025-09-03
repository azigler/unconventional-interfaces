import { useState, useEffect, useCallback, useRef } from 'react';

interface DeviceOrientationState {
  alpha: number | null;  // z-axis rotation in degrees (0-360)
  beta: number | null;   // x-axis rotation in degrees (-180-180)
  gamma: number | null;  // y-axis rotation in degrees (-90-90)
  absolute: boolean;     // whether the device provides absolute orientation data
  error: string | null;  // error message if device orientation is not available
}

interface CalibrationSettings {
  betaOffset: number;
  gammaOffset: number;
}

interface UseDeviceOrientationResult extends DeviceOrientationState {
  isSupported: boolean;           // whether the device orientation API is supported
  hasPermission: boolean | null;  // whether permission has been granted (null if not applicable)
  requestPermission: () => Promise<boolean>; // function to request permission
  calibrate: () => void;          // function to calibrate the orientation
  resetCalibration: () => void;   // function to reset calibration
  sensitivity: number;            // sensitivity setting (0-1)
  setSensitivity: (value: number) => void; // function to set sensitivity
  permissionState: 'prompt' | 'granted' | 'denied' | 'not-required' | 'unsupported' | 'error';
}

/**
 * Custom hook for accessing device orientation data
 * 
 * @param {number} smoothingFactor - Value between 0 and 1 for orientation smoothing (default: 0.3)
 * @returns {UseDeviceOrientationResult} Device orientation data and control functions
 */
function useDeviceOrientation(smoothingFactor = 0.3): UseDeviceOrientationResult {
  // Check if the DeviceOrientationEvent is supported
  const isSupported = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
  
  // Initial orientation state
  const [orientationState, setOrientationState] = useState<DeviceOrientationState>({
    alpha: null,
    beta: null,
    gamma: null,
    absolute: false,
    error: null
  });

  // Permission state (mainly for iOS)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'not-required' | 'unsupported' | 'error'>('prompt');
  
  // Sensitivity state - default to 0.4 instead of 0.8
  const [sensitivity, setSensitivity] = useState<number>(0.4);

  // Smoothed orientation values
  const [smoothedOrientation, setSmoothedOrientation] = useState({
    alpha: 0,
    beta: 0,
    gamma: 0
  });
  
  // Calibration settings
  const [calibration, setCalibration] = useState<CalibrationSettings>({
    betaOffset: 0,
    gammaOffset: 0
  });

  // Refs to prevent issues with cleanup
  const orientationHandlerRef = useRef<((event: DeviceOrientationEvent) => void) | null>(null);
  const sensitivityRef = useRef(sensitivity);

  // Update ref when sensitivity changes
  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  // Function to check if permission is needed (iOS 13+)
  const isPermissionNeeded = useCallback((): boolean => {
    try {
      return isSupported && 
        typeof (DeviceOrientationEvent as any).requestPermission === 'function';
    } catch (e) {
      console.error("Error checking if permission is needed:", e);
      return false;
    }
  }, [isSupported]);

  // Function to request device orientation permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.log("Device orientation not supported");
      setOrientationState(prev => ({ ...prev, error: 'Device orientation not supported' }));
      setPermissionState('unsupported');
      return false;
    }

    if (!isPermissionNeeded()) {
      // Permission not needed, so we already have access
      console.log("Permission not needed, we already have access");
      setHasPermission(true);
      setPermissionState('not-required');
      return true;
    }

    try {
      console.log("Requesting permission...");
      // Request permission (iOS 13+)
      const permission = await (DeviceOrientationEvent as any).requestPermission();
      console.log("Permission response:", permission);
      const granted = permission === 'granted';
      setHasPermission(granted);
      setPermissionState(granted ? 'granted' : 'denied');
      
      if (!granted) {
        setOrientationState(prev => ({ 
          ...prev, 
          error: 'Permission to access device orientation was denied' 
        }));
      }
      
      return granted;
    } catch (error) {
      console.error("Error requesting device orientation permission:", error);
      setOrientationState(prev => ({ 
        ...prev, 
        error: `Error requesting device orientation permission: ${error}` 
      }));
      setHasPermission(false);
      setPermissionState('error');
      return false;
    }
  }, [isSupported, isPermissionNeeded]);

  // Function to calibrate the orientation (set current as neutral)
  const calibrate = useCallback(() => {
    if (orientationState.beta !== null && orientationState.gamma !== null) {
      setCalibration({
        betaOffset: orientationState.beta,
        gammaOffset: orientationState.gamma
      });
    }
  }, [orientationState.beta, orientationState.gamma]);

  // Function to reset calibration
  const resetCalibration = useCallback(() => {
    setCalibration({
      betaOffset: 0,
      gammaOffset: 0
    });
  }, []);

  // Initial setup - check if permission is needed
  useEffect(() => {
    if (!isSupported) {
      setOrientationState(prev => ({ ...prev, error: 'Device orientation not supported' }));
      setPermissionState('unsupported');
      return;
    }

    // Initial permission check for iOS
    try {
      if (isPermissionNeeded()) {
        console.log("Permission is needed, setting initial state");
        setHasPermission(false); // Need to request permission
        setPermissionState('prompt');
      } else {
        console.log("Permission not needed, auto-granting");
        setHasPermission(true); // Permission not needed or already granted
        setPermissionState('not-required');
      }
    } catch (e) {
      console.error("Error during initial permission check:", e);
      setPermissionState('error');
    }
  }, [isSupported, isPermissionNeeded]);

  // Setup orientation event listener when permission is granted
  useEffect(() => {
    if (!isSupported || hasPermission !== true) {
      return;
    }

    console.log("Permission granted, setting up orientation listener");

    // Handler for device orientation events
    const handleOrientation = (event: DeviceOrientationEvent) => {
      try {
        const { alpha, beta, gamma, absolute } = event;
        
        // Get current sensitivity from ref for accurate real-time adjustments
        const currentSensitivity = sensitivityRef.current;
        
        // Apply calibration and sensitivity
        // Use a narrower effective range for sensitivity so the slider has more effect
        // Map 0.1-1.0 to 0.05-0.5 for a more usable sensitivity range
        const effectiveSensitivity = currentSensitivity * 0.45 + 0.05;
        
        const calibratedBeta = beta !== null ? (beta - calibration.betaOffset) * effectiveSensitivity : null;
        const calibratedGamma = gamma !== null ? (gamma - calibration.gammaOffset) * effectiveSensitivity : null;
        
        // Apply smoothing with a variable factor that depends on sensitivity
        // Less smoothing at higher sensitivity for more responsive feel
        const dynamicSmoothingFactor = smoothingFactor * (1 - currentSensitivity * 0.5);
        
        if (beta !== null && gamma !== null) {
          setSmoothedOrientation(prev => ({
            alpha: alpha !== null 
              ? prev.alpha * dynamicSmoothingFactor + alpha * (1 - dynamicSmoothingFactor) 
              : prev.alpha,
            beta: calibratedBeta !== null 
              ? prev.beta * dynamicSmoothingFactor + calibratedBeta * (1 - dynamicSmoothingFactor) 
              : prev.beta,
            gamma: calibratedGamma !== null 
              ? prev.gamma * dynamicSmoothingFactor + calibratedGamma * (1 - dynamicSmoothingFactor) 
              : prev.gamma
          }));
        }
        
        // Update state with new values
        setOrientationState({
          alpha: alpha,
          beta: calibratedBeta,
          gamma: calibratedGamma,
          absolute: absolute || false,
          error: null
        });
      } catch (e) {
        console.error("Error handling orientation event:", e);
        setOrientationState(prev => ({ 
          ...prev, 
          error: `Error processing orientation data: ${e}` 
        }));
      }
    };

    // Store handler in ref for clean up
    orientationHandlerRef.current = handleOrientation;

    // Add event listener with try/catch
    try {
      window.addEventListener('deviceorientation', handleOrientation);
      console.log("Added deviceorientation event listener");
    } catch (e) {
      console.error("Error adding deviceorientation event listener:", e);
      setOrientationState(prev => ({ 
        ...prev, 
        error: `Error setting up orientation: ${e}` 
      }));
    }

    // Cleanup function
    return () => {
      try {
        if (orientationHandlerRef.current) {
          window.removeEventListener('deviceorientation', orientationHandlerRef.current);
          console.log("Removed deviceorientation event listener");
        }
      } catch (e) {
        console.error("Error removing deviceorientation event listener:", e);
      }
    };
  }, [isSupported, hasPermission, calibration, smoothingFactor]);

  // Return combined state and functions
  return {
    ...orientationState,
    isSupported,
    hasPermission,
    requestPermission,
    calibrate,
    resetCalibration,
    sensitivity,
    setSensitivity,
    permissionState
  };
}

export default useDeviceOrientation;
