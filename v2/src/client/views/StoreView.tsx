import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { StoreItem, CartItem as CartItemType } from '@shared/types/game';
import MarbleStoreWorld from '../components/MarbleStoreWorld/MarbleStoreWorld';
import OrientationControls from '../components/Controls/OrientationControls';
import './StoreView.css';

const StoreView: React.FC = () => {
  const navigate = useNavigate();
  const { currentPlayer, gameState } = useGame();
  
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [orientationData, setOrientationData] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [showDebug, setShowDebug] = useState<boolean>(false);
  
  // Redirect to home if not in active game
  useEffect(() => {
    if (gameState !== 'active' || !currentPlayer) {
      navigate('/');
    }
  }, [gameState, currentPlayer, navigate]);
  
  // Handle orientation changes from the controls
  const handleOrientationChange = (movement: { x: number, y: number }) => {
    if (!currentPlayer) return;
    
    // Store orientation data for the physics simulation
    setOrientationData(movement);
    
    // Debug output for orientation data
    if (showDebug) {
      console.log('Orientation data:', movement);
    }
  };
  
  // Add item to cart
  const addToCart = (item: StoreItem) => {
    // Play a sound effect
    const addSound = new Audio('/sounds/add-to-cart.mp3');
    addSound.volume = 0.5;
    addSound.play().catch(e => console.log('Sound play error:', e));
    
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
  };
  
  // Remove item from cart
  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };
  
  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Handle checkout
  const handleCheckout = () => {
    // Here you would integrate with the backend to process the purchase
    alert(`Purchase complete! Total: $${cartTotal}`);
    setCart([]);
  };
  
  // Handle back to game
  const handleBackToGame = () => {
    navigate('/local');
  };
  
  // Loading state
  if (!currentPlayer) {
    return (
      <div className="store-view">
        <div className="loading-screen">
          <h2>Loading Store...</h2>
        </div>
      </div>
    );
  }
  
  return (
    <div className="store-view">
      <header className="store-header">
        <h1>Marble Store</h1>
        
        <div className="player-info">
          <div 
            className="player-color" 
            style={{ backgroundColor: currentPlayer.color }}
          ></div>
          <span className="player-name">{currentPlayer.name}</span>
          <button 
            onClick={handleBackToGame}
            className="back-button"
          >
            Back to Game
          </button>
        </div>
      </header>
      
      <main className="store-main">
        <aside className="store-sidebar">
          <div className="cart-section">
            <h2>Your Cart</h2>
            
            {cart.length === 0 ? (
              <p className="empty-cart">Your cart is empty</p>
            ) : (
              <>
                <ul className="cart-items">
                  {cart.map(item => (
                    <li key={item.id} className="cart-item">
                      <div className="cart-item-details">
                        <span className="cart-item-name">{item.name}</span>
                        <span className="cart-item-price">${item.price}</span>
                        <span className="cart-item-quantity">×{item.quantity}</span>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="remove-button"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
                
                <div className="cart-total">
                  <span>Total:</span>
                  <span>${cartTotal}</span>
                </div>
                
                <button 
                  onClick={handleCheckout}
                  className="checkout-button"
                >
                  Checkout
                </button>
              </>
            )}
          </div>
          
          <div className="controls-container">
            <OrientationControls 
              onOrientationChange={handleOrientationChange}
              debug={showDebug}
              sensitivity={0.4} 
            />
            
            <div className="debug-toggle-container">
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="debug-toggle"
              >
                {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
              </button>
            </div>
          </div>
        </aside>
        
        <div className="store-world-container">
          {currentPlayer && (
            <MarbleStoreWorld
              width={window.innerWidth - 300} // Adjust for sidebar width
              height={window.innerHeight - 60} // Adjust for header height
              orientationData={orientationData}
              onAddToCart={addToCart}
            />
          )}
          <div className="store-instructions">
            <p>Roll your marble over the BUY buttons to add items to your cart!</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StoreView;
