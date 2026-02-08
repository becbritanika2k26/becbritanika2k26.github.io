/**
 * adminEventsController - Cloud Sync Logic for the Unified Event Admin Dashboard
 */

import './eventEngine.js';

window.adminEventsController = {
    init() {
        this.bindEvents();
        window.EventEngine.init((type, data) => {
            if (type === 'events' || type === 'filter') this.refresh();
            if (type === 'spotlight') this.refreshSpotlight();
        });
    },

    bindEvents() {
        const eventForm = document.getElementById('event-form');
        if (eventForm) {
            eventForm.onsubmit = (e) => {
                e.preventDefault();
                this.handleSave();
            };
        }

        const spotlightForm = document.getElementById('spotlight-form');
        if (spotlightForm) {
            spotlightForm.onsubmit = (e) => {
                e.preventDefault();
                this.handleSaveSpotlight();
            };
        }
    },

    refresh() {
        const search = document.getElementById('event-search').value;
        const cat = document.getElementById('filter-category').value;
        const status = document.getElementById('filter-status').value;

        let events = Object.values(window.EventEngine.events);

        if (search) {
            const s = search.toLowerCase();
            events = events.filter(e =>
                e.name.toLowerCase().includes(s) ||
                (e.venue && e.venue.toLowerCase().includes(s))
            );
        }

        if (cat !== 'all') {
            events = events.filter(e => e.category === cat);
        }

        // Handle deleted/active status if needed, but for now we just render all
        if (window.Renderer) {
            window.Renderer.renderEventTable(events, 'event-list-body');
        }
    },

    async handleSave() {
        const id = document.getElementById('edit-id').value;
        const data = {
            name: document.getElementById('edit-name').value,
            category: document.getElementById('edit-category').value,
            venue: document.getElementById('edit-venue').value,
            date: document.getElementById('edit-date').value,
            time: document.getElementById('edit-time').value,
            participants: document.getElementById('edit-participants').value.split('\n').filter(p => p.trim())
        };

        try {
            if (id) {
                await window.EventEngine.updateEvent(id, data);
            } else {
                await window.EventEngine.addEvent(data);
            }
            this.closeModal();
            alert("Event synced to cloud!");
        } catch (err) {
            alert("Sync failed.");
        }
    },

    refreshSpotlight() {
        const items = window.EventEngine.spotlight;
        const container = document.getElementById('spotlight-list-body');
        const now = Date.now();

        if (!container) return;

        if (items.length === 0) {
            container.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; opacity:0.6;">No spotlight active.</td></tr>';
            return;
        }

        container.innerHTML = items.map(it => {
            const ageHours = it.timestamp ? Math.floor((now - it.timestamp) / (1000 * 60 * 60)) : 0;
            return `
                <tr>
                    <td><strong>${it.session}</strong></td>
                    <td>${it.time}</td>
                    <td><div style="font-size:0.8rem; opacity:0.8;">${it.events.join(', ')}</div></td>
                    <td><span class="badge" style="background:rgba(255,255,255,0.1);">${ageHours}h old</span></td>
                    <td>
                        <button class="btn-icon edit" onclick="adminEditSpotlight('${it.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon delete" onclick="adminDeleteSpotlight('${it.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    async handleSaveSpotlight() {
        const id = document.getElementById('edit-spot-id').value;
        const session = document.getElementById('spot-session').value;
        const time = document.getElementById('spot-time').value;
        const highlights = document.getElementById('spot-highlights').value.split('\n').filter(l => l.trim());

        try {
            if (id) {
                await window.EventEngine.updateSpotlight(id, { session, time, events: highlights });
            } else {
                await window.EventEngine.addSpotlight(session, time, highlights);
            }
            this.closeSpotlightModal();
            alert("Spotlight synced!");
        } catch (err) {
            alert("Sync failed.");
        }
    },

    openEdit(id) {
        const event = window.EventEngine.events[id];
        if (!event) return;
        document.getElementById('modal-title').innerText = "Edit " + event.name;
        document.getElementById('edit-id').value = event.id;
        document.getElementById('edit-name').value = event.name;
        document.getElementById('edit-category').value = event.category;
        document.getElementById('edit-venue').value = event.venue || '';
        document.getElementById('edit-date').value = event.date || '';
        document.getElementById('edit-time').value = event.time || '';
        document.getElementById('edit-participants').value = (event.participants || []).join('\n');
        document.getElementById('event-modal').style.display = 'flex';
    },

    openAdd() {
        document.getElementById('modal-title').innerText = "Create New Event";
        document.getElementById('event-form').reset();
        document.getElementById('edit-id').value = "";
        document.getElementById('event-modal').style.display = 'flex';
    },

    openEditSpotlight(id) {
        const item = window.EventEngine.spotlight.find(it => it.id === id);
        if (!item) return;

        document.getElementById('spotlight-modal-title').innerText = "Edit Spotlight";
        document.getElementById('edit-spot-id').value = id;
        document.getElementById('spot-session').value = item.session;
        document.getElementById('spot-time').value = item.time;
        document.getElementById('spot-highlights').value = item.events.join('\n');
        document.getElementById('spotlight-modal').style.display = 'flex';
    },

    async deleteSpotlight(id) {
        if (confirm("Delete this spotlight?")) {
            await window.EventEngine.deleteSpotlight(id);
        }
    },

    closeModal() { document.getElementById('event-modal').style.display = 'none'; },
    closeSpotlightModal() { document.getElementById('spotlight-modal').style.display = 'none'; },

    openSettings() {
        const panel = document.getElementById('settings-panel');
        panel.style.display = (panel.style.display === 'none') ? 'block' : 'none';
        document.getElementById('config-target-date').value = window.EventEngine.settings.targetDate || 'February 7, 2026 09:00:00';
    },

    async saveGlobalSettings() {
        const date = document.getElementById('config-target-date').value;
        await window.EventEngine.updateSettings({ targetDate: date });
        alert("Settings Synced!");
        document.getElementById('settings-panel').style.display = 'none';
    }
};

// Global hooks
window.adminEditEvent = (id) => adminEventsController.openEdit(id);
window.adminDeleteEvent = async (id) => {
    if (confirm("Permanently delete this event?")) {
        await window.EventEngine.deleteEvent(id);
    }
};
window.adminEditSpotlight = (id) => adminEventsController.openEditSpotlight(id);
window.adminDeleteSpotlight = (id) => adminEventsController.deleteSpotlight(id);
window.openAddModal = () => adminEventsController.openAdd();
window.openSpotlightModal = () => {
    document.getElementById('spotlight-modal-title').innerText = "Add Today's Spotlight";
    document.getElementById('spotlight-form').reset();
    document.getElementById('edit-spot-id').value = "";
    document.getElementById('spotlight-modal').style.display = 'flex';
};
window.openSettings = () => adminEventsController.openSettings();
window.saveGlobalSettings = () => adminEventsController.saveGlobalSettings();
window.closeModal = () => adminEventsController.closeModal();
window.closeSpotlightModal = () => adminEventsController.closeSpotlightModal();
window.filterAndRender = () => adminEventsController.refresh();

// Initialize Robustly
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.adminEventsController.init());
} else {
    window.adminEventsController.init();
}
