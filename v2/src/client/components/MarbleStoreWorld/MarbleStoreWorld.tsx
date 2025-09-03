import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Player, StoreItem, CartItem } from '@shared/types/game';
import { useGame } from '../../contexts/GameContext';
import Matter from 'matter-js';
import StoreMap from '../StoreMap/StoreMap';
import './MarbleStoreWorld.css';

interface MarbleStoreWorldProps {
  width?: number;
  height?: number;
  orientationData?: { x: number, y: number };
  onAddToCart: (item: StoreItem) => void;
}

// Type definition to track Matter.js bodies for each player
interface PlayerBody {
  playerId: string;
  body: Matter.Body;
}

const MarbleStoreWorld: React.FC<MarbleStoreWorldProps> = ({
  width = 800,
  height = 500,
  orientationData = { x: 0, y: 0 },
  onAddToCart
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { players, currentPlayer, currentRoomId, updatePlayerPosition } = useGame();
  
  // Refs for Matter.js objects
  const engineRef = useRef<Matter.Engine>();
  const worldRef = useRef<Matter.World>();
  const renderRef = useRef<Matter.Render>();
  const playerBodiesRef = useRef<PlayerBody[]>([]);
  const currentRoomIdRef = useRef<string | null>(null);
  
  // Track current player position for collision detection with store items
  const [currentPlayerPosition, setCurrentPlayerPosition] = useState({ x: 0, y: 0 });
  
  // Keep track of the current room ID
  useEffect(() => {
    // Update the ref when the room ID changes
    currentRoomIdRef.current = currentRoomId;
  }, [currentRoomId]);
  
  // Set up the Matter.js physics engine and rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Create Matter.js engine
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0, scale: 0 } // Disable default gravity
    });
    
    // Get the world from the engine
    const world = engine.world;
    
    // Create walls to contain the marbles
    const wallThickness = 50;
    const walls = [
      // Top wall
      Matter.Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, { isStatic: true }),
      // Bottom wall
      Matter.Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, { isStatic: true }),
      // Left wall
      Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, { isStatic: true }),
      // Right wall
      Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, { isStatic: true })
    ];
    
    // Create dividers for the 2x2 grid of store items
    const dividers = [
      // Horizontal divider
      Matter.Bodies.rectangle(width / 2, height / 2, width, 10, { isStatic: true }),
      // Vertical divider
      Matter.Bodies.rectangle(width / 2, height / 2, 10, height, { isStatic: true })
    ];
    
    // Add walls and dividers to the world
    Matter.Composite.add(world, [...walls, ...dividers]);
    
    // Create bodies for all connected players
    playerBodiesRef.current = players
      .filter(player => player.connected)
      .map(player => {
        // Calculate initial position
        const x = width / 2 + player.x;
        const y = height / 2 + player.y;
        
        // Create circular body for the marble
        const marbleSize = 30;
        const body = Matter.Bodies.circle(x, y, marbleSize / 2, {
          restitution: 0.7,  // Slightly reduced bounciness
          friction: 0.05,    // Increased friction a bit
          frictionAir: 0.02, // Increased air resistance
          density: 0.005,    // Increased density
          label: player.id   // Use player ID as label
        });
        
        return { playerId: player.id, body };
      });
    
    // Add player bodies to the world
    Matter.Composite.add(world, playerBodiesRef.current.map(pb => pb.body));
    
    // Store refs for use in other effects
    engineRef.current = engine;
    worldRef.current = world;
    
    // Create a runner to update the physics engine
    const runner = Matter.Runner.create({
      isFixed: true, // Fixed time step
      delta: 1000 / 60 // 60 fps
    });
    Matter.Runner.run(runner, engine);
    
    // Animation loop
    let animationFrameId: number;
    // Throttle position updates to avoid rapid state changes
    let lastPositionUpdateTime = 0;
    const positionUpdateInterval = 100; // Only update position state every 100ms
    
    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Get current player position if available
      if (currentPlayer) {
        const currentPlayerBody = playerBodiesRef.current.find(
          pb => pb.playerId === currentPlayer.id
        )?.body;
        
        if (currentPlayerBody) {
          // Only update position state at throttled intervals to prevent re-render loops
          const now = performance.now();
          if (now - lastPositionUpdateTime > positionUpdateInterval) {
            lastPositionUpdateTime = now;
            
            // Calculate game coordinates (relative to center)
            const gameX = currentPlayerBody.position.x - width / 2;
            const gameY = currentPlayerBody.position.y - height / 2;
            
            // Update current player position for collision detection in the local component
            setCurrentPlayerPosition({
              x: gameX,
              y: gameY
            });
            
            // Update position in Firestore
            updatePlayerPosition(gameX, gameY);
          }
        }
      }
      
      // Draw marbles from physics bodies
      for (const playerBody of playerBodiesRef.current) {
        const player = players.find(p => p.id === playerBody.playerId);
        if (!player || !player.connected) continue;
        
        // Get position from Matter.js body
        const x = playerBody.body.position.x;
        const y = playerBody.body.position.y;
        
        drawMarble(ctx, x, y, player);
      }
      
      // Continue animation loop
      animationFrameId = requestAnimationFrame(render);
    };
    
    // Start the rendering loop
    render();
    
    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
    };
  }, [players, currentPlayer, width, height, updatePlayerPosition]);
  
  // Apply forces based on device orientation
  useEffect(() => {
    if (!orientationData || !engineRef.current || !playerBodiesRef.current.length) return;
    
    // Find current player's body
    if (!currentPlayer) return;
    
    const currentPlayerBody = playerBodiesRef.current.find(
      pb => pb.playerId === currentPlayer.id
    )?.body;
    
    if (!currentPlayerBody) return;
    
    // INCREMENTAL FORCE APPLICATION - More natural rolling behavior
    const forceMagnitude = 0.005; // Smaller value for more gradual acceleration
    const maxForce = 0.2; // Cap the maximum force to prevent extreme acceleration
    
    // Only apply if there's significant tilt to avoid jitter
    if (Math.abs(orientationData.x) > 0.1 || Math.abs(orientationData.y) > 0.1) {
      // Calculate force based on tilt angle (capped by maxForce)
      const forceX = Math.min(Math.max(orientationData.x * forceMagnitude, -maxForce), maxForce);
      const forceY = Math.min(Math.max(orientationData.y * forceMagnitude, -maxForce), maxForce);
      
      // Apply the force to the center of the body
      Matter.Body.applyForce(currentPlayerBody, currentPlayerBody.position, {
        x: forceX,
        y: forceY
      });
      
      // Add a small amount of friction/damping to prevent eternal acceleration
      const frictionFactor = 0.99;
      Matter.Body.setVelocity(currentPlayerBody, {
        x: currentPlayerBody.velocity.x * frictionFactor,
        y: currentPlayerBody.velocity.y * frictionFactor
      });
    }
    
    // Add a maximum speed cap to prevent extremely fast movement
    const currentSpeed = Math.sqrt(
      currentPlayerBody.velocity.x * currentPlayerBody.velocity.x + 
      currentPlayerBody.velocity.y * currentPlayerBody.velocity.y
    );
    
    const maxSpeed = 10; // Maximum speed cap
    
    if (currentSpeed > maxSpeed) {
      const scaleFactor = maxSpeed / currentSpeed;
      Matter.Body.setVelocity(currentPlayerBody, {
        x: currentPlayerBody.velocity.x * scaleFactor,
        y: currentPlayerBody.velocity.y * scaleFactor
      });
    }
    
  }, [orientationData.x, orientationData.y, currentPlayer]);
  
  // Draw a marble with proper styling
  const drawMarble = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    player: Player
  ) => {
    const marbleSize = 30;
    const isCurrentPlayer = player.id === currentPlayer?.id;
    
    // Find the physics body for this player to get velocity for rotation
    const playerBody = playerBodiesRef.current.find(pb => pb.playerId === player.id)?.body;
    
    ctx.save();
    
    // Draw shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, marbleSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Save context for rotation
    ctx.save();
    ctx.translate(x, y);
    
    // Calculate rotation angle based on velocity (for rolling effect)
    if (playerBody) {
      // We'll use the velocity to calculate a rotation that makes it look like the marble is rolling
      // Rotation angle proportional to speed and elapsed time
      const speed = Math.sqrt(playerBody.velocity.x * playerBody.velocity.x + playerBody.velocity.y * playerBody.velocity.y);
      const rotationSpeed = speed * 0.2; // Adjust this factor to control rotation speed
      
      // Angle based on direction of travel
      let angle = 0;
      if (speed > 0.1) { // Only rotate if moving significantly
        angle = Math.atan2(playerBody.velocity.y, playerBody.velocity.x) + Math.PI/2;
      }
      
      // Apply rotation based on time
      const time = performance.now() / 100;
      ctx.rotate(angle);
      
      // Create pattern effect to visualize rotation
      const segments = 4;
      for (let i = 0; i < segments; i++) {
        const segAngle = (i / segments) * Math.PI * 2 + time * rotationSpeed;
        
        // Draw segment
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, marbleSize / 2, segAngle, segAngle + Math.PI / segments);
        ctx.closePath();
        
        // Alternate colors slightly for better visualization of rotation
        const brightness = 1 - 0.15 * (i % 2);
        const color = player.color;
        ctx.fillStyle = adjustColorBrightness(color, brightness);
        ctx.fill();
      }
    } else {
      // Fallback if no physics body is found
      ctx.beginPath();
      ctx.arc(0, 0, marbleSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = player.color;
      ctx.fill();
    }
    
    // Add highlight (after restoring non-rotated context)
    ctx.restore();
    
    const gradient = ctx.createRadialGradient(
      x - marbleSize / 4,
      y - marbleSize / 4,
      0,
      x,
      y,
      marbleSize / 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, marbleSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Highlight current player's marble
    if (isCurrentPlayer) {
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, marbleSize / 2 + 3, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw a direction indicator for force visualization
      if (orientationData && (Math.abs(orientationData.x) > 0.1 || Math.abs(orientationData.y) > 0.1)) {
        const forceMultiplier = 20; // Scale up for visibility
        
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
          x + orientationData.x * forceMultiplier,
          y + orientationData.y * forceMultiplier
        );
        ctx.stroke();
      }
    }
    
    // Draw player name
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(player.name, x, y + marbleSize / 2 + 5);
    
    ctx.restore();
  };
  
  // Helper function to adjust color brightness
  const adjustColorBrightness = (color: string, factor: number): string => {
    // Simple implementation for basic colors
    if (color.startsWith('#')) {
      // Convert hex to RGB
      const r = parseInt(color.substr(1, 2), 16);
      const g = parseInt(color.substr(3, 2), 16);
      const b = parseInt(color.substr(5, 2), 16);
      
      // Apply brightness factor
      const adjustedR = Math.min(255, Math.max(0, Math.floor(r * factor)));
      const adjustedG = Math.min(255, Math.max(0, Math.floor(g * factor)));
      const adjustedB = Math.min(255, Math.max(0, Math.floor(b * factor)));
      
      // Convert back to hex
      return `#${adjustedR.toString(16).padStart(2, '0')}${adjustedG.toString(16).padStart(2, '0')}${adjustedB.toString(16).padStart(2, '0')}`;
    }
    
    // Return original color if not in hex format
    return color;
  };
  
  // Handle adding an item to the cart
  const handleAddToCart = useCallback((item: StoreItem) => {
    onAddToCart(item);
  }, [onAddToCart]);
  
  return (
    <div className="marble-store-world">
      <div className="store-layer">
        <StoreMap
          width={width}
          height={height}
          onAddToCart={handleAddToCart}
          currentMarblePosition={currentPlayerPosition}
        />
      </div>
      <canvas
        ref={canvasRef}
        className="marble-world-canvas"
        width={width}
        height={height}
      />
    </div>
  );
};

export default MarbleStoreWorld;
