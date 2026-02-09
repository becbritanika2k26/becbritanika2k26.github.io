/**
 * AdminController - Unified Admin & Auth Manager
 * BEC Britanika 2K26
 */

import { auth } from './cloudConfig.js';
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

window.AdminController = {
    user: null,

    initAuth(onStatusChange) {
        onAuthStateChanged(auth, (user) => {
            this.user = user;
            if (onStatusChange) onStatusChange(user);

            // Auto-redirect if not logged in and on an admin page
            const path = window.location.pathname;
            if (!user && path.includes('admin-')) {
                // Not logged in, but on admin page
                window.location.href = 'admin.html';
            }
        });
    },

    async login(email, password) {
        try {
            return await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Login Error:", error);
            throw error;
        }
    },

    async logout() {
        try {
            await signOut(auth);
            window.location.href = 'index.html';
        } catch (error) {
            console.error("Logout Error:", error);
        }
    },

    /**
     * Connection Status UI Helper
     */
    initConnectionIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'cloud-status-indicator';
        indicator.style = `
            position: fixed;
            top: 26px;
            right: 80px;
            padding: 6px 12px;
            background: rgba(255,255,255,0.05);
            color: #fff;
            border-radius: 50px;
            font-size: 9px;
            font-weight: 900;
            display: flex;
            align-items: center;
            gap: 6px;
            z-index: 1001;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            pointer-events: none;
            transition: 0.3s;
        `;
        indicator.innerHTML = `<span style="width: 6px; height: 6px; border-radius: 50%; background: #94a3b8;" id="status-dot"></span> <span id="status-text">CONNECTING</span>`;

        // Try to append to nav for better integration
        const nav = document.querySelector('nav');
        if (nav) {
            nav.appendChild(indicator);
        } else {
            document.body.appendChild(indicator);
        }

        window.addEventListener('cloudConnectionChanged', (e) => {
            const status = e.detail;
            const dot = document.getElementById('status-dot');
            const text = document.getElementById('status-text');

            if (status === 'LIVE') {
                dot.style.background = '#22c55e';
                dot.style.boxShadow = '0 0 10px #22c55e';
                text.innerText = 'LIVE CLOUD';
            } else {
                dot.style.background = '#ef4444';
                dot.style.boxShadow = '0 0 10px #ef4444';
                text.innerText = 'OFFLINE';
            }
        });
    }
};
