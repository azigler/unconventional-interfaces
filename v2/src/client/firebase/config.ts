import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration - same as original project for now
const firebaseConfig = {
  apiKey: "AIzaSyDszn6_HRgIWrO3VL17P_AJHbIlHxQcmiY",
  authDomain: "codetv-andrew-billy.firebaseapp.com",
  projectId: "codetv-andrew-billy",
  storageBucket: "codetv-andrew-billy.appspot.com",
  messagingSenderId: "639073768296",
  appId: "1:639073768296:web:a74e9a7e9e7aa0a7bb2a93"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
let analytics;

// Only initialize analytics in production and in browser
if (import.meta.env.PROD && typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Connect to Firestore emulator in development
if (import.meta.env.DEV) {
  const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
  if (useEmulator) {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('Connected to Firestore emulator');
  }
}

export { app, db, analytics };
