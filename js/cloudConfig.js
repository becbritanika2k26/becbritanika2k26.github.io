/**
 * CloudConfig - Firebase Initialization
 * BEC Britanika 2K26
 */

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBvcYcqnan3_BnCa-WWmmyWKVqfrPvtWkc",
    authDomain: "britanika-fest.firebaseapp.com",
    projectId: "britanika-fest",
    storageBucket: "britanika-fest.firebasestorage.app",
    messagingSenderId: "326940331877",
    appId: "1:326940331877:web:65d7b57ac82b9bc7dc5b8c",
    measurementId: "G-0T3J6DXLQH",
    databaseURL: "https://britanika-fest-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const rtdb = getDatabase(app);

// Enable Offline Persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.warn('Persistence failed: Multiple tabs open');
    } else if (err.code == 'unimplemented') {
        console.warn('Persistence is not available in this browser');
    }
});

// Connection Monitoring
const connectedRef = ref(rtdb, ".info/connected");
onValue(connectedRef, (snap) => {
    const status = snap.val() === true ? "LIVE" : "OFFLINE";
    window.dispatchEvent(new CustomEvent('cloudConnectionChanged', { detail: status }));
});

export { app, db, auth, rtdb };
