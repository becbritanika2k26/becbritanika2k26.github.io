/**
 * EventManager - Unified Event Source of Truth
 * BEC Britanika 2K26
 */

window.EventManager = {
    _events: [],
    _overrides: {}, // Stores modifications and deletions: { id: { data, deleted: boolean } }

    async init() {
        try {
            const files = ['sports.json', 'cultural.json', 'other-events.json'];
            let baseEvents = [];

            for (const file of files) {
                try {
                    const res = await fetch(`data/${file}`);
                    if (!res.ok) continue;
                    const data = await res.json();

                    // Normalize data structure during load
                    const normalized = data.map(event => ({
                        id: event.id || `evt-${Math.random().toString(36).substr(2, 9)}`,
                        name: event.name || 'Untitled Event',
                        title: event.name || event.title || 'Untitled Event',
                        category: event.category || file.replace('.json', ''),
                        date: event.date || 'TBA',
                        time: event.time || 'TBA',
                        venue: event.venue || 'Main Campus',
                        participants: event.participants || [],
                        image: event.image || 'assets/default-event.png',
                        deleted: false
                    }));
                    baseEvents = [...baseEvents, ...normalized];
                } catch (err) {
                    console.warn(`EventManager: Could not load ${file}`, err);
                }
            }

            // Load overrides from storage
            this._overrides = JSON.parse(localStorage.getItem('britanika_event_overrides') || '{}');

            this._sync(baseEvents);
            console.log("EventManager: Initialized with", this._events.length, "events");
        } catch (e) {
            console.error("EventManager: Fail", e);
        }
    },

    _sync(baseEvents) {
        const eventMap = new Map();

        // 1. Add base events
        baseEvents.forEach(e => eventMap.set(e.id, e));

        // 2. Apply Overrides (Updates and new events)
        Object.keys(this._overrides).forEach(id => {
            const override = this._overrides[id];
            if (eventMap.has(id)) {
                // Update existing
                eventMap.set(id, { ...eventMap.get(id), ...override });
            } else if (!override.deleted) {
                // New admin-created event
                eventMap.set(id, override);
            } else {
                // Even if it was a new event and deleted, keep it for admin history
                eventMap.set(id, override);
            }
        });

        this._events = Array.from(eventMap.values());
        this._saveToStorage();
    },

    _saveToStorage() {
        localStorage.setItem('britanika_event_overrides', JSON.stringify(this._overrides));
    },

    // --- API ---

    getEvents(includeDeleted = false) {
        if (includeDeleted) return this._events;
        return this._events.filter(e => !e.deleted);
    },

    getEventById(id) {
        return this._events.find(e => e.id === id);
    },

    // CRUD
    updateEvent(id, data) {
        this._overrides[id] = {
            ...(this._overrides[id] || this.getEventById(id)),
            ...data,
            deleted: false
        };
        this.init(); // Refresh
    },

    deleteEvent(id) {
        const event = this.getEventById(id);
        if (event) {
            this._overrides[id] = { ...event, deleted: true };
            this.init(); // Refresh
        }
    },

    restoreEvent(id) {
        if (this._overrides[id]) {
            this._overrides[id].deleted = false;
            this.init();
        }
    },

    addEvent(data) {
        const id = `admin-${Date.now()}`;
        this._overrides[id] = { ...data, id, deleted: false };
        this.init();
    }
};

window.EventManager.init();
