// Import Firebase SDK
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, push, set, onValue, query, orderByChild, limitToLast } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDLApbv6qovIYaGr9lifLLNn1Hxc288JJM",
  authDomain: "snake-5dfac.firebaseapp.com",
  projectId: "snake-5dfac",
  storageBucket: "snake-5dfac.firebasestorage.app",
  messagingSenderId: "480046494846",
  appId: "1:480046494846:web:4ecb40f4495963dcc6b42f",
  measurementId: "G-E51iFME9ZX",
  databaseURL: "https://snake-5dfac-default-rtdb.asia-southeast1.firebasedatabase.app"
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
