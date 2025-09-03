
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
