import React, { useRef } from 'react';
import './MarbleWorld.css';

interface Marble {
  id: string;
  x: number;
  y: number;
  color: string;
  name?: string;
  cart?: Array<{ id: string; name: string; quantity: number }>;
}

interface MarbleWorldProps {
  marbles: Marble[];
}

const MarbleWorld: React.FC<MarbleWorldProps> = ({ marbles }) => {
  const worldRef = useRef<HTMLDivElement>(null);
  
  return (
    <div className="marble-world" ref={worldRef}>
      {marbles.map(marble => (
        <div
          key={marble.id}
          className="marble"
          style={{
            transform: `translate(${marble.x}px, ${marble.y}px)`,
            backgroundColor: marble.color,
          }}
          data-id={marble.id}
        >
          {marble.name && (
            <div className="marble-info">
              <div className="marble-name">{marble.name}</div>
              {marble.cart && marble.cart.length > 0 && (
                <div className="marble-cart-count">{marble.cart.length}</div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MarbleWorld;
