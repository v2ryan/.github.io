// Import Firebase SDK
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, push, set, onValue, query, orderByChild, limitToLast } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA281rNE20YfeR8nQw7qY8jRIQJb1CkUKE",
  authDomain: "react-99f60.firebaseapp.com",
  databaseURL: "https://react-99f60-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "react-99f60",
  storageBucket: "react-99f60.firebasestorage.app",
  messagingSenderId: "628192861528",
  appId: "1:628192861528:web:00e56e0241012d8ae3992d",
  measurementId: "G-BD2X950DXK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
let database;
try {
  database = getDatabase(app);
  console.log('Firebase initialized successfully!');
} catch (error) {
  console.warn('Realtime Database not enabled yet. Please enable it in Firebase Console.');
  console.warn('Error:', error.message);
}

// Export database functions
export { database, ref, push, set, onValue, query, orderByChild, limitToLast };
