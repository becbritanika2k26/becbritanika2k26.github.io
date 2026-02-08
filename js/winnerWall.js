/**
 * WinnerWall - Full grid of all winners with filtering
 */

window.WinnerWall = {
    _filter: 'all',
    _search: '',

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.render();
        window.addEventListener('winnerUpdate', () => this.render());
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
        let winners = window.WinnerManager.getAll();

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
            this.container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-dim);">No winners successfully recorded for this category yet.</div>`;
            return;
        }

        this.container.innerHTML = winners.map(w => window.WinnerRenderer.renderWinnerCard(w)).join('');
    }
};
