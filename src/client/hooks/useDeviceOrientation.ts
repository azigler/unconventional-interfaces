import { useState, useEffect } from 'react';

// Define the type for the orientation data
export interface OrientationData {
  beta: number | null;  // front-to-back tilt (in degrees)
  gamma: number | null; // left-to-right tilt (in degrees)
  alpha: number | null; // device compass direction (in degrees)
  absolute: boolean;    // whether values are absolute or relative
  isSupported: boolean; // if device orientation is supported by the browser
  permissionState: 'granted' | 'denied' | 'prompt' | 'not-required';
}

/**
 * Custom hook for handling device orientation events
 * Returns orientation data and a function to request permission
 */
export const useDeviceOrientation = (): [
  OrientationData, 
  () => Promise<boolean>
] => {
  // Initial state with null values
  const [orientation, setOrientation] = useState<OrientationData>({
    beta: null,
    gamma: null,
    alpha: null,
    absolute: false,
    isSupported: 'DeviceOrientationEvent' in window,
    permissionState: 'prompt'
  });

  /**
   * Request permission to access device orientation
   * Required for iOS 13+ devices
   */
  const requestPermission = async (): Promise<boolean> => {
    if (!orientation.isSupported) return false;

    // Check if the browser requires permission (iOS 13+)
    // TypeScript doesn't know about this method so we need to cast
    const DeviceOrientationEventWithPermission = 
      DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>
      };
    
    if (typeof DeviceOrientationEventWithPermission.requestPermission === 'function') {
      try {
        const permissionState = await DeviceOrientationEventWithPermission.requestPermission();
        setOrientation(prev => ({ ...prev, permissionState: permissionState as any }));
        return permissionState === 'granted';
      } catch (error) {
        console.error('Error requesting device orientation permission:', error);
        return false;
      }
    } else {
      // Permission not required for this device/browser
      setOrientation(prev => ({ ...prev, permissionState: 'granted' }));
      return true;
    }
  };

  useEffect(() => {
    // Only add event listener if permission is granted or not required
    if (orientation.permissionState === 'granted' || orientation.permissionState === 'not-required') {
      const handleOrientation = (event: DeviceOrientationEvent) => {
        setOrientation({
          beta: event.beta,
          gamma: event.gamma,
          alpha: event.alpha,
          absolute: event.absolute,
          isSupported: true,
          permissionState: 'granted'
        });
      };

      window.addEventListener('deviceorientation', handleOrientation);
      
      // Clean up event listener on unmount
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    }
  }, [orientation.permissionState]);

  // Try to determine initial permission state
  useEffect(() => {
    // If DeviceOrientationEvent.requestPermission exists, we're on iOS 13+
    // and need to request permission
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      setOrientation(prev => ({ ...prev, permissionState: 'prompt' }));
    } else if (orientation.isSupported) {
      // For non-iOS devices or older iOS versions, permission is implicitly granted
      setOrientation(prev => ({ ...prev, permissionState: 'not-required' }));
    }
  }, [orientation.isSupported]);

  return [orientation, requestPermission];
};

export default useDeviceOrientation;
