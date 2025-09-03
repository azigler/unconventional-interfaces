import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import './StoreView.css';

// Sample store items
const STORE_ITEMS = [
  {
    id: '1',
    name: 'Speed Boost',
    description: 'Increase your marble speed by 20%',
    price: 100,
    image: '/items/speed-boost.png',
    category: 'powerup'
  },
  {
    id: '2',
    name: 'Jumbo Size',
    description: 'Make your marble 50% larger',
    price: 150,
    image: '/items/jumbo-size.png',
    category: 'appearance'
  },
  {
    id: '3',
    name: 'Shrink Ray',
    description: 'Reduce your marble size by 30%',
    price: 120,
    image: '/items/shrink-ray.png',
    category: 'powerup'
  },
  {
    id: '4',
    name: 'Golden Marble',
    description: 'A luxurious golden marble skin',
    price: 300,
    image: '/items/golden-marble.png',
    category: 'appearance'
  },
  {
    id: '5',
    name: 'Bouncy Marble',
    description: 'Your marble bounces with more energy',
    price: 200,
    image: '/items/bouncy-marble.png',
    category: 'effect'
  },
  {
    id: '6',
    name: 'Rainbow Trail',
    description: 'Leave a colorful trail behind your marble',
    price: 250,
    image: '/items/rainbow-trail.png',
    category: 'effect'
  }
];

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const StoreView: React.FC = () => {
  const navigate = useNavigate();
  const { currentPlayer } = useGame();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Filter items by category
  const filteredItems = activeCategory === 'all' 
    ? STORE_ITEMS 
    : STORE_ITEMS.filter(item => item.category === activeCategory);
  
  // Add item to cart
  const addToCart = (itemId: string) => {
    const item = STORE_ITEMS.find(item => item.id === itemId);
    if (!item) return;
    
    setCart(prevCart => {
      // Check if item is already in cart
      const existingItem = prevCart.find(cartItem => cartItem.id === itemId);
      
      if (existingItem) {
        // Increment quantity
        return prevCart.map(cartItem => 
          cartItem.id === itemId 
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
  
  return (
    <div className="store-view">
      <header className="store-header">
        <h1>Marble Store</h1>
        
        <div className="player-info">
          {currentPlayer && (
            <>
              <div 
                className="player-color" 
                style={{ backgroundColor: currentPlayer.color }}
              ></div>
              <span className="player-name">{currentPlayer.name}</span>
            </>
          )}
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
          <div className="category-filter">
            <h2>Categories</h2>
            <ul className="category-list">
              <li 
                className={activeCategory === 'all' ? 'active' : ''}
                onClick={() => setActiveCategory('all')}
              >
                All Items
              </li>
              <li 
                className={activeCategory === 'powerup' ? 'active' : ''}
                onClick={() => setActiveCategory('powerup')}
              >
                Power Ups
              </li>
              <li 
                className={activeCategory === 'appearance' ? 'active' : ''}
                onClick={() => setActiveCategory('appearance')}
              >
                Appearance
              </li>
              <li 
                className={activeCategory === 'effect' ? 'active' : ''}
                onClick={() => setActiveCategory('effect')}
              >
                Effects
              </li>
            </ul>
          </div>
          
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
        </aside>
        
        <div className="store-items">
          <h2>{activeCategory === 'all' ? 'All Items' : `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}s`}</h2>
          
          <div className="items-grid">
            {filteredItems.map(item => (
              <div key={item.id} className="item-card">
                <div className="item-image">
                  {/* Use a placeholder div for now */}
                  <div className="image-placeholder">{item.name.charAt(0)}</div>
                </div>
                <div className="item-details">
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <div className="item-price-row">
                    <span className="item-price">${item.price}</span>
                    <button 
                      onClick={() => addToCart(item.id)}
                      className="add-to-cart-button"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StoreView;
