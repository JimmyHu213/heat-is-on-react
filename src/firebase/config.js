// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// Replace with your own Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "the-heat-is-on.firebaseapp.com",
  projectId: "the-heat-is-on",
  storageBucket: "the-heat-is-on.firebasestorage.app",
  messagingSenderId: "822876008624",
  appId: "1:822876008624:web:0f973a4f8d01d52fab0b75",
  measurementId: "G-YGN41SH46S",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
