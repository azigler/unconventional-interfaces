
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.writeStateToFirestoreHttp = functions.https.onRequest(async (req, res) => {
    // Allow CORS for requests from iOS Shortcuts
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const { collectionName, documentId, state } = req.body;

    if (!collectionName || !state) {
        return res.status(400).send('Missing collectionName or state data in request body.');
    }

    try {
        const firestore = admin.firestore();
        let docRef;

        if (documentId) {
            docRef = firestore.collection(collectionName).doc(documentId);
        }
        else {
            docRef = firestore.collection(collectionName).doc(); // Auto-generate ID
        }

        await docRef.set(state, { merge: true }); // Use merge: true to update or create

        return res.status(200).json({ success: true, message: `State written to Firestore document ${docRef.id}`, documentId: docRef.id });
    }
    catch (error) {
        console.error('Error writing to Firestore:', error);
        return res.status(500).json({ success: false, message: 'Unable to write state to Firestore.', error: error.message });
    }
});

// New function to update and then remove game_mode for all game_rooms documents
exports.updateGameModeTemporarily = functions.https.onRequest(async (req, res) => {
    // Allow CORS
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const firestore = admin.firestore();
        const gameRoomsRef = firestore.collection('game_rooms');
        
        // Get all documents in the game_rooms collection
        const snapshot = await gameRoomsRef.get();
        
        if (snapshot.empty) {
            return res.status(200).json({ 
                success: true, 
                message: 'No documents found in game_rooms collection.' 
            });
        }
        
        // Array to store update promises
        const updatePromises = [];
        
        // First update - Set game_mode to "jason" for all documents
        snapshot.forEach(doc => {
            updatePromises.push(doc.ref.update({ game_mode: "jason" }));
        });
        
        // Execute all updates
        await Promise.all(updatePromises);
        
        console.log(`Updated game_mode to "jason" for ${updatePromises.length} documents`);
        
        // Schedule removal of game_mode field after 10 seconds
        setTimeout(async () => {
            const removePromises = [];
            
            // Get fresh snapshot to ensure we're working with current data
            const freshSnapshot = await gameRoomsRef.get();
            
            freshSnapshot.forEach(doc => {
                // Use FieldValue.delete() to remove the field
                removePromises.push(doc.ref.update({
                    game_mode: admin.firestore.FieldValue.delete()
                }));
            });
            
            try {
                await Promise.all(removePromises);
                console.log(`Removed game_mode field from ${removePromises.length} documents`);
            } catch (removeError) {
                console.error('Error removing game_mode field:', removeError);
            }
        }, 10000); // 10 seconds delay
        
        return res.status(200).json({ 
            success: true, 
            message: `Updated game_mode to "jason" for ${updatePromises.length} documents. Will be removed after 10 seconds.` 
        });
    } catch (error) {
        console.error('Error updating game_rooms documents:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Unable to update game_rooms documents.', 
            error: error.message 
        });
    }
});
