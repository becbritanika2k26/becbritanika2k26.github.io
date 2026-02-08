/**
 * CloudConfig - Firebase Initialization
 * BEC Britanika 2K26
 */

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBvcYcqnan3_BnCa-WWmmyWKVqfrPvtWkc",
    authDomain: "britanika-fest.firebaseapp.com",
    projectId: "britanika-fest",
    storageBucket: "britanika-fest.firebasestorage.app",
    messagingSenderId: "326940331877",
    appId: "1:326940331877:web:65d7b57ac82b9bc7dc5b8c",
    measurementId: "G-0T3J6DXLQH",
    databaseURL: "https://britanika-fest-default-rtdb.firebaseio.com/" // Added trailing slash to fix warning
};

// Initialize Firebase
let app, db, auth, rtdb;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("🔥 Firebase Initialized: ", firebaseConfig.projectId);
} catch (e) {
    console.error("❌ Firebase Init Failed:", e);
    alert("CRITICAL ERROR: Firebase Initialization Failed. Check browser console.");
}

// Connectivity Test
async function testCloudConnection() {
    try {
        const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const testRef = doc(db, "_system_", "ping");
        await setDoc(testRef, { lastPing: Date.now(), status: "OK" }, { merge: true });
        console.log("✅ Cloud Sync active.");
        window.dispatchEvent(new CustomEvent('cloudConnectionChanged', { detail: 'LIVE' }));
    } catch (e) {
        console.warn("☁️ Cloud restricted or offline:", e.message);
    }
}
testCloudConnection();

try {
    rtdb = getDatabase(app);
    const connectedRef = ref(rtdb, ".info/connected");
    onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
            window.dispatchEvent(new CustomEvent('cloudConnectionChanged', { detail: 'LIVE' }));
        }
    });
} catch (e) {
    console.warn("RTDB not initialized:", e);
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('cloudConnectionChanged', { detail: 'OFFLINE' }));
    }, 3000);
}

const storage = getStorage(app);

export { app, db, auth, rtdb, storage };
