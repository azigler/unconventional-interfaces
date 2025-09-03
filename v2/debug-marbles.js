// Debug script to trace marble physics and server updates
console.log('=== MARBLE PHYSICS DEBUG ===');

// Set these to true to enable different debugging aspects
const DEBUG_CONFIG = {
  orientation: true,       // Log orientation data from device sensors
  physics: true,           // Log physics simulation data
  serverUpdates: true,     // Log updates sent to the server
  velocityChanges: true,   // Log changes to velocity
  positionDelta: true      // Log changes in position
};

// Function to inject into OrientationControls component
function debugOrientationData(data) {
  if (!DEBUG_CONFIG.orientation) return;
  console.log('Orientation input:', {
    x: data.x.toFixed(4),
    y: data.y.toFixed(4)
  });
}

// Function to inject into Matter.js physics update
function debugPhysicsUpdate(body) {
  if (!DEBUG_CONFIG.physics) return;
  console.log('Physics body:', {
    position: {
      x: body.position.x.toFixed(2),
      y: body.position.y.toFixed(2)
    },
    velocity: {
      x: body.velocity.x.toFixed(2),
      y: body.velocity.y.toFixed(2)
    },
    angle: body.angle.toFixed(2),
    speed: Math.sqrt(
      body.velocity.x * body.velocity.x + 
      body.velocity.y * body.velocity.y
    ).toFixed(2)
  });
}

// Function to inject before server updates
function debugServerUpdate(x, y, vx, vy) {
  if (!DEBUG_CONFIG.serverUpdates) return;
  console.log('Server update:', {
    position: { x: x.toFixed(2), y: y.toFixed(2) },
    velocity: { vx: vx.toFixed(2), vy: vy.toFixed(2) }
  });
}

// Function to inject for velocity changes
function debugVelocityChange(oldVel, newVel) {
  if (!DEBUG_CONFIG.velocityChanges) return;
  console.log('Velocity change:', {
    from: { 
      x: oldVel.x.toFixed(2), 
      y: oldVel.y.toFixed(2),
      magnitude: Math.sqrt(oldVel.x * oldVel.x + oldVel.y * oldVel.y).toFixed(2)
    },
    to: { 
      x: newVel.x.toFixed(2), 
      y: newVel.y.toFixed(2),
      magnitude: Math.sqrt(newVel.x * newVel.x + newVel.y * newVel.y).toFixed(2)
    }
  });
}

// Function to debug position deltas
function debugPositionDelta(oldPos, newPos) {
  if (!DEBUG_CONFIG.positionDelta) return;
  const dx = newPos.x - oldPos.x;
  const dy = newPos.y - oldPos.y;
  console.log('Position delta:', {
    dx: dx.toFixed(2),
    dy: dy.toFixed(2),
    distance: Math.sqrt(dx * dx + dy * dy).toFixed(2)
  });
}

// Export debugging functions for use in other modules
window.MarbleDebug = {
  debugOrientationData,
  debugPhysicsUpdate,
  debugServerUpdate,
  debugVelocityChange,
  debugPositionDelta,
  
  // Utility to start/stop debugging
  enable: (option) => {
    if (option) {
      DEBUG_CONFIG[option] = true;
      console.log(`Enabled debugging for: ${option}`);
    } else {
      Object.keys(DEBUG_CONFIG).forEach(key => {
        DEBUG_CONFIG[key] = true;
      });
      console.log('Enabled all debugging');
    }
  },
  
  disable: (option) => {
    if (option) {
      DEBUG_CONFIG[option] = false;
      console.log(`Disabled debugging for: ${option}`);
    } else {
      Object.keys(DEBUG_CONFIG).forEach(key => {
        DEBUG_CONFIG[key] = false;
      });
      console.log('Disabled all debugging');
    }
  }
};

console.log('Debug functions attached to window.MarbleDebug');
