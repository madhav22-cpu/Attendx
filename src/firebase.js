// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase web configuration. Values are read from VITE_FIREBASE_* env vars
// (see .env.example) so the project can be pointed at a different Firebase
// project without editing source. The literal values below are the ones
// this project already shipped with and are kept as a fallback purely so
// the app keeps working out of the box — they are standard Firebase web
// config (not a secret) and are safe to be visible in client bundles.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDdB0NFPd_lrDbsmMeusaDJ8Salp1y00B0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "attendx-96a8c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "attendx-96a8c",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "attendx-96a8c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "725380352334",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:725380352334:web:4a0be3dec8178d6905761f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
