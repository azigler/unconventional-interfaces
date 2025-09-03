import React, { useEffect, useState, useRef } from 'react';
import { useDeviceOrientation } from '../../hooks/useDeviceOrientation';
import { useGameContext } from '../../contexts/GameContext';
import './Marble.css';

interface MarbleProps {
  id: string;
  initialX?: number;
  initialY?: number;
  color?: string;
  radius?: number;
  isLocal?: boolean;
  onPositionUpdate?: (x: number, y: number, vx: number, vy: number) => void;
}

/**
 * Marble component representing a player in the game
 * Handles physics, rendering, and interaction with the game world
 */
export const Marble: React.FC<MarbleProps> = ({
  id,
  initialX = window.innerWidth / 2,
  initialY = window.innerHeight / 2,
  color = '#2196F3',
  radius = 20,
  isLocal = false,
  onPositionUpdate
}) => {
  // Get device orientation data and permission request function
  const [orientation, requestPermission] = useDeviceOrientation();
  
  // Get game context for boundaries and obstacles
  const { boundaries, obstacles } = useGameContext();
  
  // State for position and physics
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  
  // Animation frame reference for cleanup
  const animationFrameRef = useRef<number>();
  
  // Physics constants
  const FRICTION = 0.98;
  const ACCELERATION = 0.15;
  const MAX_VELOCITY = 15;
  
  // Handle permission button click
  const handlePermissionRequest = async () => {
    await requestPermission();
  };
  
  // Update velocity based on device orientation
  useEffect(() => {
    if (!isLocal) return; // Only apply physics to local marble
    
    if (orientation.beta !== null && orientation.gamma !== null) {
      // Convert orientation data to marble acceleration
      // Limit tilt values to reasonable ranges (-45 to 45 degrees)
      const tiltX = Math.max(-45, Math.min(45, orientation.gamma)) / 45;
      const tiltY = Math.max(-45, Math.min(45, orientation.beta)) / 45;
      
      // Update velocity based on tilt
      setVelocity(prev => {
        const newVx = prev.x + tiltX * ACCELERATION;
        const newVy = prev.y + tiltY * ACCELERATION;
        
        // Limit maximum velocity
        return {
          x: Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, newVx)),
          y: Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, newVy))
        };
      });
    }
  }, [orientation, isLocal]);
  
  // Apply physics each frame
  useEffect(() => {
    if (!isLocal) return; // Only apply physics to local marble
    
    const updatePhysics = () => {
      // Apply friction
      const newVelocity = {
        x: velocity.x * FRICTION,
        y: velocity.y * FRICTION
      };
      
      // Update position
      let newX = position.x + newVelocity.x;
      let newY = position.y + newVelocity.y;
      
      // Apply boundaries
      if (boundaries) {
        if (newX - radius < boundaries.left) {
          newX = boundaries.left + radius;
          newVelocity.x = -newVelocity.x * 0.5; // Bounce with energy loss
        } else if (newX + radius > boundaries.right) {
          newX = boundaries.right - radius;
          newVelocity.x = -newVelocity.x * 0.5;
        }
        
        if (newY - radius < boundaries.top) {
          newY = boundaries.top + radius;
          newVelocity.y = -newVelocity.y * 0.5;
        } else if (newY + radius > boundaries.bottom) {
          newY = boundaries.bottom - radius;
          newVelocity.y = -newVelocity.y * 0.5;
        }
      }
      
      // Check collisions with obstacles (simplified)
      if (obstacles) {
        obstacles.forEach(obstacle => {
          // Simple circular collision detection
          const dx = newX - obstacle.x;
          const dy = newY - obstacle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < radius + obstacle.radius) {
            // Collision response - bounce away from obstacle
            const angle = Math.atan2(dy, dx);
            const bounceX = Math.cos(angle);
            const bounceY = Math.sin(angle);
            
            // Position correction
            newX = obstacle.x + (radius + obstacle.radius) * bounceX;
            newY = obstacle.y + (radius + obstacle.radius) * bounceY;
            
            // Velocity reflection
            const dotProduct = newVelocity.x * bounceX + newVelocity.y * bounceY;
            newVelocity.x = newVelocity.x - 2 * dotProduct * bounceX;
            newVelocity.y = newVelocity.y - 2 * dotProduct * bounceY;
            
            // Apply energy loss
            newVelocity.x *= 0.7;
            newVelocity.y *= 0.7;
          }
        });
      }
      
      // Update state
      setPosition({ x: newX, y: newY });
      setVelocity(newVelocity);
      
      // Send position update to parent/server
      if (onPositionUpdate) {
        onPositionUpdate(newX, newY, newVelocity.x, newVelocity.y);
      }
      
      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(updatePhysics);
    };
    
    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(updatePhysics);
    
    // Cleanup animation loop on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    position, 
    velocity, 
    boundaries, 
    obstacles, 
    radius, 
    isLocal, 
    onPositionUpdate
  ]);
  
  return (
    <>
      {/* Show permission button for local marble if needed */}
      {isLocal && orientation.permissionState === 'prompt' && (
        <div className="permission-overlay">
          <button 
            className="permission-button"
            onClick={handlePermissionRequest}
          >
            Enable Tilt Controls
          </button>
        </div>
      )}
      
      {/* Render marble */}
      <div 
        className={`marble ${isLocal ? 'local' : ''}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${radius * 2}px`,
          height: `${radius * 2}px`,
          backgroundColor: color,
          transform: `translate(-50%, -50%)`,
        }}
        data-id={id}
      >
        {/* Inner highlight for 3D effect */}
        <div className="marble-highlight"></div>
        
        {/* Show player ID for remote marbles */}
        {!isLocal && (
          <div className="player-id">{id}</div>
        )}
      </div>
    </>
  );
};

export default Marble;
