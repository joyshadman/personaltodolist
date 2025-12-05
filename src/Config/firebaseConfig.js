import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // ✅ Realtime DB
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // ✅ Firestore

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB3SoCJqQaR6pup0a6nM-uz2ktEWSDsLpA",
  authDomain: "todo-list-7b734.firebaseapp.com",
  databaseURL: "https://todo-list-7b734-default-rtdb.firebaseio.com",
  projectId: "todo-list-7b734",
  storageBucket: "todo-list-7b734.appspot.com",
  messagingSenderId: "1085496602208",
  appId: "1:1085496602208:web:800b7b6c1dce7b89a75d05",
  measurementId: "G-0R3TZHSCGK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Realtime Database instance
export const db = getDatabase(app);

// ✅ Firestore instance (optional, if you want Firestore later)
export const firestore = getFirestore(app);

// Auth instance
export const auth = getAuth(app);

export { app };
