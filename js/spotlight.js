/**
 * Spotlight System - BEC Britanika 2K26
 * Handles "Today's Spotlight" popup logic and auto-expiry.
 */

window.SpotlightManager = {
    _key: 'bec_britanika_spotlight',
    _expiryMs: 24 * 60 * 60 * 1000, // 24 Hours

    async init() {
        this.cleanExpired();
        this.render();
        this.checkAutoTrigger();
    },

    getData() {
        const raw = localStorage.getItem(this._key);
        if (!raw) return this.getDefaults();

        try {
            const items = JSON.parse(raw);
            // Ensure data is array
            return Array.isArray(items) ? items : this.getDefaults();
        } catch (e) {
            return this.getDefaults();
        }
    },

    getDefaults() {
        return [
            { id: 'def-1', time: "09:00 AM", session: "Morning Session", events: ["Opening Ceremony", "Track Events Kickoff", "Registration Desk Open"], timestamp: Date.now() },
            { id: 'def-2', time: "02:00 PM", session: "Afternoon Session", events: ["Fine Arts Gallery", "Seminar Hall A: Workshop"], timestamp: Date.now() }
        ];
    },

    cleanExpired() {
        let items = this.getData();
        const now = Date.now();
        // Filter out items older than 24 hours
        const filtered = items.filter(item => {
            if (!item.timestamp) return true; // Keep old items without timestamp for safety or fix them
            return (now - item.timestamp) < this._expiryMs;
        });

        if (filtered.length !== items.length) {
            localStorage.setItem(this._key, JSON.stringify(filtered));
        }
    },

    save(items) {
        localStorage.setItem(this._key, JSON.stringify(items));
        this.render();
    },

    add(session, time, eventList) {
        const items = this.getData();
        items.push({
            id: 'spot-' + Date.now(),
            session: session,
            time: time,
            events: Array.isArray(eventList) ? eventList : eventList.split(',').map(e => e.trim()),
            timestamp: Date.now()
        });
        this.save(items);
    },

    delete(id) {
        let items = this.getData();
        items = items.filter(it => it.id !== id);
        this.save(items);
    },

    update(id, data) {
        let items = this.getData();
        const index = items.findIndex(it => it.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...data };
            this.save(items);
        }
    },

    render() {
        const container = document.getElementById('spotlight-content');
        if (!container) return;

        const items = this.getData();
        if (items.length === 0) {
            container.innerHTML = `<p style="text-align:center; opacity:0.6;">No special highlights for today.</p>`;
            return;
        }

        container.innerHTML = items.map(item => `
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
    },

    checkAutoTrigger() {
        const overlay = document.getElementById('spotlight-overlay');
        if (!overlay) return;

        const lastSeen = localStorage.getItem('spotlight_last_seen');
        const now = Date.now();
        // Show if not seen in last 10 minutes (for better UX during fest)
        if (!lastSeen || (now - lastSeen > 600000)) {
            setTimeout(() => {
                overlay.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }, 1500);
        }
    }
};

function closeSpotlight() {
    const overlay = document.getElementById('spotlight-overlay');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = 'auto';
    localStorage.setItem('spotlight_last_seen', Date.now());
}

window.closeSpotlight = closeSpotlight;

document.addEventListener('DOMContentLoaded', () => {
    window.SpotlightManager.init();
});
