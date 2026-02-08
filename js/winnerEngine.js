/**
 * WinnerEngine - Real-time Winner Data System
 * BEC Britanika 2K26
 */

import RealtimeSync from './realtimeSync.js';

window.WinnerEngine = {
    winners: [],
    _unsubscribe: null,

    init(onUpdateCallback) {
        if (this._unsubscribe) this._unsubscribe();
        this._unsubscribe = RealtimeSync.subscribeCollection('winners', (data) => {
            this.winners = data;
            if (onUpdateCallback) onUpdateCallback(data);
            window.dispatchEvent(new CustomEvent('winnersUpdate', { detail: data }));

            // Check for new winners to trigger popup (only if it's a recent update)
            this._checkNewWinners(data);
        }, 'timestamp', 'desc');
    },

    async addWinner(data) {
        const newWinner = {
            ...data,
            isNew: true,
            timestamp: Date.now()
        };
        return await RealtimeSync.addToCollection('winners', newWinner);
    },

    async updateWinner(id, data) {
        return await RealtimeSync.updateDocument('winners', id, data);
    },

    async deleteWinner(id) {
        return await RealtimeSync.deleteDocument('winners', id);
    },

    _checkNewWinners(data) {
        if (data.length > 0) {
            const latest = data[0];
            const now = Date.now();
            // Trigger if winner was added in the last 15 minutes
            if (now - latest.timestamp < 900000) {
                if (window.WinnerPopup) window.WinnerPopup.trigger(latest);
            }
        }
    },

    getCategories() {
        return {
            "Outdoor Sports": ["Cricket", "Volleyball", "Kabaddi", "Running 100m", "Running 200m", "Shot Put", "Long Jump", "Discus Throw"],
            "Indoor Events": ["Chess", "Carrom", "Essay", "Painting", "Debate", "Quiz", "Badminton"],
            "Cultural": ["Solo Song", "Group Song", "Dance", "Drama", "Ramp Show"],
            "Technical": ["Coding", "Project Exhibition", "Poster Presentation", "Photography"]
        };
    }
};
