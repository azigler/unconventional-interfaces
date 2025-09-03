import React, { useState, useEffect, useRef } from 'react';
import OrientationControls from '../components/Controls/OrientationControls';
import { StoreProduct } from '../types/store';
import './StoreView.css';

interface MarblePosition {
  x: number;
  y: number;
}

// Sample store products
const STORE_PRODUCTS: StoreProduct[] = [
  {
    id: 1,
    name: 'Premium Marble',
    price: 99.99,
    description: 'A shiny, premium marble with extra bounce.',
    image: '🔮'
  },
  {
    id: 2,
    name: 'Speed Boost',
    price: 49.99,
    description: 'Increase your marble\'s speed for better control.',
    image: '⚡'
  },
  {
    id: 3,
    name: 'Marble Skin',
    price: 19.99,
    description: 'Customize your marble with a new skin.',
    image: '🎨'
  },
  {
    id: 4,
    name: 'Gravity Control',
    price: 149.99,
    description: 'Manipulate gravity to your advantage.',
    image: '🧲'
  }
];

const StoreView: React.FC = () => {
  const [playerName, setPlayerName] = useState<string>('');
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [marblePosition, setMarblePosition] = useState<MarblePosition>({ x: 0, y: 0 });
  const [marbleColor, setMarbleColor] = useState<string>('#2196F3');
  const [cart, setCart] = useState<StoreProduct[]>([]);
  const [lastBuyTime, setLastBuyTime] = useState<number>(0);
  const [buyFeedback, setBuyFeedback] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const productRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const buyHoleRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const animationFrameRef = useRef<number>(0);

  // Handle joining the game
  const handleJoinGame = () => {
    setIsPlaying(true);
    // Generate random color for the marble
    const colors = [
      '#2196F3', // Blue
      '#F44336', // Red
      '#4CAF50', // Green
      '#FF9800', // Orange
      '#9C27B0', // Purple
      '#00BCD4', // Cyan
      '#FFEB3B', // Yellow
      '#795548', // Brown
    ];
    setMarbleColor(colors[Math.floor(Math.random() * colors.length)]);
  };

  // Handle orientation changes from the controls
  const handleOrientationChange = (movement: { x: number, y: number }) => {
    if (!isPlaying) return;

    // Update the marble position with physics simulation
    updateMarblePhysics(movement);
  };

  // Update marble position based on movement input and physics
  const updateMarblePhysics = (movement: { x: number, y: number }) => {
    if (!containerRef.current) return;

    setMarblePosition(prev => {
      // Get container dimensions
      const containerWidth = containerRef.current?.clientWidth || 300;
      const containerHeight = containerRef.current?.clientHeight || 300;
      const marbleSize = 30; // Marble diameter in pixels
      
      // Apply movement with an increased multiplier to adjust sensitivity
      const movementMultiplier = 4;
      const newX = prev.x + movement.x * movementMultiplier;
      const newY = prev.y + movement.y * movementMultiplier;

      // Calculate the boundaries to keep the marble inside the container
      const halfMarble = marbleSize / 2;
      const maxX = containerWidth / 2 - halfMarble;
      const maxY = containerHeight / 2 - halfMarble;
      
      // Apply boundary constraints
      const boundedX = Math.max(-maxX, Math.min(maxX, newX));
      const boundedY = Math.max(-maxY, Math.min(maxY, newY));

      // Check for buy hole collision
      checkBuyHoleCollision(boundedX, boundedY);

      return { x: boundedX, y: boundedY };
    });
  };

  // Check if marble collides with a buy hole
  const checkBuyHoleCollision = (marbleX: number, marbleY: number) => {
    const now = Date.now();
    // Add a cooldown to prevent multiple purchases in quick succession
    if (now - lastBuyTime < 1000) return; 

    buyHoleRefs.current.forEach((hole, productId) => {
      if (!hole) return;
      
      const holeRect = hole.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      
      if (!containerRect) return;
      
      // Convert marble coordinates to absolute position
      const absoluteMarbleX = containerRect.left + containerRect.width / 2 + marbleX;
      const absoluteMarbleY = containerRect.top + containerRect.height / 2 + marbleY;
      
      // Check if marble is inside the buy hole
      if (
        absoluteMarbleX > holeRect.left &&
        absoluteMarbleX < holeRect.right &&
        absoluteMarbleY > holeRect.top &&
        absoluteMarbleY < holeRect.bottom
      ) {
        // Add product to cart
        const product = STORE_PRODUCTS.find(p => p.id === productId);
        if (product && !cart.some(item => item.id === productId)) {
          addToCart(product);
          setLastBuyTime(now);
          
          // Show feedback
          setBuyFeedback(`Added ${product.name} to cart!`);
          setTimeout(() => setBuyFeedback(null), 2000);
        }
      }
    });
  };

  // Add product to cart
  const addToCart = (product: StoreProduct) => {
    setCart(prev => [...prev, product]);
  };

  // Remove product from cart
  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  // Calculate total price
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price, 0).toFixed(2);
  };

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Show join screen if not yet joined
  if (!isPlaying) {
    return (
      <div className="store-view">
        <h1>Marble Store</h1>
        <div className="join-container">
          <h2>Welcome to the Marble Store</h2>
          <p>
            Roll your marble into the buy holes to add products to your cart!
            Tilt your device to control your marble.
          </p>
          
          <div className="join-form">
            <input
              type="text"
              placeholder="Your Name (optional)"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="name-input"
            />
            
            <button 
              onClick={handleJoinGame}
              className="join-button"
            >
              Enter Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show store view once active
  return (
    <div className="store-view">
      <h1>Marble Store</h1>
      
      <div className="player-info">
        <div 
          className="player-color" 
          style={{ backgroundColor: marbleColor }}
        ></div>
        <p className="player-name">
          {playerName || 'Your Marble'}
        </p>
        <div className="cart-indicator">
          🛒 {cart.length} item{cart.length !== 1 ? 's' : ''} (${getTotalPrice()})
        </div>
      </div>

      {buyFeedback && (
        <div className="buy-feedback">
          {buyFeedback}
        </div>
      )}

      <div 
        className="marble-container" 
        ref={containerRef}
      >
        <div 
          className="marble" 
          style={{
            backgroundColor: marbleColor,
            transform: `translate(${marblePosition.x}px, ${marblePosition.y}px)`
          }}
        ></div>

        {/* Product displays */}
        <div className="store-products">
          {STORE_PRODUCTS.map((product) => (
            <div 
              key={product.id}
              className="product-display"
              ref={(el) => {
                if (el) productRefs.current.set(product.id, el);
              }}
            >
              <div className="product-image">{product.image}</div>
              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-price">${product.price.toFixed(2)}</p>
                <p className="product-description">{product.description}</p>
              </div>
              <div 
                className="buy-hole"
                ref={(el) => {
                  if (el) buyHoleRefs.current.set(product.id, el);
                }}
              >
                <div className="buy-label">BUY</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shopping Cart */}
      <div className="shopping-cart">
        <h2>Your Cart</h2>
        {cart.length === 0 ? (
          <p className="empty-cart">Your cart is empty. Roll into a buy hole to add items!</p>
        ) : (
          <>
            <ul className="cart-items">
              {cart.map((item) => (
                <li key={item.id} className="cart-item">
                  <span className="cart-item-emoji">{item.image}</span>
                  <span className="cart-item-name">{item.name}</span>
                  <span className="cart-item-price">${item.price.toFixed(2)}</span>
                  <button 
                    className="remove-item"
                    onClick={() => removeFromCart(item.id)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className="cart-total">
              <strong>Total:</strong> ${getTotalPrice()}
            </div>
            <button className="checkout-button">
              Checkout
            </button>
          </>
        )}
      </div>

      <div className="controls-container">
        <OrientationControls 
          onOrientationChange={handleOrientationChange}
          debug={showDebug}
          sensitivity={0.8}
        />
      </div>

      <div className="game-info">
        <p className="status">
          Store active! Tilt your device to move.
        </p>
        
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="debug-toggle"
        >
          {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
        </button>
      </div>

      <div className="store-instructions">
        <h2>How to Shop</h2>
        <p>
          <strong>Tilt your device</strong> to control your marble.
        </p>
        <p>
          <strong>Roll into the buy holes</strong> to add products to your cart.
        </p>
        <p>
          Use the <strong>checkout button</strong> when you're ready to purchase.
        </p>
      </div>
    </div>
  );
};

export default StoreView;
