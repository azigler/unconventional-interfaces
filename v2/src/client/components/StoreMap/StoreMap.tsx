import React, { useState, useEffect, useRef } from 'react';
import { StoreItem } from '@shared/types/game';
import './StoreMap.css';

// Sample store items - we'll use just 4 for our simple store
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

// Define an interface for the store item with a position on the map
interface StoreItemPosition extends StoreItem {
  x: number;
  y: number;
  width: number;
  height: number;
  buttonX: number; // Position of the buy button
  buttonY: number;
  buttonWidth: number;
  buttonHeight: number;
}

interface StoreMapProps {
  width: number;
  height: number;
  onAddToCart: (item: StoreItem) => void;
  currentMarblePosition: { x: number, y: number };
}

const StoreMap: React.FC<StoreMapProps> = ({
  width,
  height,
  onAddToCart,
  currentMarblePosition
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Place items in a 2x2 grid
  const [storeItems, setStoreItems] = useState<StoreItemPosition[]>(() => {
    const cellWidth = width / 2;
    const cellHeight = height / 2;
    const itemPadding = 20;
    const buttonSize = 60;
    
    return STORE_ITEMS.map((item, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      
      // Calculate position within the grid
      const x = col * cellWidth + itemPadding;
      const y = row * cellHeight + itemPadding;
      const itemWidth = cellWidth - (itemPadding * 2);
      const itemHeight = cellHeight - (itemPadding * 2);
      
      // Place buy button in the bottom right of each item
      const buttonX = x + itemWidth - buttonSize - 10;
      const buttonY = y + itemHeight - buttonSize - 10;
      
      return {
        ...item,
        x,
        y,
        width: itemWidth,
        height: itemHeight,
        buttonX,
        buttonY,
        buttonWidth: buttonSize,
        buttonHeight: buttonSize
      };
    });
  });
  
  // Track which items have been added to cart
  const [addedToCart, setAddedToCart] = useState<Record<string, boolean>>({});
  
  // Check for collisions with buy buttons
  useEffect(() => {
    if (!currentMarblePosition) return;
    
    // Debounce collision detection using a ref
    const marbleRadius = 15; // Approximate radius of the marble
    
    // Create a local copy of the storeItems to avoid race conditions
    const itemsToCheck = storeItems.filter(item => !addedToCart[item.id]);
    
    // Return early if no items to check
    if (itemsToCheck.length === 0) return;
    
    // Convert marble position to canvas coordinates
    const marbleCenterX = currentMarblePosition.x + width / 2;
    const marbleCenterY = currentMarblePosition.y + height / 2;
    
    itemsToCheck.forEach(item => {
      // Button center coordinates
      const buttonCenterX = item.buttonX + item.buttonWidth / 2;
      const buttonCenterY = item.buttonY + item.buttonHeight / 2;
      
      // Calculate distance between marble center and button center
      const dx = marbleCenterX - buttonCenterX;
      const dy = marbleCenterY - buttonCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Collision detected if distance is less than marble radius + half button width
      const collisionThreshold = marbleRadius + Math.min(item.buttonWidth, item.buttonHeight) / 2;
      
      if (distance < collisionThreshold) {
        // Add to cart
        onAddToCart(item);
        
        // Mark as added
        setAddedToCart(prev => ({
          ...prev,
          [item.id]: true
        }));
        
        // Prevent multiple additions by updating state
        console.log(`Added ${item.name} to cart!`);
      }
    });
  }, [currentMarblePosition, width, height, onAddToCart]);
  
  // Draw the store map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background grid
    const gridSize = 50;
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.2)';
    ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw store items
    storeItems.forEach(item => {
      // Draw item background
      ctx.fillStyle = 'rgba(240, 240, 240, 0.6)';
      ctx.fillRect(item.x, item.y, item.width, item.height);
      
      // Draw item border
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(item.x, item.y, item.width, item.height);
      
      // Draw item name
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(item.name, item.x + 10, item.y + 10);
      
      // Draw item price
      ctx.fillStyle = 'rgba(0, 100, 0, 0.8)';
      ctx.font = '14px Arial';
      ctx.fillText(`$${item.price}`, item.x + 10, item.y + 30);
      
      // Draw buy button
      if (!addedToCart[item.id]) {
        // Button background
        ctx.fillStyle = 'rgba(0, 150, 50, 0.8)';
        ctx.beginPath();
        ctx.arc(
          item.buttonX + item.buttonWidth / 2,
          item.buttonY + item.buttonHeight / 2,
          item.buttonWidth / 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
        
        // Button text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          'BUY',
          item.buttonX + item.buttonWidth / 2,
          item.buttonY + item.buttonHeight / 2
        );
      } else {
        // Already added to cart - show checkmark
        ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
        ctx.beginPath();
        ctx.arc(
          item.buttonX + item.buttonWidth / 2,
          item.buttonY + item.buttonHeight / 2,
          item.buttonWidth / 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
        
        // Checkmark
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          '✓',
          item.buttonX + item.buttonWidth / 2,
          item.buttonY + item.buttonHeight / 2
        );
      }
    });
    
  }, [width, height, storeItems, addedToCart]);
  
  return (
    <div className="store-map">
      <canvas
        ref={canvasRef}
        className="store-map-canvas"
        width={width}
        height={height}
      />
    </div>
  );
};

export default StoreMap;
