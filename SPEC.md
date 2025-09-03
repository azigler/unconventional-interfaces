# Marble Tilt: Multiplayer Marble Game Specification

## Project Overview

Marble Tilt is a multiplayer game that uses phone tilt controls as an unconventional interface to control marbles on a shared game board. Players join a common game world where their marble interacts with obstacles, collectibles, and other players' marbles. The game leverages the device orientation API to translate physical phone movement into marble movement in the game.

## Core Concept

- **Unconventional Interface**: Players control their marble by physically tilting their phone
- **Multiplayer Experience**: Multiple players join a shared game world
- **Dual View System**: 
  - **LOBBY View**: A global view showing all marbles and the entire game world
  - **LOCAL View**: A player-centered view showing the game from their marble's perspective

## Technical Architecture

### 1. Frontend Components

- **Game Client**:
  - React + Vite for fast development and lightweight bundle
  - HTML5 Canvas for rendering (via React components)
  - TypeScript for improved type safety and developer experience
  - Device Orientation API for tilt controls
  - WebSockets for real-time multiplayer communication
  
- **Responsive Design**:
  - Mobile-first approach with React
  - Orientation lock to landscape for optimal gameplay
  - Touch fallback controls for devices without gyroscope
  - Component-based architecture for better state management

### 2. Backend Components

- **Game Server**:
  - Node.js server with Express
  - WebSocket server for real-time communication
  - Game state management
  - Player session handling
  
- **HTTPS Implementation**:
  - Required for Device Orientation API access
  - SSL certificate configuration
  - Secure WebSocket connections (WSS)

### 3. Multiplayer Architecture

- **Real-time State Synchronization**:
  - WebSocket protocol for low-latency updates
  - Server-authoritative game state
  - Client-side prediction for smooth gameplay
  
- **Player Management**:
  - Unique player IDs and session handling
  - Lobby system for game creation and joining
  - Spectator mode for LOBBY view

### 4. Game Mechanics

- **Physics System**:
  - 2D physics simulation for marble movement
  - Collision detection and response
  - Momentum and friction modeling
  
- **Game Elements**:
  - Obstacles: walls, bumpers, holes
  - Collectibles: points, power-ups
  - Special tiles: speed boosts, jump pads, teleporters
  
- **Game Modes**:
  - Free Play: casual exploration
  - Race: timed courses with checkpoints
  - Collection: gather items while competing with other players
  - Elimination: last marble standing

## User Experience

### 1. LOBBY View

- **Purpose**: Central display showing the entire game world
- **Features**:
  - Bird's-eye view of all marbles and obstacles
  - Scoreboard and player status
  - Game mode controls and settings
  - QR code for new players to join
  
- **Implementation**:
  - Larger display (tablet, desktop, or TV)
  - Can be run on a dedicated device or any player's device in LOBBY mode

### 2. LOCAL View

- **Purpose**: Individual player view centered on their marble
- **Features**:
  - Marble-centered camera following player movement
  - Tilt controls visualization
  - Personal stats and power-up indicators
  - Minimap showing location in the larger world
  
- **Implementation**:
  - Mobile-optimized display
  - Responsive to device orientation changes
  - Haptic feedback for collisions and events

### 3. Onboarding Experience

- Simple tutorial explaining tilt controls
- Practice area for new players
- Visual guides for optimal phone holding position
- Progressive difficulty introduction

## Device Orientation Implementation

In our React implementation, we'll use a custom hook to handle device orientation:

```typescript
// hooks/useDeviceOrientation.ts
import { useState, useEffect } from 'react';

interface OrientationData {
  beta: number | null;  // front-to-back tilt
  gamma: number | null; // left-to-right tilt
  alpha: number | null; // device compass direction
  absolute: boolean;    // whether values are absolute
  isSupported: boolean; // if device orientation is supported
  permissionState: 'granted' | 'denied' | 'prompt' | 'not-required';
}

export const useDeviceOrientation = (): [
  OrientationData, 
  () => Promise<boolean>
] => {
  const [orientation, setOrientation] = useState<OrientationData>({
    beta: null,
    gamma: null,
    alpha: null,
    absolute: false,
    isSupported: 'DeviceOrientationEvent' in window,
    permissionState: 'prompt'
  });

  // Request permission for iOS devices
  const requestPermission = async (): Promise<boolean> => {
    if (!orientation.isSupported) return false;

    // iOS 13+ requires permission
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permissionState = await DeviceOrientationEvent.requestPermission();
        setOrientation(prev => ({ ...prev, permissionState }));
        return permissionState === 'granted';
      } catch (error) {
        console.error('Error requesting device orientation permission:', error);
        return false;
      }
    } else {
      // Permission not required for this device
      setOrientation(prev => ({ ...prev, permissionState: 'granted' }));
      return true;
    }
  };

  useEffect(() => {
    // Only add event listener if permission is granted or not required
    if (orientation.permissionState === 'granted') {
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
      
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    }
  }, [orientation.permissionState]);

  return [orientation, requestPermission];
};
```

This hook can then be used in our marble component:

```tsx
// components/Marble.tsx
import React, { useEffect, useState } from 'react';
import { useDeviceOrientation } from '../hooks/useDeviceOrientation';

interface MarbleProps {
  onPositionUpdate: (x: number, y: number, vx: number, vy: number) => void;
}

export const Marble: React.FC<MarbleProps> = ({ onPositionUpdate }) => {
  const [orientation, requestPermission] = useDeviceOrientation();
  const [position, setPosition] = useState({ x: 250, y: 250 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  
  // Handle permission button click
  const handlePermissionRequest = async () => {
    await requestPermission();
  };
  
  // Update physics based on orientation
  useEffect(() => {
    if (orientation.beta !== null && orientation.gamma !== null) {
      // Convert orientation data to marble acceleration
      const tiltX = Math.max(-45, Math.min(45, orientation.gamma)) / 45;
      const tiltY = Math.max(-45, Math.min(45, orientation.beta)) / 45;
      
      // Update velocity based on tilt
      setVelocity(prev => ({
        x: prev.x + tiltX * 0.1,
        y: prev.y + tiltY * 0.1
      }));
    }
  }, [orientation]);
  
  // Apply physics and boundaries each frame
  useEffect(() => {
    const friction = 0.98;
    const animationFrame = requestAnimationFrame(() => {
      // Apply friction
      const newVelocity = {
        x: velocity.x * friction,
        y: velocity.y * friction
      };
      
      // Update position
      const newPosition = {
        x: position.x + newVelocity.x,
        y: position.y + newVelocity.y
      };
      
      // Apply boundaries (simplified)
      // In a real implementation, we would check against game world boundaries
      
      // Update state
      setVelocity(newVelocity);
      setPosition(newPosition);
      
      // Send position update to parent component (will be sent to server)
      onPositionUpdate(newPosition.x, newPosition.y, newVelocity.x, newVelocity.y);
    });
    
    return () => cancelAnimationFrame(animationFrame);
  }, [position, velocity, onPositionUpdate]);
  
  return (
    <>
      {orientation.permissionState === 'prompt' && (
        <button onClick={handlePermissionRequest}>
          Enable Tilt Controls
        </button>
      )}
      
      {/* Render marble on canvas or using SVG */}
      <div 
        className="marble"
        style={{
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, white, #2196F3)',
          boxShadow: '2px 2px 5px rgba(0,0,0,0.2)'
        }}
      />
    </>
  );
};
```

## Subagent Implementation with Goose

Goose subagents will be used to handle different aspects of development and game operation:

### 1. Physics Subagent
- Implements and tunes the physics system
- Handles collision detection and response
- Optimizes performance for multiple moving objects

### 2. Networking Subagent
- Manages WebSocket communication
- Implements state synchronization
- Handles latency compensation and prediction

### 3. UI/UX Subagent
- Designs responsive interfaces for LOBBY and LOCAL views
- Implements visual feedback for player actions
- Creates engaging visual effects and animations

### 4. Game Logic Subagent
- Implements game rules and scoring
- Manages game state and transitions
- Creates balanced gameplay mechanics

### 5. Testing Subagent
- Automated testing of physics and networking
- Simulates multiple players for load testing
- Validates cross-device compatibility

## Implementation Roadmap

### Phase 1: Core Functionality
1. Set up React + Vite project with HTTPS
2. Create React components for game elements
3. Implement device orientation hook
4. Develop marble physics system with React state

### Phase 2: Multiplayer Foundation
1. Set up Node.js WebSocket server
2. Create React context for WebSocket management
3. Implement real-time state synchronization
4. Develop LOBBY and LOCAL view components

### Phase 3: Game World Development
1. Design level components and obstacle systems
2. Implement collision detection with React hooks
3. Add scoring system and game mechanics
4. Create visual assets and React animations

### Phase 4: Polish and Optimization
1. Optimize React rendering and state management
2. Add sound effects and haptic feedback
3. Implement onboarding and tutorial components
4. Fine-tune physics parameters and controls

## Technical Requirements

- **React + Vite**: For lightweight, fast development
- **TypeScript**: For type safety and better developer experience
- **HTTPS Server**: Required for device orientation API access
- **Modern Browser Support**: Chrome, Safari, Firefox (mobile versions)
- **WebSocket Support**: For real-time multiplayer
- **Device Requirements**:
  - Accelerometer and gyroscope
  - Modern smartphone (iOS 13+ or Android 8+)
  - Stable internet connection

## Development Setup

1. **React + Vite Setup with HTTPS**:
   ```bash
   # Create new Vite project with React and TypeScript
   npm create vite@latest marble-tilt -- --template react-ts
   cd marble-tilt
   
   # Install dependencies
   npm install
   
   # Set up HTTPS for development
   # 1. Generate certificates using mkcert
   # 2. Configure Vite for HTTPS
   ```

2. **WebSocket Server Setup**:
   ```bash
   # Create server directory
   mkdir server
   cd server
   
   # Initialize package.json
   npm init -y
   
   # Install dependencies
   npm install express ws https
   npm install -D typescript @types/express @types/ws @types/node
   
   # Create TypeScript configuration
   npx tsc --init
   ```

3. **Testing Environment**:
   - Mobile device testing with local network access
   - QR code generation for easy connection
   - Cross-device testing protocol

## Conclusion

Marble Tilt leverages the physical movement of phones as an unconventional interface to create an engaging multiplayer experience. By utilizing device orientation sensors and real-time networking, the game creates a unique interaction model where players physically tilt their devices to navigate a shared virtual world. The dual-view system with LOBBY and LOCAL perspectives allows for both collaborative and competitive gameplay while maintaining individual player agency.
