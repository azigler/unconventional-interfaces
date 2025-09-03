# Game State Management

This module provides functionality to manage game state in Firestore, including:

- Creating and removing items with random locations
- Adding players with location and cart information
- Real-time updates from Firestore to display current game state
- Support for multiple game rooms with configurable room IDs
- Room selection dropdown with room names for easier navigation

## Firestore Structure

The game state is stored in Firestore at `game_rooms/[GAME_ROOM_ID]/` with the following collections:

### Items Collection
Each item document contains:
- `image`: URL to the item image
- `location`: Object with `x` and `y` coordinates
- `createdAt`: Timestamp when the item was created

### Players Collection
Each player document contains:
- `label`: Player name/identifier
- `location`: Object with `x` and `y` coordinates
- `cart`: Array of item IDs that the player has collected
- `createdAt`: Timestamp when the player was created

## Key Functions

### Game Room Management
- `setGameRoomId(roomId)`: Sets the active game room ID, updating all Firestore paths
- `getCurrentGameRoomId()`: Returns the current game room ID
- `fetchGameRooms()`: Fetches all available game rooms and populates the room selector dropdown

### Game Initialization and Control
- `initializeGame()`: Adds random items to the game, one per second, then removes them after 10 seconds
- `runGame()`: Runs a 30-second game with specific timing for adding and removing items
- `clearGameItems()`: Removes all items from the current game room
- `clearAllPlayerCarts()`: Empties all players' carts in the current game room

### Item Management
- `addItemToGameState(itemId, itemData)`: Adds an item to the game with a random location
- `removeItemFromGameState(itemId)`: Removes an item from the game
- `getItemsFromCollection()`: Retrieves all available items from the main collection

### Player Management
- `addPlayer(name, locationString)`: Adds a new player with the specified name and location
- `updatePlayerLocation(playerId, x, y, vx, vy)`: Updates a player's position and velocity
- `addItemToPlayerCart(playerId, itemId)`: Adds an item to a player's cart

### Scoring
- `getScore()`: Calculates scores for all players based on items in their carts

### Real-time State
- `subscribeToGameItems(callback)`: Sets up real-time listener for game items
- `subscribeToPlayers(callback)`: Sets up real-time listener for players

## Setup

1. Update the Firebase configuration in `gameState.js` with your project's details.
2. Update the item images array with actual image URLs.
3. Open `index.html` in a browser to test the functionality.

## Integration with Frontend

To integrate this module with your main application:

1. Import the `gameState.js` file in your application.
2. Use `fetchGameRooms()` to populate your room selection UI, or directly set the game room ID with `setGameRoomId()`.
3. Use the exported functions to initialize the game and subscribe to state changes.
4. Use the real-time data to update your game UI.

Example:
```javascript
// Import the GameState object
const GameState = window.GameState;

// Option 1: Fetch and display available rooms
await GameState.fetchGameRooms();
// Then user selects a room from your UI...

// Option 2: Directly set the game room ID
GameState.setGameRoomId("your-custom-room-id");

// Run a timed game
GameState.runGame();

// Subscribe to state changes (these will use the room ID you set above)
const unsubscribeItems = GameState.subscribeToGameItems(items => {
    // Update your UI with the items data
    console.log(`Received ${items.length} items from Firestore`);
});

const unsubscribePlayers = GameState.subscribeToPlayers(players => {
    // Update your UI with the players data
    console.log(`Received ${players.length} players from Firestore`);
});

// Remember to unsubscribe when done
function cleanup() {
    if (unsubscribeItems) unsubscribeItems();
    if (unsubscribePlayers) unsubscribePlayers();
}

// Add a player
GameState.addPlayer("Player 1", "50,50");

// Calculate scores at the end
async function endGame() {
    const scores = await GameState.getScore();
    console.log("Final scores:", scores);
}
```
