/**
 * adminWinnerController - Admin Panel Logic for Winner Management
 */

window.adminWinnerController = {
    init() {
        this.populateCategories();
        this.refreshTable();
        this.bindEvents();
    },

    populateCategories() {
        const cats = window.WinnerManager.getCategories();
        const catSelect = document.getElementById('win-cat');
        catSelect.innerHTML = `<option value="">Select Category</option>` +
            Object.keys(cats).map(c => `<option value="${c}">${c}</option>`).join('');
    },

    onCategoryChange() {
        const cat = document.getElementById('win-cat').value;
        const eventSelect = document.getElementById('win-event');
        const cats = window.WinnerManager.getCategories();

        if (cat && cats[cat]) {
            eventSelect.innerHTML = `<option value="">Select Event</option>` +
                cats[cat].map(e => `<option value="${e}">${e}</option>`).join('') +
                `<option value="OTHER">-- Manual Entry --</option>`;
        } else {
            eventSelect.innerHTML = `<option value="">Select Category First</option>`;
        }
    },

    onEventChange() {
        const val = document.getElementById('win-event').value;
        const manualBox = document.getElementById('manual-event-wrap');
        manualBox.style.display = (val === 'OTHER') ? 'block' : 'none';
    },

    bindEvents() {
        document.getElementById('winner-form').onsubmit = (e) => {
            e.preventDefault();
            this.handleSave();
        };
    },

    handleSave() {
        const cat = document.getElementById('win-cat').value;
        const eventDropdown = document.getElementById('win-event').value;
        const eventName = (eventDropdown === 'OTHER') ? document.getElementById('manual-event-name').value : eventDropdown;

        const data = {
            category: cat,
            eventName: eventName,
            mode: document.getElementById('win-mode').value,
            winners: {
                first: document.getElementById('pos-1').value,
                second: document.getElementById('pos-2').value,
                third: document.getElementById('pos-3').value
            }
        };

        const id = document.getElementById('edit-id').value;
        if (id) {
            window.WinnerManager.updateWinner(id, data);
        } else {
            window.WinnerManager.addWinner(data);
        }

        this.resetForm();
        this.refreshTable();
        alert("Winner broadcasted successfully!");
    },

    refreshTable() {
        const winners = window.WinnerManager.getAll();
        const body = document.getElementById('winner-table-body');

        if (winners.length === 0) {
            body.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; opacity: 0.5;">No winners announced yet.</td></tr>';
            return;
        }

        body.innerHTML = winners.map(w => `
            <tr>
                <td><strong>${w.eventName}</strong><br><small>${w.category}</small></td>
                <td><span class="badge badge-success">${w.winners.first}</span></td>
                <td>${w.mode}</td>
                <td>${new Date(w.timestamp).toLocaleDateString()}</td>
                <td>
                    <button class="btn-icon edit" onclick="window.adminWinnerController.edit('${w.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete" onclick="window.adminWinnerController.delete('${w.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    },

    edit(id) {
        const win = window.WinnerManager.getAll().find(w => w.id === id);
        if (!win) return;

        document.getElementById('edit-id').value = win.id;
        document.getElementById('win-cat').value = win.category;
        this.onCategoryChange();

        const cats = window.WinnerManager.getCategories();
        if (cats[win.category] && cats[win.category].includes(win.eventName)) {
            document.getElementById('win-event').value = win.eventName;
        } else {
            document.getElementById('win-event').value = 'OTHER';
            document.getElementById('manual-event-wrap').style.display = 'block';
            document.getElementById('manual-event-name').value = win.eventName;
        }

        document.getElementById('win-mode').value = win.mode;
        document.getElementById('pos-1').value = win.winners.first;
        document.getElementById('pos-2').value = win.winners.second;
        document.getElementById('pos-3').value = win.winners.third;

        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    delete(id) {
        if (confirm("Permanently delete this winner record?")) {
            window.WinnerManager.deleteWinner(id);
            this.refreshTable();
        }
    },

    resetForm() {
        document.getElementById('winner-form').reset();
        document.getElementById('edit-id').value = '';
        document.getElementById('manual-event-wrap').style.display = 'none';
    }
};

document.addEventListener('DOMContentLoaded', () => window.adminWinnerController.init());
