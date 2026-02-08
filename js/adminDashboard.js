/**
 * AdminDashboard.js - Real-time Analytics Engine
 * BEC Britanika 2K26
 */
import { db, rtdb } from './cloudConfig.js';
import './adminController.js';
import {
    doc,
    onSnapshot,
    collection,
    query,
    orderBy,
    limit,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const Dashboard = {


    init() {
        // Use the global AdminController which is initialized via import in HTML or here
        if (window.AdminController) {
            window.AdminController.initAuth((user) => {
                if (user) {
                    const authWall = document.getElementById('auth-wall');
                    if (authWall) authWall.style.display = 'none';
                    this.startSync();
                }
            });
            window.AdminController.initConnectionIndicator();
        }
    },

    startSync() {
        this.syncTotals();
        this.syncRecent();
        this.syncLive();
    },

    // 1. Total & Daily Visitors
    syncTotals() {
        // All-time Total
        onSnapshot(doc(db, 'analytics', 'totals'), (snap) => {
            const data = snap.data();
            if (data) {
                document.getElementById('all-time-visitors').innerText = data.allTime?.toLocaleString() || 0;
            }
        });

        // Daily Trends & Today's Count
        onSnapshot(doc(db, 'analytics', 'daily'), (snap) => {
            const data = snap.data() || {};
            const today = new Date().toISOString().split('T')[0];

            // Update Today's Stat
            if (document.getElementById('today-visitors')) {
                document.getElementById('today-visitors').innerText = data[today]?.toLocaleString() || 0;
            }


        });

        // Peak Sync
        onSnapshot(doc(db, 'analytics', 'peak'), (snap) => {
            const data = snap.data();
            if (data && document.getElementById('peak-viewers')) {
                document.getElementById('peak-viewers').innerText = data.count || 0;
            }
        });
    },

    // 2. Recent Visitors
    syncRecent() {
        const q = query(collection(db, 'recent_visits'), orderBy('timestamp', 'desc'), limit(10));
        onSnapshot(q, (snap) => {
            const list = document.getElementById('recent-visitors-list');
            if (!list) return;

            list.innerHTML = '';
            if (snap.empty) {
                list.innerHTML = '<div style="text-align: center; opacity: 0.5;">No recent visits logged...</div>';
                return;
            }

            snap.forEach(docSnap => {
                const v = docSnap.data();
                const isMe = v.vid === localStorage.getItem('bec_vid');
                const time = new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                list.innerHTML += `
                    <div class="visitor-item" style="${isMe ? 'background: rgba(56, 189, 248, 0.05); border-left: 3px solid var(--accent-blue); padding-left: 10px;' : ''}">
                        <div class="visitor-info">
                            <div>${v.vid || 'Anonymous'} ${isMe ? '<span style="color: var(--accent-blue); font-size: 0.6rem;">(YOU)</span>' : ''}</div>
                            <span>${time}</span>
                        </div>
                        <div class="visitor-page">${v.page || 'Home'}</div>
                    </div>
                `;
            });
        });
    },

    // 3. Live Presence
    syncLive() {
        // 1. RTDB Sync
        const presenceRef = ref(rtdb, 'presence');
        onValue(presenceRef, (snap) => {
            this.rtdbData = snap.val() || {};
            this.processPresence();
        });

        // 2. Firestore Sync (Reliable Fallback)
        const q = query(collection(db, 'active_sessions'));
        onSnapshot(q, (snap) => {
            const now = Date.now();
            const firestoreLive = {};
            snap.forEach(docSnap => {
                const data = docSnap.data();
                // Filter users active in the last 60 seconds
                if (data.lastSeen && (now - data.lastSeen < 60000)) {
                    firestoreLive[docSnap.id] = data;
                }
            });
            this.firestoreData = firestoreLive;
            this.processPresence();
        });
    },

    processPresence() {
        // Merge unique users from both sources
        const combined = { ...(this.firestoreData || {}), ...(this.rtdbData || {}) };
        const now = Date.now();

        let liveCount = 0;
        let streamerCount = 0;
        const eventStats = {};

        Object.values(combined).forEach(p => {
            // Final check: Is this record active in the last 2 minutes?
            const lastActiveTime = p.lastActive || p.lastSeen || 0;
            if (now - lastActiveTime < 120000) {
                liveCount++;
                if (p.isStream) {
                    streamerCount++;
                    const target = (p.streamTarget || 'others').replace('live-', '');
                    eventStats[target] = (eventStats[target] || 0) + 1;
                }
            }
        });

        console.log(`📊 Dashboard Update: ${liveCount} active users found in memory.`);

        if (document.getElementById('live-users'))
            document.getElementById('live-users').innerText = liveCount;

        if (document.getElementById('live-viewers'))
            document.getElementById('live-viewers').innerText = streamerCount;

        this.updatePeak(streamerCount);
        this.renderEventList(eventStats);
    },

    renderEventList(stats) {
        const container = document.getElementById('event-viewers-list');
        if (!container) return;

        const entries = Object.entries(stats);
        if (entries.length === 0) {
            container.innerHTML = '<div style="text-align: center; opacity: 0.5; padding: 20px;">No active live broadcasts...</div>';
            return;
        }

        container.innerHTML = entries.map(([name, count]) => `
            <div class="event-viewer-item">
                <span style="font-weight: bold; text-transform: uppercase;">${name.replace('live-', '').replace('.html', '')}</span>
                <span class="status-badge status-live" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); font-size: 0.7rem;">
                    <span class="live-indicator"></span> ${count} VIEWING
                </span>
            </div>
        `).sort((a, b) => b.count - a.count).join('');
    },

    async updatePeak(current) {
        if (current <= 0) return;

        try {
            const peakRef = doc(db, 'analytics', 'peak');
            const snap = await getDoc(peakRef);
            const peakData = snap.data() || { count: 0 };

            if (current > peakData.count) {
                await setDoc(peakRef, {
                    count: current,
                    timestamp: Date.now(),
                    date: new Date().toISOString()
                }, { merge: true });
            }
        } catch (e) {
            console.warn("Peak update failed:", e);
        }
    },


};

// Start the Dashboard
document.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
});
