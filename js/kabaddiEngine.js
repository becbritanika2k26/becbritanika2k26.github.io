/**
 * KabaddiEngine - Real-time Scoring for Kabaddi
 */
import RealtimeSync from './realtimeSync.js';

window.KabaddiEngine = {
    state: null,
    _unsubscribe: null,
    history: [], // Local stack for undo

    getInitialState() {
        return {
            matchInfo: {
                teamA: {
                    name: 'Team A',
                    score: 0,
                    raidPoints: 0,
                    tacklePoints: 0,
                    bonusPoints: 0,
                    allOutPoints: 0,
                    technicalPoints: 0
                },
                teamB: {
                    name: 'Team B',
                    score: 0,
                    raidPoints: 0,
                    tacklePoints: 0,
                    bonusPoints: 0,
                    allOutPoints: 0,
                    technicalPoints: 0
                },
                status: 'LIVE', // LIVE, HALF_TIME, COMPLETED
                half: 1,
                lastEvent: null,
                timer: 1200, // 20 mins per half by default
                isTimerRunning: false,
                winner: null
            },
            timeline: []
        };
    },

    initSync(onUpdateCallback) {
        if (this._unsubscribe) this._unsubscribe();
        this._unsubscribe = RealtimeSync.subscribeDoc('settings', 'kabaddiMatch', (data) => {
            this.state = data || this.getInitialState();
            if (onUpdateCallback) onUpdateCallback(this.state);
            window.dispatchEvent(new CustomEvent('kabaddiUpdate', { detail: this.state }));
        });
    },

    async initMatch(config) {
        const newState = this.getInitialState();
        newState.matchInfo.teamA.name = config.teamA || 'Team A';
        newState.matchInfo.teamB.name = config.teamB || 'Team B';
        this.history = [];
        await this.sync(newState);
    },

    async addPoints(teamKey, type, points = 1) {
        if (!this.state || (this.state.matchInfo.status !== 'LIVE' && this.state.matchInfo.status !== 'HALF_TIME')) return;

        // Save history for undo
        this.history.push(JSON.parse(JSON.stringify(this.state)));
        if (this.history.length > 20) this.history.shift();

        const newState = JSON.parse(JSON.stringify(this.state));
        const team = newState.matchInfo[teamKey === 'A' ? 'teamA' : 'teamB'];

        team.score += points;

        if (type === 'RAID') team.raidPoints += points;
        else if (type === 'TACKLE') team.tacklePoints += points;
        else if (type === 'BONUS') team.bonusPoints += points;
        else if (type === 'ALL_OUT') team.allOutPoints += points;
        else if (type === 'TECHNICAL') team.technicalPoints += points;

        newState.matchInfo.lastEvent = `${type}_${teamKey}`;
        newState.timeline.unshift({
            timestamp: Date.now(),
            team: team.name,
            type: type,
            points: points
        });

        if (newState.timeline.length > 10) newState.timeline.pop();

        await this.sync(newState);
    },

    async toggleTimer() {
        if (!this.state) return;
        const newState = JSON.parse(JSON.stringify(this.state));
        newState.matchInfo.isTimerRunning = !newState.matchInfo.isTimerRunning;
        await this.sync(newState);
    },

    async setTimer(seconds) {
        if (!this.state) return;
        const newState = JSON.parse(JSON.stringify(this.state));
        newState.matchInfo.timer = seconds;
        await this.sync(newState);
    },

    async updateStatus(status) {
        if (!this.state) return;
        const newState = JSON.parse(JSON.stringify(this.state));
        newState.matchInfo.status = status;
        if (status === 'COMPLETED') {
            await this.saveMatchToHistory(newState);
        }
        await this.sync(newState);
    },

    async finishMatch() {
        if (!this.state) return;
        const newState = JSON.parse(JSON.stringify(this.state));

        const scoreA = newState.matchInfo.teamA.score;
        const scoreB = newState.matchInfo.teamB.score;
        let winnerName = "TIE MATCH";
        if (scoreA > scoreB) winnerName = newState.matchInfo.teamA.name;
        else if (scoreB > scoreA) winnerName = newState.matchInfo.teamB.name;

        newState.matchInfo.status = 'COMPLETED';
        newState.matchInfo.winner = winnerName;
        newState.matchInfo.isTimerRunning = false;

        await this.saveMatchToHistory(newState);
        await this.sync(newState);
    },

    async saveMatchToHistory(state) {
        try {
            // Check if match already has serious score to avoid saving empty resets
            if (state.matchInfo.teamA.score === 0 && state.matchInfo.teamB.score === 0) return;

            const winner = state.matchInfo.teamA.score > state.matchInfo.teamB.score ? state.matchInfo.teamA.name : state.matchInfo.teamB.name;
            const historyData = {
                teamA: state.matchInfo.teamA.name,
                teamB: state.matchInfo.teamB.name,
                scoreA: state.matchInfo.teamA.score,
                scoreB: state.matchInfo.teamB.score,
                winner: state.matchInfo.teamA.score === state.matchInfo.teamB.score ? "Draw" : winner,
                timestamp: Date.now()
            };
            await RealtimeSync.addToCollection('kabaddiHistory', historyData);
            console.log("Kabaddi history saved!");
        } catch (e) {
            console.error(e);
        }
    },

    async setHalf(half) {
        if (!this.state) return;
        this.history.push(JSON.parse(JSON.stringify(this.state)));
        const newState = JSON.parse(JSON.stringify(this.state));
        newState.matchInfo.half = half;
        // Reset timer for second half if needed? 
        // Optional: newState.matchInfo.timer = 1200; 
        await this.sync(newState);
    },

    async undo() {
        if (this.history.length > 0) {
            const lastState = this.history.pop();
            await this.sync(lastState);
        } else {
            alert("No more undos available!");
        }
    },

    async tick() {
        // Only one instance should tick (the admin)
        if (!this.state || !this.state.matchInfo.isTimerRunning || this.state.matchInfo.timer <= 0) return;
        const newState = JSON.parse(JSON.stringify(this.state));
        newState.matchInfo.timer--;
        if (newState.matchInfo.timer === 0) newState.matchInfo.isTimerRunning = false;
        await this.sync(newState);
    },

    async sync(state) {
        await RealtimeSync.updateDocument('settings', 'kabaddiMatch', state);
    }
};
