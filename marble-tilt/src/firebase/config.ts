// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
// This configuration is publicly visible but secured by Firebase Security Rules
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

// Initialize Firestore
const db = getFirestore(app);

export { db };
