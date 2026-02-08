/**
 * adminEventsController - Logic for the Unified Event Admin Dashboard
 */

window.adminEventsController = {
    init() {
        console.log("AdminEventsController: Initializing...");
        this.bindEvents();
        this.waitForManager();
    },

    waitForManager() {
        if (window.EventManager && window.EventManager._events.length >= 0) {
            this.refresh();
            this.refreshSpotlight();
        } else {
            setTimeout(() => this.waitForManager(), 500);
        }
    },

    bindEvents() {
        document.getElementById('event-form').onsubmit = (e) => {
            e.preventDefault();
            this.handleSave();
        };
        // Spotlight Form Bind
        document.getElementById('spotlight-form').onsubmit = (e) => {
            e.preventDefault();
            this.handleSaveSpotlight();
        };
    },

    // --- MAIN EVENTS LOGIC ---

    refresh() {
        const search = document.getElementById('event-search').value;
        const cat = document.getElementById('filter-category').value;
        const status = document.getElementById('filter-status').value;

        let events = window.EventManager.getEvents(status === 'all');

        if (search) {
            const s = search.toLowerCase();
            events = events.filter(e =>
                e.name.toLowerCase().includes(s) ||
                e.venue.toLowerCase().includes(s)
            );
        }

        if (cat !== 'all') {
            events = events.filter(e => e.category === cat);
        }

        window.Renderer.renderEventTable(events, 'event-list-body');
    },

    handleSave() {
        const id = document.getElementById('edit-id').value;
        const data = {
            name: document.getElementById('edit-name').value,
            category: document.getElementById('edit-category').value,
            venue: document.getElementById('edit-venue').value,
            date: document.getElementById('edit-date').value,
            time: document.getElementById('edit-time').value,
            participants: document.getElementById('edit-participants').value.split('\n').filter(p => p.trim())
        };

        if (id) {
            window.EventManager.updateEvent(id, data);
        } else {
            window.EventManager.addEvent(data);
        }

        this.closeModal();
        this.refresh();
    },

    // --- SPOTLIGHT LOGIC ---

    refreshSpotlight() {
        if (!window.SpotlightManager || !document.getElementById('spotlight-list-body')) return;

        const items = window.SpotlightManager.getData();
        const container = document.getElementById('spotlight-list-body');
        const now = Date.now();

        if (items.length === 0) {
            container.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; opacity:0.6;">No spotights active.</td></tr>';
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

    handleSaveSpotlight() {
        const id = document.getElementById('edit-spot-id').value;
        const session = document.getElementById('spot-session').value;
        const time = document.getElementById('spot-time').value;
        const highlights = document.getElementById('spot-highlights').value.split('\n').filter(l => l.trim());

        if (id) {
            window.SpotlightManager.update(id, { session, time, events: highlights });
        } else {
            window.SpotlightManager.add(session, time, highlights);
        }

        this.closeSpotlightModal();
        this.refreshSpotlight();
    },

    openEditSpotlight(id) {
        const item = window.SpotlightManager.getData().find(it => it.id === id);
        if (!item) return;

        document.getElementById('spotlight-modal-title').innerText = "Edit Spotlight";
        document.getElementById('edit-spot-id').value = id;
        document.getElementById('spot-session').value = item.session;
        document.getElementById('spot-time').value = item.time;
        document.getElementById('spot-highlights').value = item.events.join('\n');
        document.getElementById('spotlight-modal').style.display = 'flex';
    },

    deleteSpotlight(id) {
        if (confirm("Delete this spotlight?")) {
            window.SpotlightManager.delete(id);
            this.refreshSpotlight();
        }
    },

    // --- MODAL CONTROLS ---

    openEdit(id) {
        const event = window.EventManager.getEventById(id);
        if (!event) return;
        document.getElementById('modal-title').innerText = "Edit " + event.name;
        document.getElementById('edit-id').value = event.id;
        document.getElementById('edit-name').value = event.name;
        document.getElementById('edit-category').value = event.category;
        document.getElementById('edit-venue').value = event.venue;
        document.getElementById('edit-date').value = event.date;
        document.getElementById('edit-time').value = event.time;
        document.getElementById('edit-participants').value = (event.participants || []).join('\n');
        document.getElementById('event-modal').style.display = 'flex';
    },

    openAdd() {
        document.getElementById('modal-title').innerText = "Create New Event";
        document.getElementById('event-form').reset();
        document.getElementById('edit-id').value = "";
        document.getElementById('event-modal').style.display = 'flex';
    },

    openAddSpotlight() {
        document.getElementById('spotlight-modal-title').innerText = "Add Today's Spotlight";
        document.getElementById('spotlight-form').reset();
        document.getElementById('edit-spot-id').value = "";
        document.getElementById('spotlight-modal').style.display = 'flex';
    },

    closeModal() { document.getElementById('event-modal').style.display = 'none'; },
    closeSpotlightModal() { document.getElementById('spotlight-modal').style.display = 'none'; },

    openSettings() {
        const panel = document.getElementById('settings-panel');
        panel.style.display = (panel.style.display === 'none') ? 'block' : 'none';
        document.getElementById('config-target-date').value = localStorage.getItem('bec_britanika_target_date') || 'February 7, 2026 09:00:00';
    },

    saveGlobalSettings() {
        const date = document.getElementById('config-target-date').value;
        localStorage.setItem('bec_britanika_target_date', date);
        alert("Settings Saved Successfully!");
        document.getElementById('settings-panel').style.display = 'none';
    }
};

// Global hooks
window.adminEditEvent = (id) => adminEventsController.openEdit(id);
window.adminDeleteEvent = (id) => {
    if (confirm("Move this event to Trash?")) {
        window.EventManager.deleteEvent(id);
        adminEventsController.refresh();
    }
};
window.adminRestoreEvent = (id) => {
    window.EventManager.restoreEvent(id);
    adminEventsController.refresh();
};
window.adminEditSpotlight = (id) => adminEventsController.openEditSpotlight(id);
window.adminDeleteSpotlight = (id) => adminEventsController.deleteSpotlight(id);
window.openAddModal = () => adminEventsController.openAdd();
window.openSpotlightModal = () => adminEventsController.openAddSpotlight();
window.openSettings = () => adminEventsController.openSettings();
window.saveGlobalSettings = () => adminEventsController.saveGlobalSettings();
window.closeModal = () => adminEventsController.closeModal();
window.closeSpotlightModal = () => adminEventsController.closeSpotlightModal();
window.filterAndRender = () => adminEventsController.refresh();

// Initialize
window.adminEventsController.init();
