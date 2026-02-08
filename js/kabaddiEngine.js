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
                lastEvent: null
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

    async updateStatus(status) {
        this.history.push(JSON.parse(JSON.stringify(this.state)));
        const newState = JSON.parse(JSON.stringify(this.state));
        newState.matchInfo.status = status;
        if (status === 'COMPLETED') {
            await this.saveMatchToHistory(newState);
        }
        await this.sync(newState);
    },

    async saveMatchToHistory(state) {
        try {
            const winner = state.matchInfo.teamA.score > state.matchInfo.teamB.score ? state.matchInfo.teamA.name : state.matchInfo.teamB.name;
            const historyData = {
                teamA: state.matchInfo.teamA.name,
                teamB: state.matchInfo.teamB.name,
                scoreA: state.matchInfo.teamA.score,
                scoreB: state.matchInfo.teamB.score,
                winner: winner,
                timestamp: Date.now()
            };
            await RealtimeSync.addToCollection('kabaddiHistory', historyData);
            console.log("Kabaddi history saved!");
        } catch (e) {
            console.error(e);
        }
    },

    async setHalf(half) {
        this.history.push(JSON.parse(JSON.stringify(this.state)));
        const newState = JSON.parse(JSON.stringify(this.state));
        newState.matchInfo.half = half;
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

    async sync(state) {
        await RealtimeSync.updateDocument('settings', 'kabaddiMatch', state);
    }
};
