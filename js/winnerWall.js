/**
 * WinnerWall - Full grid of all winners with filtering (Cloud Sync Ready)
 */

window.WinnerWall = {
    _filter: 'all',
    _search: '',
    _winners: [],

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
    },

    refresh(winners) {
        this._winners = winners || [];
        this.render();
    },

    setFilter(cat) {
        this._filter = cat;
        this.render();
    },

    setSearch(term) {
        this._search = term.toLowerCase();
        this.render();
    },

    render() {
        if (!this.container) return;
        let winners = this._winners;

        if (this._filter !== 'all') {
            winners = winners.filter(w => w.category === this._filter);
        }

        if (this._search) {
            winners = winners.filter(w =>
                w.eventName.toLowerCase().includes(this._search) ||
                w.winners.first.toLowerCase().includes(this._search)
            );
        }

        if (winners.length === 0) {
            this.container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-dim);">No winners recorded for this category yet.</div>`;
            return;
        }

        this.container.innerHTML = winners.map(w => window.WinnerRenderer.renderWinnerCard(w)).join('');
    }
};
