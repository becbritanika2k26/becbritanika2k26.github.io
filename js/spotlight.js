/**
 * Spotlight System - BEC Britanika 2K26 (Cloud Synced)
 * Handles "Today's Spotlight" popup logic and auto-expiry.
 */

window.SpotlightManager = {
    _expiryMs: 24 * 60 * 60 * 1000, // 24 Hours
    _data: [],

    async init() {
        // Initial render will be called by EventEngine listener in index.html
        this.checkAutoTrigger();
    },

    render(items) {
        this._data = items || [];
        const container = document.getElementById('spotlight-content');
        const homepageList = document.getElementById('homepage-live-updates');

        if (container) {
            if (this._data.length === 0) {
                container.innerHTML = `<p style="text-align:center; opacity:0.6;">No special highlights for today.</p>`;
            } else {
                container.innerHTML = this._data.map(item => `
                    <div class="spotlight-group">
                        <div class="spotlight-session">
                            <i class="far fa-clock"></i> ${item.time} — <span>${item.session}</span>
                        </div>
                        <div class="spotlight-list">
                            ${(item.events || []).map(evt => `
                                <div class="spotlight-item">
                                    <i class="fas fa-arrow-right"></i>
                                    <span>${evt}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('');
            }
        }

        if (homepageList) {
            if (this._data.length === 0) {
                homepageList.innerHTML = '<p style="opacity:0.6; font-size:0.8rem;">Awaiting campus updates...</p>';
            } else {
                // Show latest few as small buzz items
                homepageList.innerHTML = this._data.slice(0, 3).map(it => `
                    <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <div style="font-size: 0.7rem; color: var(--primary); font-weight: bold;">${it.time}</div>
                        <div style="font-size: 0.9rem; font-weight: bold;">${it.session}</div>
                        <div style="font-size: 0.8rem; opacity: 0.7;">${it.events[0]} and more...</div>
                    </div>
                `).join('');
            }
        }
    },

    checkAutoTrigger() {
        const overlay = document.getElementById('spotlight-overlay');
        if (!overlay) return;

        const lastSeen = localStorage.getItem('spotlight_last_seen');
        const now = Date.now();
        // Show if not seen in last 10 minutes
        if (!lastSeen || (now - lastSeen > 600000)) {
            setTimeout(() => {
                overlay.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }, 1500);
        }
    }
};

window.closeSpotlight = () => {
    const overlay = document.getElementById('spotlight-overlay');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = 'auto';
    localStorage.setItem('spotlight_last_seen', Date.now());
};

window.reopenSpotlight = () => {
    const overlay = document.getElementById('spotlight-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.SpotlightManager.init();
});
