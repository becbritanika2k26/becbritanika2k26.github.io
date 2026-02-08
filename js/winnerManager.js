/**
 * WinnerManager - Data handling for the Universal Winner System
 * BEC Britanika 2K26
 */

window.WinnerManager = {
    _key: 'britanika_winners',

    getAll() {
        const raw = localStorage.getItem(this._key);
        if (!raw) return [];
        try {
            return JSON.parse(raw).sort((a, b) => b.timestamp - a.timestamp);
        } catch (e) {
            return [];
        }
    },

    save(winners) {
        localStorage.setItem(this._key, JSON.stringify(winners));
        // Dispatch event for real-time updates across tabs if needed
        window.dispatchEvent(new Event('winnerUpdate'));
    },

    addWinner(data) {
        const winners = this.getAll();
        const newEntry = {
            id: 'win-' + Date.now(),
            timestamp: Date.now(),
            isNew: true,
            ...data
        };
        winners.unshift(newEntry);
        this.save(winners);

        // Notify popup system
        if (window.WinnerPopup) window.WinnerPopup.trigger(newEntry);
        return newEntry;
    },

    updateWinner(id, data) {
        let winners = this.getAll();
        const index = winners.findIndex(w => w.id === id);
        if (index !== -1) {
            winners[index] = { ...winners[index], ...data, timestamp: Date.now() };
            this.save(winners);
        }
    },

    deleteWinner(id) {
        let winners = this.getAll();
        winners = winners.filter(w => w.id !== id);
        this.save(winners);
    },

    resetAll() {
        this.save([]);
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
