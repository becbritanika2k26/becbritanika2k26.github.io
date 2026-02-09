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
let app, db, auth, rtdb, storage;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    rtdb = getDatabase(app); // Initialize Early
    storage = getStorage(app);
    console.log("🔥 Firebase Initialized: ", firebaseConfig.projectId);
} catch (e) {
    console.error("❌ Firebase Init Failed:", e);
    alert("CRITICAL ERROR: Firebase Initialization Failed. Check browser console.");
}

// ---------------------------------------------------------
// VISITOR TRACKING LOGIC (Real-time & Persistence)
// ---------------------------------------------------------
const initTracker = async () => {
    try {
        const { doc, setDoc, increment, collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const { ref, set, onDisconnect, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js");

        // 1. Get/Set Unique Visitor ID
        let vid = localStorage.getItem('bec_vid');
        if (!vid) {
            vid = 'v_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).slice(-4);
            localStorage.setItem('bec_vid', vid);
            await setDoc(doc(db, 'analytics', 'totals'), { allTime: increment(1) }, { merge: true });
        }

        // 2. Track Daily Unique
        const now = new Date();
        const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

        if (localStorage.getItem('bec_day_log') !== today) {
            await setDoc(doc(db, 'analytics', 'daily'), { [today]: increment(1) }, { merge: true });
            localStorage.setItem('bec_day_log', today);
        }

        // 3. Log Recent Visit (Throttled per session)
        if (!sessionStorage.getItem('bec_visit_logged')) {
            await addDoc(collection(db, 'recent_visits'), {
                vid: vid,
                page: window.location.pathname.split('/').pop() || 'index.html',
                timestamp: Date.now()
            });
            sessionStorage.setItem('bec_visit_logged', 'true');
        }

        // 4. Real-time Presence
        if (rtdb || db) {
            const presenceRef = rtdb ? ref(rtdb, `presence/${vid}`) : null;
            const isStream = window.location.pathname.includes('live-') || window.location.pathname.includes('broadcast');
            const streamTarget = isStream ? window.location.pathname.split('/').pop().replace('.html', '') : null;

            const setPresence = async () => {
                const now = Date.now();
                // A. RTDB Update
                if (presenceRef) {
                    set(presenceRef, {
                        lastActive: serverTimestamp(),
                        page: window.location.pathname.split('/').pop() || 'index.html',
                        isStream: isStream,
                        streamTarget: streamTarget
                    }).catch(() => { });
                }

                // B. Firestore Heartbeat (Fallback)
                try {
                    await setDoc(doc(db, 'active_sessions', vid), {
                        lastSeen: now,
                        isStream: isStream,
                        streamTarget: streamTarget,
                        page: window.location.pathname.split('/').pop() || 'index.html'
                    }, { merge: true });
                } catch (e) {
                    console.warn("Firestore Heartbeat Failed:", e.message);
                }
            };

            setPresence();
            if (presenceRef) onDisconnect(presenceRef).remove();
            setInterval(setPresence, 10000); // Fast 10s heartbeat for testing
            console.log("🚀 Tracker Active for:", vid);
        }

    } catch (e) {
        console.warn("Tracker failed:", e);
    }
};
initTracker();

// Connectivity Test
async function testCloudConnection() {
    try {
        const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const testRef = doc(db, "_system_", "ping");
        await setDoc(testRef, { lastPing: Date.now(), status: "OK" }, { merge: true });
        window.dispatchEvent(new CustomEvent('cloudConnectionChanged', { detail: 'LIVE' }));
    } catch (e) {
        console.warn("Cloud connection test failed:", e.message);
    }
}
testCloudConnection();

// RTDB Connection Status
if (rtdb) {
    const connectedRef = ref(rtdb, ".info/connected");
    onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
            window.dispatchEvent(new CustomEvent('cloudConnectionChanged', { detail: 'LIVE' }));
        }
    });
}

export { app, db, auth, rtdb, storage };
