/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
admin.initializeApp();

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Add our new function to write state to Firestore
exports.writeStateToFirestoreHttp = onRequest(async (req, res) => {
  // Allow CORS for requests from iOS Shortcuts
  res.set("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    // Send response to OPTIONS requests
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const {collectionName, documentId, state} = req.body;

  if (!collectionName || !state) {
    return res.status(400).send(
        "Missing collectionName or state data in request body.");
  }

  try {
    // Print the database info for debugging
    logger.info("Starting Firestore write with: ", {
      collection: collectionName,
      documentId: documentId || "auto-generated",
      state: state,
    });

    // Initialize Firestore
    const firestore = admin.firestore();

    // Create the document reference
    let docRef;
    if (documentId) {
      docRef = firestore.collection(collectionName).doc(documentId);
    } else {
      docRef = firestore.collection(collectionName).doc();
    }

    // Set the data
    await docRef.set(state, {merge: true});

    logger.info("Successfully wrote to Firestore", {docId: docRef.id});

    return res.status(200).json({
      success: true,
      message: `State written to Firestore document ${docRef.id}`,
      documentId: docRef.id,
    });
  } catch (error) {
    logger.error("Error writing to Firestore:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to write state to Firestore.",
      error: error.message,
    });
  }
});
