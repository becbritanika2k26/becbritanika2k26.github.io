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

        const updatePosition = () => {
            const isMobile = window.innerWidth <= 768;
            const navLinks = document.querySelector('.nav-links');
            const nav = document.querySelector('nav');

            if (isMobile && navLinks) {
                // Move inside mobile menu
                indicator.style = `
                    padding: 10px 15px;
                    background: rgba(255,255,255,0.05);
                    color: #fff;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    border: 1px solid rgba(255,255,255,0.1);
                    margin: 20px 0 10px 0;
                    width: fit-content;
                `;
                if (navLinks.firstChild !== indicator) {
                    navLinks.insertBefore(indicator, navLinks.firstChild);
                }
            } else {
                // Top-right for Desktop
                indicator.style = `
                    position: fixed;
                    top: 25px;
                    right: 25px;
                    padding: 6px 12px;
                    background: rgba(10,11,16,0.8);
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
                `;
                if (document.body.lastChild !== indicator) {
                    document.body.appendChild(indicator);
                }
            }
        };

        indicator.innerHTML = `<span style="width: 6px; height: 6px; border-radius: 50%; background: #94a3b8;" id="status-dot"></span> <span id="status-text">CONNECTING</span>`;
        updatePosition();
        window.addEventListener('resize', updatePosition);

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
