/**
 * StorageManager - Handles all localStorage operations
 */
window.StorageManager = {
    KEYS: {
        CURRENT_MATCH: 'britanika_current_match',
        SQUADS: 'britanika_squads'
    },

    saveMatchState(state) {
        localStorage.setItem(this.KEYS.CURRENT_MATCH, JSON.stringify(state));
    },

    getMatchState() {
        const data = localStorage.getItem(this.KEYS.CURRENT_MATCH);
        return data ? JSON.parse(data) : null;
    },

    saveSquads(squads) {
        localStorage.setItem(this.KEYS.SQUADS, JSON.stringify(squads));
    },

    getSquads() {
        const data = localStorage.getItem(this.KEYS.SQUADS);
        return data ? JSON.parse(data) : { squadA: [], squadB: [] };
    },

    clearAll() {
        localStorage.removeItem(this.KEYS.CURRENT_MATCH);
        localStorage.removeItem(this.KEYS.SQUADS);
    }
};
