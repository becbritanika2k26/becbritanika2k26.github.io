/**
 * VolleyballEngine - Real-time Scoring for Volleyball
 */
import RealtimeSync from './realtimeSync.js';

window.VolleyballEngine = {
    state: null,
    _unsubscribe: null,

    getInitialState() {
        return {
            matchInfo: {
                teamA: { name: 'Team A', setsWon: 0 },
                teamB: { name: 'Team B', setsWon: 0 },
                totalSets: 3,
                status: 'LIVE', // LIVE, COMPLETED
                currentSetNumber: 1,
                servingTeam: 'A'
            },
            currentSet: {
                teamA: 0,
                teamB: 0
            },
            history: [], // Previous sets: [{set: 1, teamA: 25, teamB: 20}]
            lastEvent: null
        };
    },

    initSync(onUpdateCallback) {
        if (this._unsubscribe) this._unsubscribe();
        this._unsubscribe = RealtimeSync.subscribeDoc('settings', 'volleyballMatch', (data) => {
            this.state = data || this.getInitialState();
            if (onUpdateCallback) onUpdateCallback(this.state);
            window.dispatchEvent(new CustomEvent('volleyballUpdate', { detail: this.state }));
        });
    },

    async initMatch(config) {
        const newState = this.getInitialState();
        newState.matchInfo.teamA.name = config.teamA || 'Team A';
        newState.matchInfo.teamB.name = config.teamB || 'Team B';
        newState.matchInfo.totalSets = config.totalSets || 3;
        await this.sync(newState);
    },

    async addPoint(teamKey) {
        if (!this.state || this.state.matchInfo.status !== 'LIVE') return;
        const newState = JSON.parse(JSON.stringify(this.state));

        newState.currentSet[teamKey === 'A' ? 'teamA' : 'teamB']++;
        newState.matchInfo.servingTeam = teamKey;
        newState.lastEvent = `POINT_${teamKey}`;

        // Auto end set logic (typical 25 points, win by 2)
        const scoreA = newState.currentSet.teamA;
        const scoreB = newState.currentSet.teamB;
        const isTieBreak = newState.matchInfo.currentSetNumber === newState.matchInfo.totalSets;
        const setLimit = isTieBreak ? 15 : 25;

        if ((scoreA >= setLimit || scoreB >= setLimit) && Math.abs(scoreA - scoreB) >= 2) {
            // Set finished
            const winnerKey = scoreA > scoreB ? 'A' : 'B';
            newState.matchInfo[winnerKey === 'A' ? 'teamA' : 'teamB'].setsWon++;
            newState.history.push({
                set: newState.matchInfo.currentSetNumber,
                teamA: scoreA,
                teamB: scoreB
            });

            if (newState.matchInfo[winnerKey === 'A' ? 'teamA' : 'teamB'].setsWon > newState.matchInfo.totalSets / 2) {
                newState.matchInfo.status = 'COMPLETED';
                newState.lastEvent = `MATCH_WON_${winnerKey}`;
            } else {
                newState.matchInfo.currentSetNumber++;
                newState.currentSet.teamA = 0;
                newState.currentSet.teamB = 0;
                newState.lastEvent = `SET_WON_${winnerKey}`;
            }
        }

        await this.sync(newState);
    },

    async undo() {
        // Simple undo could be implemented with a local history stack similar to CricketEngine
    },

    async setServing(team) {
        const newState = JSON.parse(JSON.stringify(this.state));
        newState.matchInfo.servingTeam = team;
        await this.sync(newState);
    },

    async sync(state) {
        await RealtimeSync.updateDocument('settings', 'volleyballMatch', state);
    }
};
