/**
 * EventEngine - Real-time Event & Spotlight Management
 * BEC Britanika 2K26
 */

import RealtimeSync from './realtimeSync.js';

window.EventEngine = {
    events: {},
    spotlight: [],
    settings: {},
    _unsubscribeEvents: null,
    _unsubscribeSpotlight: null,
    _unsubscribeSettings: null,

    init(onUpdate) {
        if (this._unsubscribeEvents) this._unsubscribeEvents();
        if (this._unsubscribeSpotlight) this._unsubscribeSpotlight();
        if (this._unsubscribeSettings) this._unsubscribeSettings();

        this._unsubscribeEvents = RealtimeSync.subscribeCollection('events', (data) => {
            const obj = {};
            data.forEach(e => obj[e.id] = e);
            this.events = obj;
            if (onUpdate) onUpdate('events', this.events);
            window.dispatchEvent(new CustomEvent('eventsUpdate', { detail: this.events }));
        }, 'id', 'asc');

        this._unsubscribeSpotlight = RealtimeSync.subscribeCollection('spotlight', (data) => {
            this.spotlight = data;
            if (onUpdate) onUpdate('spotlight', this.spotlight);
            window.dispatchEvent(new CustomEvent('spotlightUpdate', { detail: this.spotlight }));
        }, 'timestamp', 'desc');

        this._unsubscribeSettings = RealtimeSync.subscribeDoc('settings', 'global', (data) => {
            this.settings = data || {};
            if (onUpdate) onUpdate('settings', this.settings);
            window.dispatchEvent(new CustomEvent('settingsUpdate', { detail: this.settings }));
        });
    },

    // --- Events ---
    async addEvent(data) {
        const id = 'ev-' + Date.now();
        return await RealtimeSync.updateDocument('events', id, { ...data, id });
    },
    async updateEvent(id, data) {
        return await RealtimeSync.updateDocument('events', id, data);
    },
    async deleteEvent(id) {
        return await RealtimeSync.deleteDocument('events', id);
    },

    // --- Spotlight ---
    async addSpotlight(session, time, events) {
        return await RealtimeSync.addToCollection('spotlight', { session, time, events, timestamp: Date.now() });
    },
    async updateSpotlight(id, data) {
        return await RealtimeSync.updateDocument('spotlight', id, data);
    },
    async deleteSpotlight(id) {
        return await RealtimeSync.deleteDocument('spotlight', id);
    },

    // --- Settings ---
    async updateSettings(data) {
        return await RealtimeSync.updateDocument('settings', 'global', data);
    }
};
