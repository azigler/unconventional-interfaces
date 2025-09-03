/**
 * Utility functions for device orientation
 */

// Convert device orientation to movement vector
export const orientationToMovement = (
  beta: number | null, 
  gamma: number | null,
  maxSpeed = 8, // Decreased from 15 to 8
  deadzone = 2 // Increased from 1.5 to 2 for better stability
): { x: number, y: number } => {
  // Default to no movement if orientation data is not available
  if (beta === null || gamma === null) {
    return { x: 0, y: 0 };
  }

  // Apply deadzone - if tilt is very small, don't move
  const adjustedGamma = Math.abs(gamma) < deadzone ? 0 : gamma;
  const adjustedBeta = Math.abs(beta) < deadzone ? 0 : beta;

  // Apply non-linear mapping to create more control in the center range
  // and less extreme movement at the edges
  const nonLinearMap = (value: number, max: number): number => {
    // Apply a quadratic curve that's more gentle in the center
    const normalized = value / 20; // Normalize based on typical tilt range
    const sign = Math.sign(normalized);
    const scaled = Math.pow(Math.min(Math.abs(normalized), 1), 1.5) * sign;
    return scaled * max;
  };

  // Convert tilt to movement values with non-linear mapping
  const x = nonLinearMap(adjustedGamma, maxSpeed);
  const y = nonLinearMap(adjustedBeta, maxSpeed);

  return { x, y };
};

// Check if device orientation is supported
export const isOrientationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
};

// Check if permission is needed for device orientation (iOS 13+)
export const isPermissionNeeded = (): boolean => {
  return isOrientationSupported() && 
    typeof (DeviceOrientationEvent as any).requestPermission === 'function';
};

// Detect device type (useful for platform-specific adjustments)
export const getDeviceType = (): 'iOS' | 'Android' | 'other' => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'iOS';
  } else if (/android/.test(userAgent)) {
    return 'Android';
  } else {
    return 'other';
  }
};

// Apply platform-specific orientation adjustments
export const adjustForPlatform = (
  orientation: { alpha: number | null, beta: number | null, gamma: number | null }
): { alpha: number | null, beta: number | null, gamma: number | null } => {
  const deviceType = getDeviceType();
  
  // Different platforms might need specific adjustments
  switch (deviceType) {
    case 'iOS':
      // iOS-specific adjustments if needed
      return orientation;
    case 'Android':
      // Android-specific adjustments if needed
      return orientation;
    default:
      return orientation;
  }
};

// Convert orientation data to a tilt angle for visual feedback
export const getTiltAngle = (
  beta: number | null, 
  gamma: number | null
): { x: number, y: number } => {
  return {
    x: gamma || 0,
    y: beta || 0
  };
};

// Helper to format orientation data for debugging
export const formatOrientationForDebug = (
  alpha: number | null, 
  beta: number | null, 
  gamma: number | null
): string => {
  return `
    Alpha (z): ${alpha !== null ? alpha.toFixed(1) : 'null'}°
    Beta (x): ${beta !== null ? beta.toFixed(1) : 'null'}°
    Gamma (y): ${gamma !== null ? gamma.toFixed(1) : 'null'}°
  `;
};
