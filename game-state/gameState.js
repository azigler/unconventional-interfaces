// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDszn6_HRgIWrO3VL17P_AJHbIlHxQcmiY",
    authDomain: "codetv-andrew-billy.firebaseapp.com",
    projectId: "codetv-andrew-billy",
    storageBucket: "codetv-andrew-billy.appspot.com",
    messagingSenderId: "639073768296",
    appId: "1:639073768296:web:a74e9a7e9e7aa0a7bb2a93"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Default game room ID
let GAME_ROOM_ID = "0892e800-a763-44e3-835d-19b580ef9e4a"; // The default game room ID
let GAME_STATE_PATH = `game_rooms/${GAME_ROOM_ID}`;
const ITEMS_COLLECTION = "items"; // Root items collection
let GAME_ITEMS_COLLECTION = `${GAME_STATE_PATH}/items`; // Items in the game
let PLAYERS_COLLECTION = `${GAME_STATE_PATH}/players`; // Players in the game

// Function to set a new game room ID
function setGameRoomId(roomId) {
    if (!roomId) {
        console.error("Invalid room ID provided");
        return false;
    }
    
    GAME_ROOM_ID = roomId;
    GAME_STATE_PATH = `game_rooms/${GAME_ROOM_ID}`;
    GAME_ITEMS_COLLECTION = `${GAME_STATE_PATH}/items`;
    PLAYERS_COLLECTION = `${GAME_STATE_PATH}/players`;
    
    console.log(`Game room ID set to: ${GAME_ROOM_ID}`);
    console.log(`Game state path: ${GAME_STATE_PATH}`);
    
    // Update the room ID display in the UI if element exists
    const roomIdDisplay = document.getElementById('roomIdDisplay');
    if (roomIdDisplay) {
        roomIdDisplay.textContent = GAME_ROOM_ID.substring(0, 8) + '...';
        roomIdDisplay.title = GAME_ROOM_ID;
    }
    
    return true;
}

// DOM Elements
const initGameBtn = document.getElementById('initGame');
const clearItemsBtn = document.getElementById('clearItems');
const showAllItemsBtn = document.getElementById('showAllItems');
const itemsList = document.getElementById('itemsList');
const playersList = document.getElementById('playersList');
const addPlayerBtn = document.getElementById('addPlayer');
const playerLabelInput = document.getElementById('playerLabel');
const playerLocationInput = document.getElementById('playerLocation');

// Generate a random location within bounds
function getRandomLocation() {
    const x = Math.floor(Math.random() * 100);
    const y = Math.floor(Math.random() * 100);
    return { x, y };
}

// Get all items from the main collection
async function getItemsFromCollection() {
    try {
        const snapshot = await db.collection(ITEMS_COLLECTION).get();
        const items = [];
        
        snapshot.forEach(doc => {
            // Get the document data
            const data = doc.data();
            
            // Remove any 'id' field from the data to prevent overwriting the Firestore document ID
            const { id: _ignoredId, ...cleanData } = data;
            
            // Create the final item with the correct document ID
            items.push({
                id: doc.id,
                ...cleanData
            });
        });
        
        return items;
    } catch (error) {
        console.error("Error getting items from collection: ", error);
        return [];
    }
}

// Add an item to the game state with a random location
async function addItemToGameState(itemData) {
    try {
        // Generate random x and y coordinates
        const { x, y } = getRandomLocation();
        
        // Extract the original item ID
        const originalItemId = itemData.id;
        
        // Remove the id property from the data to avoid duplication
        const { id: _ignoredId, ...cleanData } = itemData;
        
        // Create a new document in the game state items collection with THE SAME ID as the original item
        // Using direct x,y coordinates instead of a location object
        await db.collection(GAME_ITEMS_COLLECTION).doc(originalItemId).set({
            ...cleanData,
            x: x,
            y: y,
            addedToGame: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`Item added to game state with ID ${originalItemId} at location: (${x}, ${y})`);
        return originalItemId;
    } catch (error) {
        console.error(`Error adding item to game state:`, error);
        return null;
    }
}

// Remove an item from the game state
async function removeItemFromGameState(itemId) {
    try {
        await db.collection(GAME_ITEMS_COLLECTION).doc(itemId).delete();
        console.log("Item removed from game state: ", itemId);
    } catch (error) {
        console.error("Error removing item from game state: ", error);
    }
}

// Initialize the game with random items from the collection (legacy function)
async function initializeGame() {
    try {
        // Clear any existing items first from the game state
        await clearGameItems();
        
        // Get items from the main collection
        const items = await getItemsFromCollection();
        
        if (items.length === 0) {
            console.log("No items found in the collection");
            return;
        }
        
        console.log(`Found ${items.length} items in the collection`);
        
        // Randomly select 5 items (or less if there are fewer items)
        const selectedItems = [];
        const itemCount = Math.min(5, items.length);
        const usedIndices = new Set();
        
        // Select random items without repetition
        while (selectedItems.length < itemCount) {
            const randomIndex = Math.floor(Math.random() * items.length);
            
            if (!usedIndices.has(randomIndex)) {
                usedIndices.add(randomIndex);
                selectedItems.push(items[randomIndex]);
            }
        }
        
        // Add selected items to the game state one by one
        const gameItemIds = [];
        
        for (const item of selectedItems) {
            // Add item to game state
            const id = await addItemToGameState(item);
            if (id) gameItemIds.push(id);
            
            // Wait for 1 second before adding the next item
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log(`Added ${gameItemIds.length} items to the game state`);
        
        // After 10 seconds, remove each item with a 1-second delay between removals
        setTimeout(async () => {
            console.log("Starting removal of game items");
            for (const id of gameItemIds) {
                await removeItemFromGameState(id);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            console.log("All game items removed");
        }, 10000);
        
        return gameItemIds;
    } catch (error) {
        console.error("Error initializing game:", error);
        return [];
    }
}

// Function to clear all items from all players' carts
async function clearAllPlayerCarts() {
    try {
        // Get all players
        const snapshot = await db.collection(PLAYERS_COLLECTION).get();
        
        if (snapshot.empty) {
            console.log("No players found to clear carts");
            return;
        }
        
        // Create a batch to update all players
        const batch = db.batch();
        
        // Update each player to have an empty cart
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, {
                cart: [],
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        
        // Commit the batch update
        await batch.commit();
        console.log(`Cleared carts for ${snapshot.size} players`);
    } catch (error) {
        console.error("Error clearing player carts:", error);
    }
}

// Run a game with specific timing rules:
// - Start with 3 random items
// - Add a new item every 3 seconds
// - Each item lasts 3-6 seconds
// - Game ends after 30 seconds
async function runGame() {
    try {
        console.log("Starting new game...");
        
        // Clear any existing items
        await clearGameItems();
        console.log("Cleared existing items");
        
        // Clear all players' carts
        await clearAllPlayerCarts();
        console.log("Cleared all players' carts");
        
        // Get items from the main collection
        const allItems = await getItemsFromCollection();
        
        if (allItems.length === 0) {
            console.error("No items found in the collection - cannot start game");
            return;
        }
        
        console.log(`Found ${allItems.length} available items in the collection`);
        
        // Track active items and intervals
        const activeItems = new Map(); // Map of itemId -> removal timeout
        let gameInterval = null;
        let gameOver = false;
        
        // Function to get a random item from the collection
        const getRandomItem = () => {
            const randomIndex = Math.floor(Math.random() * allItems.length);
            return allItems[randomIndex];
        };
        
        // Function to add a random item to the game
        const addRandomItem = async () => {
            if (gameOver) return;
            
            const item = getRandomItem();
            
            // Add item to the game state
            const itemId = await addItemToGameState(item);
            
            if (itemId) {
                console.log(`Added item ${itemId} (${item.name || 'unnamed'})`);
                
                // Calculate a random duration between 3-6 seconds
                const duration = Math.floor(Math.random() * 3000) + 3000; // 3000-6000ms
                
                // Set a timeout to remove this item after the random duration
                const removalTimeout = setTimeout(async () => {
                    if (gameOver) return;
                    
                    await removeItemFromGameState(itemId);
                    console.log(`Removed item ${itemId} after ${duration/1000} seconds`);
                    activeItems.delete(itemId);
                }, duration);
                
                // Store the timeout reference so we can clear it if needed
                activeItems.set(itemId, removalTimeout);
            }
        };
        
        // Start with 3 initial items
        console.log("Adding 3 initial items...");
        for (let i = 0; i < 3; i++) {
            await addRandomItem();
            // Small delay between adding initial items
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Set up interval to add new items every 3 seconds
        gameInterval = setInterval(addRandomItem, 3000);
        
        // End the game after 30 seconds
        setTimeout(async () => {
            // Stop adding new items
            clearInterval(gameInterval);
            
            // Clear all active item removal timeouts
            for (const timeout of activeItems.values()) {
                clearTimeout(timeout);
            }
            
            // Mark game as over
            gameOver = true;
            
            // Remove all remaining items
            clearGameItems();
            
            console.log("GAME OVER");
            
            // Wait a moment to ensure all database operations are complete
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Calculate and display final scores
            displayScores();
        }, 30000);
        
        return "Game started successfully";
    } catch (error) {
        console.error("Error running game:", error);
        return "Error starting game";
    }
}

// Clear all items from the game state
async function clearGameItems() {
    try {
        const snapshot = await db.collection(GAME_ITEMS_COLLECTION).get();
        const batch = db.batch();
        
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log("All items cleared from game state");
    } catch (error) {
        console.error("Error clearing items from game state: ", error);
    }
}

// Add a player to the game
async function addPlayer(name, locationString) {
    try {
        // Parse location from string "x,y" to separate x and y values
        let x = 0, y = 0;
        if (locationString && locationString.includes(',')) {
            const parts = locationString.split(',').map(val => parseFloat(val.trim()));
            x = parts[0];
            y = parts[1];
        }
        
        // Generate a random color in hex format
        const randomColor = "#" + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        
        const player = {
            name: name || `Player ${Math.floor(Math.random() * 1000)}`,
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            cart: [],
            color: randomColor,
            connected: true,
            roomId: GAME_ROOM_ID, // Set to the current game room ID
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection(PLAYERS_COLLECTION).add(player);
        console.log("Player added with ID: ", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error adding player: ", error);
        return null;
    }
}

// Update player location
async function updatePlayerLocation(playerId, x, y, vx = 0, vy = 0) {
    try {
        await db.collection(PLAYERS_COLLECTION).doc(playerId).update({
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("Player location updated: ", playerId);
        return true;
    } catch (error) {
        console.error("Error updating player location: ", error);
        return false;
    }
}

// Add item to player's cart
async function addItemToPlayerCart(playerId, itemId) {
    try {
        await db.collection(PLAYERS_COLLECTION).doc(playerId).update({
            cart: firebase.firestore.FieldValue.arrayUnion(itemId),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Item ${itemId} added to player ${playerId}'s cart`);
        return true;
    } catch (error) {
        console.error("Error adding item to player's cart: ", error);
        return false;
    }
}

// Calculate scores for all players based on the prices of items in their carts
async function getScore() {
    try {
        // Get all players
        const playersSnapshot = await db.collection(PLAYERS_COLLECTION).get();
        
        if (playersSnapshot.empty) {
            console.log("No players found to calculate scores");
            return {};
        }
        
        // Get all items from the main collection to reference prices
        const itemsSnapshot = await db.collection(ITEMS_COLLECTION).get();
        
        // Create a map of item IDs to prices for quick lookup
        const itemPriceMap = new Map();
        itemsSnapshot.forEach(doc => {
            const item = doc.data();
            // Store the price, defaulting to 0 if no price is found
            itemPriceMap.set(doc.id, item.price || 0);
            console.log(`Item ${doc.id} price: $${item.price || 0}`);
        });
        
        // Calculate score for each player
        const scores = {};
        
        for (const playerDoc of playersSnapshot.docs) {
            console.log(`Calculating score for player: ${playerDoc.data().name || 'Unknown'}`);
            const player = playerDoc.data();
            const cart = player.cart || [];
            let totalPrice = 0;
            console.log(cart)
            // Calculate total price of items in cart
            for (const itemId of cart) {
                console.log(`Item ${itemId}`);
                const price = itemPriceMap.get(itemId) || 0;
                totalPrice += price;
            }
            
            // Store the player's name and score
            scores[playerDoc.id] = {
                name: player.name || 'Unknown',
                cartSize: cart.length,
                totalPrice: totalPrice,
                items: cart
            };
            
            console.log(`Player ${player.name || 'Unknown'} (${playerDoc.id}): ${cart.length} items, total $${totalPrice.toFixed(2)}`);
        }
        
        return scores;
    } catch (error) {
        console.error("Error calculating scores:", error);
        return {};
    }
}


// Subscribe to real-time updates for items in the game state
function subscribeToGameItems(callback) {
    return db.collection(GAME_ITEMS_COLLECTION)
        .onSnapshot(snapshot => {
            const items = [];
            snapshot.forEach(doc => {
                // Get the document data
                const data = doc.data();
                
                // Create a new item object
                // Remove any 'id' field from the data to prevent overwriting the Firestore document ID
                const { id: _ignoredId, ...cleanData } = data;
                
                // Create the final item with the correct document ID
                items.push({
                    id: doc.id,
                    ...cleanData
                });
            });
            callback(items);
        }, error => {
            console.error("Error getting game items: ", error);
            callback([]);
        });
}

// Subscribe to real-time updates for players
function subscribeToPlayers(callback) {
    return db.collection(PLAYERS_COLLECTION)
        .onSnapshot(snapshot => {
            const players = [];
            snapshot.forEach(doc => {
                // Get the document data
                const data = doc.data();
                
                // Create a new player object
                // Remove any 'id' field from the data to prevent overwriting the Firestore document ID
                const { id: _ignoredId, ...cleanData } = data;
                
                // Create the final player with the correct document ID
                players.push({
                    id: doc.id,
                    ...cleanData
                });
            });
            callback(players);
        }, error => {
            console.error("Error getting players: ", error);
            callback([]);
        });
}

// Display items in the UI
function displayItems(items) {
    itemsList.innerHTML = '';
    
    if (items.length === 0) {
        itemsList.innerHTML = '<p>No items in the game</p>';
        return;
    }
    
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item-card';
        
        // Handle both direct x,y coordinates and location object
        let x = 0, y = 0;
        if (item.location) {
            x = item.location.x || 0;
            y = item.location.y || 0;
        } else {
            x = item.x || 0;
            y = item.y || 0;
        }
        
        // Determine image source
        let imageUrl = item.image;
        if (item.image_url) {
            imageUrl = item.image_url;
        }
        
        // Create item details HTML
        const itemDetailsHTML = `
            <div style="margin-left: 15px;">
                <strong>Item ID:</strong> ${item.id}<br>
                ${item.name ? `<strong>Name:</strong> ${item.name}<br>` : ''}
                ${item.description ? `<strong>Description:</strong> ${item.description}<br>` : ''}
                ${item.price ? `<strong>Price:</strong> $${item.price}<br>` : ''}
                ${item.category ? `<strong>Category:</strong> ${item.category}<br>` : ''}
                <strong>Location:</strong> (${x.toFixed(2)}, ${y.toFixed(2)})
            </div>
        `;
        
        // Add image to the item element
        if (imageUrl) {
            const imgElement = document.createElement('img');
            imgElement.src = imageUrl;
            imgElement.alt = item.name || 'Item Image';
            imgElement.style.width = '100px';
            imgElement.style.height = '100px';
            imgElement.style.objectFit = 'contain';
            imgElement.style.border = '1px solid #ddd';
            imgElement.style.borderRadius = '5px';
            
            // Add image and details to the item element
            itemElement.appendChild(imgElement);
            itemElement.innerHTML += itemDetailsHTML;
        } else {
            // If no image, just add the details
            itemElement.innerHTML = `
                <div style="width: 100px; height: 100px; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center; border: 1px solid #ddd; border-radius: 5px;">
                    No Image
                </div>
                ${itemDetailsHTML}
            `;
        }
        
        itemsList.appendChild(itemElement);
    });
}

// Display players in the UI
function displayPlayers(players) {
    playersList.innerHTML = '';
    
    if (players.length === 0) {
        playersList.innerHTML = '<p>No players in the game</p>';
        return;
    }
    
    players.forEach(player => {
        const playerElement = document.createElement('div');
        playerElement.className = 'player-card';
        
        const cart = player.cart || [];
        
        // Use the player's color if available, or generate a random one
        const playerColor = player.color || `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
        
        playerElement.innerHTML = `
            <div style="display: flex; align-items: center;">
                <div style="width: 50px; height: 50px; border-radius: 50%; background-color: ${playerColor}; display: flex; align-items: center; justify-content: center; margin-right: 15px; color: white; font-weight: bold;">
                    ${(player.name || 'P').charAt(0).toUpperCase()}
                </div>
                <div>
                    <strong>Player ID:</strong> ${player.id}<br>
                    <strong>Name:</strong> ${player.name || 'Unknown'}<br>
                    <strong>Position:</strong> (${player.x.toFixed(2)}, ${player.y.toFixed(2)})<br>
                    <strong>Velocity:</strong> (${player.vx.toFixed(2)}, ${player.vy.toFixed(2)})<br>
                    <strong>Connected:</strong> ${player.connected ? 'Yes' : 'No'}<br>
                    <strong>Cart:</strong> ${cart.length > 0 ? cart.join(', ') : 'Empty'}<br>
                    <strong>Last Updated:</strong> ${player.lastUpdated ? new Date(player.lastUpdated.toDate()).toLocaleString() : 'Unknown'}
                    ${player.roomId ? `<br><strong>Room ID:</strong> ${player.roomId}` : ''}
                </div>
            </div>
        `;
        
        playersList.appendChild(playerElement);
    });
}

// Function to display all items in a modal
async function showAllItems() {
    try {
        // Get the modal element
        const modal = document.getElementById('itemsModal');
        const modalItemsList = document.getElementById('modalItemsList');
        const closeButton = document.querySelector('.close-button');
        
        // Clear previous items
        modalItemsList.innerHTML = '';
        
        // Show loading indicator
        modalItemsList.innerHTML = '<p>Loading items...</p>';
        
        // Get all items from the collection
        const items = await getItemsFromCollection();
        
        // Clear loading indicator
        modalItemsList.innerHTML = '';
        
        if (items.length === 0) {
            modalItemsList.innerHTML = '<p>No items found in the collection</p>';
        } else {
            // Add each item to the modal
            items.forEach(item => {
                const itemCard = document.createElement('div');
                itemCard.className = 'item-card';
                
                // Determine image source
                let imageUrl = item.image;
                if (item.image_url) {
                    imageUrl = item.image_url;
                }
                
                // Create card content
                let cardContent = '';
                
                if (imageUrl) {
                    cardContent += `
                        <div style="text-align: center; margin-bottom: 10px;">
                            <img src="${imageUrl}" alt="${item.name || 'Item Image'}" 
                                style="width: 120px; height: 120px; object-fit: contain; border: 1px solid #ddd; border-radius: 5px;">
                        </div>
                    `;
                } else {
                    cardContent += `
                        <div style="width: 120px; height: 120px; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center; border: 1px solid #ddd; border-radius: 5px; margin: 0 auto 10px auto;">
                            No Image
                        </div>
                    `;
                }
                
                cardContent += `
                    <div>
                        ${item.name ? `<strong>${item.name}</strong><br>` : ''}
                        ${item.description ? `<p>${item.description}</p>` : ''}
                        ${item.price ? `<p><strong>Price:</strong> $${item.price}</p>` : ''}
                        ${item.category ? `<p><strong>Category:</strong> ${item.category}</p>` : ''}
                        <p><small><strong>ID:</strong> ${item.id}</small></p>
                    </div>
                `;
                
                itemCard.innerHTML = cardContent;
                
                // Add a button to add this item to the game
                const addButton = document.createElement('button');
                addButton.textContent = 'Add to Game';
                addButton.style.width = '100%';
                addButton.style.marginTop = '10px';
                addButton.addEventListener('click', async () => {
                    // Add item to game state
                    await addItemToGameState(item);
                    
                    // Show confirmation
                    const confirmation = document.createElement('div');
                    confirmation.textContent = 'Added to game!';
                    confirmation.style.color = 'green';
                    confirmation.style.textAlign = 'center';
                    confirmation.style.marginTop = '5px';
                    
                    addButton.disabled = true;
                    addButton.textContent = 'Added';
                    
                    // Replace the button with confirmation
                    addButton.parentNode.appendChild(confirmation);
                    
                    // Hide confirmation after 2 seconds
                    setTimeout(() => {
                        confirmation.style.display = 'none';
                        addButton.disabled = false;
                        addButton.textContent = 'Add to Game';
                    }, 2000);
                });
                
                itemCard.appendChild(addButton);
                modalItemsList.appendChild(itemCard);
            });
        }
        
        // Show the modal
        modal.style.display = 'block';
        
        // Close the modal when clicking the close button
        closeButton.onclick = () => {
            modal.style.display = 'none';
        };
        
        // Close the modal when clicking outside the content
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    } catch (error) {
        console.error('Error showing all items:', error);
    }
}

// Event Listeners
const runGameBtn = document.getElementById('runGame');
runGameBtn.addEventListener('click', async () => {
    runGameBtn.disabled = true;
    runGameBtn.textContent = 'Game Running...';
    
    try {
        await runGame();
        
        // Re-enable the button after the game is over (30 seconds)
        setTimeout(() => {
            runGameBtn.disabled = false;
            runGameBtn.textContent = 'Run Game (30 seconds)';
        }, 31000); // 31 seconds to ensure game is completely over
    } catch (error) {
        console.error("Error running game:", error);
        runGameBtn.disabled = false;
        runGameBtn.textContent = 'Run Game (30 seconds)';
    }
});

// Function to display player scores in a modal
async function displayScores() {
    try {
        // Get the modal and scores list elements
        const modal = document.getElementById('scoresModal');
        const scoresList = document.getElementById('scoresList');
        const closeButton = modal.querySelector('.close-button');
        
        // Clear previous scores
        scoresList.innerHTML = '<p>Calculating scores...</p>';
        
        // Show the modal
        modal.style.display = 'block';
        
        // Calculate scores
        const scores = await getScore();
        
        // Check if we have any scores
        if (Object.keys(scores).length === 0) {
            scoresList.innerHTML = '<p>No player scores available</p>';
            return;
        }
        
        // Sort players by total price (highest first)
        const sortedPlayers = Object.entries(scores).sort((a, b) => b[1].totalPrice - a[1].totalPrice);
        
        // Clear loading message
        scoresList.innerHTML = '';
        
        // Create a table for the scores
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.marginTop = '20px';
        
        // Add table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr style="background-color: #f2f2f2;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Rank</th>
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Player</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Items</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Add table body
        const tbody = document.createElement('tbody');
        
        // Add a row for each player
        sortedPlayers.forEach(([playerId, playerScore], index) => {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid #ddd';
            
            // Highlight the winner
            if (index === 0 && playerScore.totalPrice > 0) {
                row.style.backgroundColor = '#f8f8d8';
                row.style.fontWeight = 'bold';
            }
            
            row.innerHTML = `
                <td style="padding: 10px;">${index + 1}</td>
                <td style="padding: 10px;">${playerScore.name}</td>
                <td style="padding: 10px; text-align: center;">${playerScore.cartSize}</td>
                <td style="padding: 10px; text-align: right;">$${playerScore.totalPrice.toFixed(2)}</td>
            `;
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        scoresList.appendChild(table);
        
        // Close the modal when clicking the close button
        closeButton.onclick = () => {
            modal.style.display = 'none';
        };
        
        // Close the modal when clicking outside the content
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    } catch (error) {
        console.error('Error displaying scores:', error);
    }
}

const getScoresBtn = document.getElementById('getScores');
getScoresBtn.addEventListener('click', displayScores);

// Function to fetch all available game rooms
async function fetchGameRooms() {
    try {
        const roomSelector = document.getElementById('roomSelector');
        
        // Show loading state
        roomSelector.innerHTML = '<option value="">Loading rooms...</option>';
        
        // Get all game rooms from Firestore
        const snapshot = await db.collection('game_rooms').get();
        
        // Clear the dropdown
        roomSelector.innerHTML = '';
        
        // Add a default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- Select a Game Room --';
        roomSelector.appendChild(defaultOption);
        
        // Check if we have any rooms
        if (snapshot.empty) {
            const noRoomsOption = document.createElement('option');
            noRoomsOption.value = '';
            noRoomsOption.textContent = 'No game rooms found';
            noRoomsOption.disabled = true;
            roomSelector.appendChild(noRoomsOption);
            return;
        }
        
        // Create an array to hold room info
        const rooms = [];
        
        // Process each room document
        snapshot.forEach(doc => {
            // Get the room metadata if it exists
            const roomData = doc.data();
            
            // Add to our rooms array
            rooms.push({
                id: doc.id,
                name: roomData.name || `Room ${doc.id.substring(0, 6)}...`, // Use name or ID truncated
                createdAt: roomData.createdAt ? roomData.createdAt.toDate() : new Date()
            });
        });
        
        // Sort rooms by name or creation date
        rooms.sort((a, b) => a.name.localeCompare(b.name));
        
        // Add each room to the dropdown
        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.id;
            option.textContent = room.name;
            
            // Add the room ID as a data attribute for reference
            option.dataset.roomId = room.id;
            
            // Add a title (tooltip) with room details
            const createdDate = room.createdAt ? room.createdAt.toLocaleDateString() : 'Unknown';
            option.title = `Room ID: ${room.id}\nCreated: ${createdDate}`;
            
            // Check if this is the current room and select it
            if (room.id === GAME_ROOM_ID) {
                option.selected = true;
            }
            
            roomSelector.appendChild(option);
        });
        
        console.log(`Loaded ${rooms.length} game rooms`);
    } catch (error) {
        console.error('Error fetching game rooms:', error);
        
        // Show error in dropdown
        const roomSelector = document.getElementById('roomSelector');
        roomSelector.innerHTML = '<option value="">Error loading rooms</option>';
    }
}

// Set up the game room ID functionality
const gameRoomIdInput = document.getElementById('gameRoomId');
const setRoomIdBtn = document.getElementById('setRoomId');
const currentRoomIdSpan = document.getElementById('currentRoomId');
const roomSelector = document.getElementById('roomSelector');
const refreshRoomsBtn = document.getElementById('refreshRooms');

// Update the current room ID display
function updateRoomIdDisplay() {
    // Update the current room ID span
    if (currentRoomIdSpan) {
        currentRoomIdSpan.textContent = GAME_ROOM_ID;
    }
    
    // Update the room ID display in the header
    const roomIdDisplay = document.getElementById('roomIdDisplay');
    if (roomIdDisplay) {
        roomIdDisplay.textContent = GAME_ROOM_ID.substring(0, 8) + '...';
        roomIdDisplay.title = GAME_ROOM_ID;
    }
    
    // Update the room name display in the header
    const roomNameDisplay = document.getElementById('roomNameDisplay');
    if (roomNameDisplay) {
        // Default room name
        let roomName = "Room";
        
        // Try to get the room name from the selector
        if (roomSelector && roomSelector.selectedIndex > 0) {
            roomName = roomSelector.options[roomSelector.selectedIndex].textContent;
        }
        
        roomNameDisplay.textContent = roomName;
    }
    
    // Update the room selector if it exists
    if (roomSelector) {
        const options = roomSelector.options;
        let found = false;
        
        for (let i = 0; i < options.length; i++) {
            if (options[i].value === GAME_ROOM_ID) {
                roomSelector.selectedIndex = i;
                found = true;
                
                // Update room name display with the selected option text
                if (roomNameDisplay) {
                    roomNameDisplay.textContent = options[i].textContent;
                }
                
                break;
            }
        }
        
        // If the current room isn't in the dropdown, we might need to fetch rooms again
        if (!found && options.length > 1) {
            console.log(`Current room ID ${GAME_ROOM_ID} not found in dropdown, refreshing rooms...`);
            fetchGameRooms();
        }
    }
}

// Initialize the room ID display
updateRoomIdDisplay();

// Set Room ID button click handler
setRoomIdBtn.addEventListener('click', () => {
    const newRoomId = gameRoomIdInput.value.trim();
    
    if (!newRoomId) {
        alert('Please enter a valid Game Room ID');
        return;
    }
    
    // Set the new room ID
    if (setGameRoomId(newRoomId)) {
        // Update the display
        updateRoomIdDisplay();
        
        // Clear the input
        gameRoomIdInput.value = '';
        
        // Clear existing subscriptions and re-subscribe with new room ID
        if (window.itemsUnsubscribe) window.itemsUnsubscribe();
        if (window.playersUnsubscribe) window.playersUnsubscribe();
        
        window.itemsUnsubscribe = subscribeToGameItems(displayItems);
        window.playersUnsubscribe = subscribeToPlayers(displayPlayers);
        
        alert(`Game Room ID set to: ${GAME_ROOM_ID}`);
    } else {
        alert('Failed to set Game Room ID');
    }
});

// Room selector change handler
roomSelector.addEventListener('change', () => {
    const selectedRoomId = roomSelector.value;
    
    if (!selectedRoomId) {
        return; // No room selected
    }
    
    // Set the new room ID
    if (setGameRoomId(selectedRoomId)) {
        // Update the display
        updateRoomIdDisplay();
        
        // Clear existing subscriptions and re-subscribe with new room ID
        if (window.itemsUnsubscribe) window.itemsUnsubscribe();
        if (window.playersUnsubscribe) window.playersUnsubscribe();
        
        window.itemsUnsubscribe = subscribeToGameItems(displayItems);
        window.playersUnsubscribe = subscribeToPlayers(displayPlayers);
        
        console.log(`Game Room ID set to: ${GAME_ROOM_ID}`);
    } else {
        alert('Failed to set Game Room ID');
        // Reset the selector to the current room
        updateRoomIdDisplay();
    }
});

// Refresh rooms button click handler
refreshRoomsBtn.addEventListener('click', fetchGameRooms);

initGameBtn.addEventListener('click', initializeGame);
clearItemsBtn.addEventListener('click', clearGameItems);
showAllItemsBtn.addEventListener('click', showAllItems);
addPlayerBtn.addEventListener('click', () => {
    addPlayer(playerLabelInput.value, playerLocationInput.value);
    playerLabelInput.value = '';
    playerLocationInput.value = '';
});

// Initialize real-time listeners when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the room ID display
    updateRoomIdDisplay();
    
    // Fetch available game rooms
    fetchGameRooms();
    
    // Subscribe to real-time updates for game items
    window.itemsUnsubscribe = subscribeToGameItems(displayItems);
    
    // Subscribe to real-time updates for players
    window.playersUnsubscribe = subscribeToPlayers(displayPlayers);

    // Clean up listeners when the page is closed
    window.addEventListener('beforeunload', () => {
        if (window.itemsUnsubscribe) window.itemsUnsubscribe();
        if (window.playersUnsubscribe) window.playersUnsubscribe();
    });
});

// Export the core functions for use in other files
window.GameState = {
    initializeGame,
    runGame,
    clearGameItems,
    clearAllPlayerCarts,
    addItemToGameState,
    removeItemFromGameState,
    addPlayer,
    updatePlayerLocation,
    addItemToPlayerCart,
    getScore,
    subscribeToGameItems,
    subscribeToPlayers,
    getItemsFromCollection,
    setGameRoomId,
    getCurrentGameRoomId: () => GAME_ROOM_ID,
    fetchGameRooms
};
