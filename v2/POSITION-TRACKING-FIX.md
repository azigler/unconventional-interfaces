# Position Tracking Fix

## Problem Description

The marbles in the marble store world were not being properly tracked in Firestore. The position values (x, y, vx, vy) were all remaining at 0 because:

1. The MarbleStoreWorld component was tracking positions locally but wasn't updating them in Firestore
2. This caused issues with multiplayer functionality since other players couldn't see the marbles moving
3. The position update mechanism was missing a call to `updatePlayerPosition` in the GameContext

## Solution

Fixed the issue by:

1. Extracting the `updatePlayerPosition` function from the GameContext
2. Adding calls to update the Firestore database with the current marble position:

```javascript
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
```

## Benefits

- Marbles now properly synchronize their positions across all clients
- Multiplayer functionality works correctly
- Position data is properly stored in Firestore
- Player movements are visible to all players in the same room

## Testing

To verify the fix:
1. Join a game room with multiple players
2. Verify that all marble positions are correctly synchronized
3. Check that marble movements are smooth and accurately reflected across clients
