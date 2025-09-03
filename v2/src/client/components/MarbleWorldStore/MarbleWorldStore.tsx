import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Player, StoreItem, CartItem } from '@shared/types/game';
import { useGame } from '../../contexts/GameContext';
import Matter from 'matter-js';
import './MarbleWorldStore.css';

interface MarbleWorldStoreProps {
  isLocalView?: boolean;
  width?: number;
  height?: number;
  orientationData?: { x: number, y: number };
}

// Type definition to track Matter.js bodies for each player
interface PlayerBody {
  playerId: string;
  body: Matter.Body;
}

// Store item with position and physics body
interface StoreItemWithPhysics extends StoreItem {
  x: number;
  y: number;
  body: Matter.Body | null;
  collected: boolean;
}

// Interface for item dots on the map
interface ItemDot {
  id: string;
  itemId: string;
  x: number; // position as percentage of canvas (0-1)
  y: number; // position as percentage of canvas (0-1)
  body: Matter.Body; // Physics body for collision detection
  collected: boolean;
  pulseAnimation?: {
    scale: number;
    growing: boolean;
  };
}

// Sample store items
const STORE_ITEMS: StoreItem[] = [
  {
    id: '1',
    name: 'Speed Boost',
    description: 'Increase your marble speed by 20%',
    price: 100,
    category: 'powerup'
  },
  {
    id: '2',
    name: 'Jumbo Size',
    description: 'Make your marble 50% larger',
    price: 150,
    category: 'appearance'
  },
  {
    id: '3',
    name: 'Shrink Ray',
    description: 'Reduce your marble size by 30%',
    price: 120,
    category: 'powerup'
  },
  {
    id: '4',
    name: 'Golden Marble',
    description: 'A luxurious golden marble skin',
    price: 300,
    category: 'appearance'
  }
];

// Item dots scattered around the map - MORE DOTS added and spread out
const ITEM_DOTS = [
  { id: 'dot1', itemId: '1', x: 0.2, y: 0.2 },
  { id: 'dot2', itemId: '2', x: 0.8, y: 0.2 },
  { id: 'dot3', itemId: '3', x: 0.2, y: 0.8 },
  { id: 'dot4', itemId: '4', x: 0.8, y: 0.8 },
  { id: 'dot5', itemId: '1', x: 0.5, y: 0.3 },
  { id: 'dot6', itemId: '2', x: 0.3, y: 0.5 },
  { id: 'dot7', itemId: '3', x: 0.7, y: 0.5 },
  { id: 'dot8', itemId: '4', x: 0.5, y: 0.7 },
  { id: 'dot9', itemId: '1', x: 0.4, y: 0.4 },
  { id: 'dot10', itemId: '2', x: 0.6, y: 0.6 },
  { id: 'dot11', itemId: '3', x: 0.3, y: 0.3 },
  { id: 'dot12', itemId: '4', x: 0.7, y: 0.7 },
  { id: 'dot13', itemId: '1', x: 0.5, y: 0.5 },
  { id: 'dot14', itemId: '2', x: 0.2, y: 0.5 },
  { id: 'dot15', itemId: '3', x: 0.5, y: 0.2 },
];

const MarbleWorldStore: React.FC<MarbleWorldStoreProps> = ({
  isLocalView = false,
  width = 800,
  height = 500,
  orientationData = { x: 0, y: 0 }
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { players, currentPlayer, currentRoomId, updatePlayerPosition, addItemToCart } = useGame();
  
  // Refs for Matter.js objects
  const engineRef = useRef<Matter.Engine>();
  const worldRef = useRef<Matter.World>();
  const playerBodiesRef = useRef<PlayerBody[]>([]);
  
  // Store items with physics and collection state
  const [storeItems, setStoreItems] = useState<StoreItemWithPhysics[]>([]);
  
  // Item dots with physics and collection state
  const [itemDots, setItemDots] = useState<ItemDot[]>([]);
  
  // Track player's cart items
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Display cart notification
  const [showCartNotification, setShowCartNotification] = useState<boolean>(false);
  const [lastAddedItem, setLastAddedItem] = useState<string | null>(null);
  
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
    
    // Add walls to the world
    Matter.Composite.add(world, walls);
    
    // Create bodies for all connected players
    playerBodiesRef.current = players
      .filter(player => player.connected)
      .map(player => {
        // Calculate initial position
        const x = isLocalView && currentPlayer
          ? width / 2 + (player.x - currentPlayer.x)
          : width / 2 + player.x;
          
        const y = isLocalView && currentPlayer
          ? height / 2 + (player.y - currentPlayer.y)
          : height / 2 + player.y;
        
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
    
    // Create store items
    const itemSize = 40;
    const itemBodies: Matter.Body[] = [];
    const newStoreItems: StoreItemWithPhysics[] = STORE_ITEMS.map((item, index) => {
      // Calculate position in a 2x2 grid
      const row = Math.floor(index / 2);
      const col = index % 2;
      
      const padding = 100;
      const gridCellWidth = (width - padding * 2) / 2;
      const gridCellHeight = (height - padding * 2) / 2;
      
      const x = padding + col * gridCellWidth + gridCellWidth / 2;
      const y = padding + row * gridCellHeight + gridCellHeight / 2;
      
      // Create a static circular body for the item
      const body = Matter.Bodies.circle(x, y, itemSize / 2, {
        isStatic: true,
        isSensor: true, // Make it a sensor so marbles pass through it
        label: `item_${item.id}`
      });
      
      itemBodies.push(body);
      
      return {
        ...item,
        x,
        y,
        body,
        collected: false
      };
    });
    
    // Add item bodies to the world
    Matter.Composite.add(world, itemBodies);
    
    // Set store items state
    setStoreItems(newStoreItems);
    
    // Create item dots
    const dotSize = 25; // INCREASED size for better collision detection
    const dotBodies: Matter.Body[] = [];
    const newItemDots: ItemDot[] = ITEM_DOTS.map(dot => {
      // Calculate actual position from percentage
      const x = width * dot.x;
      const y = height * dot.y;
      
      // Create a static circular body for the dot
      // Using a larger sensor radius than visual size for easier collection
      const body = Matter.Bodies.circle(x, y, dotSize, {
        isStatic: true,
        isSensor: true, // Make it a sensor so marbles pass through it
        label: `dot_${dot.id}`
      });
      
      dotBodies.push(body);
      
      // Find the associated store item
      const storeItem = STORE_ITEMS.find(item => item.id === dot.itemId);
      
      return {
        ...dot,
        x: dot.x,  // Keep percentage for calculations
        y: dot.y,  // Keep percentage for calculations
        body: body, // Store reference to the physics body
        collected: false,
        pulseAnimation: {
          scale: 1.0,
          growing: true
        }
      };
    });
    
    // Add dot bodies to the world
    Matter.Composite.add(world, dotBodies);
    
    // Set item dots state
    setItemDots(newItemDots);
    
    console.log("Created item dots:", newItemDots.length);
    
    // Store refs for use in other effects
    engineRef.current = engine;
    worldRef.current = world;
    
    // Set up collision detection for items and dots
    Matter.Events.on(engine, 'collisionStart', (event) => {
      const pairs = event.pairs;
      
      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        
        // Check if collision involves a player and an item/dot
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;
        
        // Find the player and item bodies
        let playerBody = null;
        let itemLabel = null;
        let dotLabel = null;
        
        // Check for item collision
        if (bodyA.label.startsWith('item_') && players.some(p => p.id === bodyB.label)) {
          itemLabel = bodyA.label.substring(5); // Remove 'item_' prefix
          playerBody = bodyB;
        } else if (bodyB.label.startsWith('item_') && players.some(p => p.id === bodyA.label)) {
          itemLabel = bodyB.label.substring(5); // Remove 'item_' prefix
          playerBody = bodyA;
        }
        
        // Check for dot collision
        if (bodyA.label.startsWith('dot_') && players.some(p => p.id === bodyB.label)) {
          dotLabel = bodyA.label.substring(4); // Remove 'dot_' prefix
          playerBody = bodyB;
        } else if (bodyB.label.startsWith('dot_') && players.some(p => p.id === bodyA.label)) {
          dotLabel = bodyB.label.substring(4); // Remove 'dot_' prefix
          playerBody = bodyA;
        }
        
        // If this is the current player colliding with an item
        if (playerBody && itemLabel && currentPlayer && playerBody.label === currentPlayer.id) {
          // Find the item by ID
          const item = STORE_ITEMS.find(item => item.id === itemLabel);
          
          if (item) {
            // Handle item collection (existing code)
            setStoreItems(prev => 
              prev.map(storeItem => 
                storeItem.id === itemLabel 
                  ? { ...storeItem, collected: true } 
                  : storeItem
              )
            );
            
            addItemToCart(item);
          }
        }
        
        // If this is the current player colliding with a dot
        if (playerBody && dotLabel && currentPlayer && playerBody.label === currentPlayer.id) {
          console.log(`Dot collision detected: ${dotLabel}`);
          
          // Find the dot by ID
          const dot = itemDots.find(dot => dot.id === dotLabel);
          
          if (dot && !dot.collected) {
            console.log(`Found dot ${dotLabel}, not yet collected`);
            
            // Find the item that this dot represents
            const item = STORE_ITEMS.find(item => item.id === dot.itemId);
            
            if (item) {
              console.log(`Adding item from dot: ${item.name}`);
              
              // Mark dot as collected
              setItemDots(prev => 
                prev.map(d => 
                  d.id === dotLabel 
                    ? { ...d, collected: true } 
                    : d
                )
              );
              
              // Add to cart with a small delay to ensure state is updated
              setTimeout(() => {
                addItemToCart(item);
              }, 10);
            }
          }
        }
      }
    });
    
    // Also check for proximity to dots (backup collision detection)
    Matter.Events.on(engine, 'afterUpdate', () => {
      if (!currentPlayer) return;
      
      // Find current player's body
      const currentPlayerBody = playerBodiesRef.current.find(
        pb => pb.playerId === currentPlayer.id
      )?.body;
      
      if (!currentPlayerBody) return;
      
      // Check each dot for proximity
      itemDots.forEach(dot => {
        if (dot.collected) return;
        
        // Calculate actual position
        const dotX = width * dot.x;
        const dotY = height * dot.y;
        
        // Get player position
        const playerX = currentPlayerBody.position.x;
        const playerY = currentPlayerBody.position.y;
        
        // Calculate distance
        const dx = dotX - playerX;
        const dy = dotY - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If player is close enough to the dot
        const proximityThreshold = 30; // Adjust as needed
        if (distance < proximityThreshold) {
          // Find the item that this dot represents
          const item = STORE_ITEMS.find(item => item.id === dot.itemId);
          
          if (item) {
            console.log(`Proximity collection for dot: ${dot.id}`);
            
            // Mark dot as collected
            setItemDots(prev => 
              prev.map(d => 
                d.id === dot.id 
                  ? { ...d, collected: true } 
                  : d
              )
            );
            
            // Add to cart
            addItemToCart(item);
          }
        }
      });
    });
    
    // Helper function to add item to cart and show notification
    const addItemToCart = (item: StoreItem) => {
      // Add to cart
      setCart(prevCart => {
        // Check if item is already in cart
        const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
        
        if (existingItem) {
          // Increment quantity
          return prevCart.map(cartItem => 
            cartItem.id === item.id 
              ? { ...cartItem, quantity: cartItem.quantity + 1 } 
              : cartItem
          );
        } else {
          // Add new item
          return [...prevCart, {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1
          }];
        }
      });
      
      // Add to player's cart in the game context
      if (currentRoomId && currentPlayer) {
        addItemToCart(currentRoomId, currentPlayer.id, {
          name: item.name,
          price: item.price,
          quantity: 1
        });
      }
      
      // Show notification
      setLastAddedItem(item.name);
      setShowCartNotification(true);
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        setShowCartNotification(false);
      }, 3000);
      
      // Play a sound effect if available
      try {
        const addSound = new Audio('/sounds/add-to-cart.mp3');
        addSound.volume = 0.5;
        addSound.play().catch(e => console.log('Sound play error:', e));
      } catch (error) {
        console.log('Sound not available:', error);
      }
      
      console.log(`Player collected: ${item.name}`);
    };
    
    // Create a runner to update the physics engine
    const runner = Matter.Runner.create({
      isFixed: true, // Fixed time step
      delta: 1000 / 60 // 60 fps
    });
    Matter.Runner.run(runner, engine);
    
    // Animation loop
    let animationFrameId: number;
    let lastUpdateTime = 0;
    const updateInterval = 100; // Only update position to server every 100ms
    
    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate center offset for local view
      let centerX = 0;
      let centerY = 0;
      
      const now = performance.now();
      
      if (isLocalView && currentPlayer) {
        // Find current player's body
        const currentPlayerBody = playerBodiesRef.current.find(
          pb => pb.playerId === currentPlayer.id
        )?.body;
        
        if (currentPlayerBody) {
          centerX = currentPlayerBody.position.x - width / 2;
          centerY = currentPlayerBody.position.y - height / 2;
          
          // Update player position in game state based on physics
          // But only do it at a reasonable interval to avoid too many updates
          if (now - lastUpdateTime > updateInterval) {
            lastUpdateTime = now;
            updatePlayerPosition(
              currentPlayerBody.position.x - width / 2,
              currentPlayerBody.position.y - height / 2
            );
          }
        }
      }
      
      // Draw background grid
      drawGrid(ctx, canvas.width, canvas.height, centerX, centerY);
      
      // Draw store items
      storeItems.forEach(item => {
        if (!item.collected) {
          drawStoreItem(ctx, item);
        }
      });
      
      // Draw item dots
      itemDots.forEach(dot => {
        if (!dot.collected) {
          drawItemDot(ctx, dot, width, height);
        }
      });
      
      // Draw marbles from physics bodies
      for (const playerBody of playerBodiesRef.current) {
        const player = players.find(p => p.id === playerBody.playerId);
        if (!player || !player.connected) continue;
        
        // Get position from Matter.js body
        const x = playerBody.body.position.x;
        const y = playerBody.body.position.y;
        
        drawMarble(ctx, x, y, player);
      }
      
      // Draw cart UI
      drawCartUI(ctx, cart);
      
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
  }, [players, currentPlayer, isLocalView, width, height, updatePlayerPosition, currentRoomId, addItemToCart]);
  
  // Create a useEffect to update dot animations
  useEffect(() => {
    // Animation frames for pulsing dots
    let animationFrameId: number;
    
    const updatePulseAnimations = () => {
      // Update all dot animations
      setItemDots(prev => 
        prev.map(dot => {
          if (dot.collected || !dot.pulseAnimation) return dot;
          
          // Faster animation and wider range
          const growSpeed = 0.02; // Increased speed
          const minScale = 0.7;   // More dramatic shrinking
          const maxScale = 1.3;   // More dramatic growing
          
          let scale = dot.pulseAnimation.scale;
          let growing = dot.pulseAnimation.growing;
          
          if (growing) {
            scale += growSpeed;
            if (scale >= maxScale) {
              growing = false;
            }
          } else {
            scale -= growSpeed;
            if (scale <= minScale) {
              growing = true;
            }
          }
          
          return {
            ...dot,
            pulseAnimation: { scale, growing }
          };
        })
      );
      
      // Continue animation loop
      animationFrameId = requestAnimationFrame(updatePulseAnimations);
    };
    
    // Start animation loop
    animationFrameId = requestAnimationFrame(updatePulseAnimations);
    
    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
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
  
  // Draw background grid
  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    offsetX: number = 0,
    offsetY: number = 0
  ) => {
    const gridSize = 50;
    const lineWidth = 1;
    
    ctx.save();
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.2)';
    ctx.lineWidth = lineWidth;
    
    // Calculate grid offset based on player position for local view
    const offsetGridX = isLocalView ? (offsetX % gridSize) : 0;
    const offsetGridY = isLocalView ? (offsetY % gridSize) : 0;
    
    // Draw vertical lines
    for (let x = offsetGridX; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = offsetGridY; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    ctx.restore();
  };
  
  // Draw a store item
  const drawStoreItem = (
    ctx: CanvasRenderingContext2D,
    item: StoreItemWithPhysics
  ) => {
    const itemSize = 60; // Increased size for better visibility
    
    // Draw item circle
    ctx.save();
    
    // Draw shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(item.x + 2, item.y + 2, itemSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw colored background based on category
    const categoryColors: Record<string, string> = {
      'powerup': '#4CAF50',
      'appearance': '#2196F3',
      'default': '#9C27B0'
    };
    
    const bgColor = categoryColors[item.category] || categoryColors.default;
    
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(item.x, item.y, itemSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Add a shine effect
    const gradient = ctx.createRadialGradient(
      item.x - itemSize / 4, 
      item.y - itemSize / 4,
      0,
      item.x,
      item.y,
      itemSize / 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(item.x, item.y, itemSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw price tag
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`$${item.price}`, item.x, item.y);
    
    // Draw item name below
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(item.name, item.x, item.y + itemSize / 2 + 5);
    
    ctx.restore();
  };
  
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
  
  // Draw cart UI
  const drawCartUI = (
    ctx: CanvasRenderingContext2D,
    cartItems: CartItem[]
  ) => {
    if (cartItems.length === 0) return;
    
    // Draw a semi-transparent background for the cart
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 180, 30 + cartItems.length * 20);
    
    // Draw cart title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Your Cart', 20, 15);
    
    // Draw cart items
    cartItems.forEach((item, index) => {
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${item.name} x${item.quantity} - $${item.price * item.quantity}`, 20, 35 + index * 20);
    });
    
    // Draw total
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Total: $${total}`, 180, 15);
    
    ctx.restore();
  };
  
  // Draw an item dot with animation
  const drawItemDot = (
    ctx: CanvasRenderingContext2D,
    dot: ItemDot,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    // Calculate actual position from percentage
    const x = canvasWidth * dot.x;
    const y = canvasHeight * dot.y;
    
    // Base dot size - INCREASED for better visibility
    const dotSize = 20;
    
    // Use scale from animation or default
    const scale = dot.pulseAnimation?.scale || 1.0;
    
    // Get the associated store item to use its color
    const storeItem = STORE_ITEMS.find(item => item.id === dot.itemId);
    const dotColor = storeItem ? getCategoryColor(storeItem.category) : '#FFC107';
    
    ctx.save();
    
    // Draw shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(x + 1, y + 1, (dotSize / 2) * scale, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw dot with pulsing animation
    ctx.fillStyle = dotColor;
    ctx.beginPath();
    ctx.arc(x, y, (dotSize / 2) * scale, 0, Math.PI * 2);
    ctx.fill();
    
    // Add a stronger glow effect
    const glowGradient = ctx.createRadialGradient(
      x, y, 0,
      x, y, dotSize * scale * 1.5 // Increased glow radius
    );
    glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    glowGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.5)');
    glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(x, y, dotSize * scale * 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Add a shine effect
    const gradient = ctx.createRadialGradient(
      x - (dotSize / 4) * scale, 
      y - (dotSize / 4) * scale,
      0,
      x,
      y,
      (dotSize / 2) * scale
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, (dotSize / 2) * scale, 0, Math.PI * 2);
    ctx.fill();
    
    // Add an outer ring to make it more noticeable
    ctx.strokeStyle = dotColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, (dotSize / 2) * scale * 1.2, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
  };
  
  // Get color based on item category
  const getCategoryColor = (category?: string): string => {
    const categoryColors: Record<string, string> = {
      'powerup': '#4CAF50',
      'appearance': '#2196F3',
      'default': '#9C27B0'
    };
    
    return category ? (categoryColors[category] || categoryColors.default) : categoryColors.default;
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
  
  return (
    <div className="marble-world-container">
      <canvas
        ref={canvasRef}
        className="marble-world-canvas"
        width={width}
        height={height}
      />
      
      {/* Cart notification */}
      {showCartNotification && lastAddedItem && (
        <div className="cart-notification">
          <div className="notification-content">
            <span className="notification-icon">🛒</span>
            <span className="notification-text">Added {lastAddedItem} to cart!</span>
          </div>
        </div>
      )}
      
      <div className="store-instructions">
        <p>Roll your marble over items and glowing dots to add them to your cart!</p>
      </div>
    </div>
  );
};

export default MarbleWorldStore;
