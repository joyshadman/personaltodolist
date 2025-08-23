// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAb1WSEamqZaX741BLdg83-WESlgB7BOV8",
  authDomain: "personal-todo-list-ff6f6.firebaseapp.com",
  databaseURL: "https://personal-todo-list-ff6f6-default-rtdb.firebaseio.com",
  projectId: "personal-todo-list-ff6f6",
  storageBucket: "personal-todo-list-ff6f6.firebasestorage.app",
  messagingSenderId: "1059212841105",
  appId: "1:1059212841105:web:4e4101e7cbc9e605716f30",
  measurementId: "G-SGFB9LQHJS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export default firebaseConfig;