import React, { useState, useEffect, useRef } from 'react';
import './MarbleWorld.css';

interface Marble {
  id: string;
  x: number;
  y: number;
  color: string;
  name?: string;
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
          {marble.name && <div className="marble-name">{marble.name}</div>}
        </div>
      ))}
    </div>
  );
};

export default MarbleWorld;
