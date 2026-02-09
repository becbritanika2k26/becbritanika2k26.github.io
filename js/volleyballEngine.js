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
                servingTeam: 'A',
                timer: 0,
                isTimerRunning: false,
                winner: null
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
                await this.saveMatchToHistory(newState);
            } else {
                newState.matchInfo.currentSetNumber++;
                newState.currentSet.teamA = 0;
                newState.currentSet.teamB = 0;
                newState.lastEvent = `SET_WON_${winnerKey}`;
            }
        }

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

    async finishMatch() {
        if (!this.state) return;
        const newState = JSON.parse(JSON.stringify(this.state));

        const setsA = newState.matchInfo.teamA.setsWon;
        const setsB = newState.matchInfo.teamB.setsWon;
        const ptsA = newState.currentSet.teamA;
        const ptsB = newState.currentSet.teamB;

        let winnerName = "TIE MATCH";
        if (setsA > setsB) winnerName = newState.matchInfo.teamA.name;
        else if (setsB > setsA) winnerName = newState.matchInfo.teamB.name;
        else {
            // If sets are tied, check current set points
            if (ptsA > ptsB) winnerName = newState.matchInfo.teamA.name;
            else if (ptsB > ptsA) winnerName = newState.matchInfo.teamB.name;
        }

        newState.matchInfo.status = 'COMPLETED';
        newState.matchInfo.winner = winnerName;
        newState.matchInfo.isTimerRunning = false;

        await this.saveMatchToHistory(newState);
        await this.sync(newState);
    },

    async saveMatchToHistory(state) {
        try {
            // Check if match has any progress to avoid saving empty resets
            const hasProgress = state.matchInfo.teamA.setsWon > 0 ||
                state.matchInfo.teamB.setsWon > 0 ||
                state.currentSet.teamA > 0 ||
                state.currentSet.teamB > 0;

            if (!hasProgress) return;

            // Determine winner: Use state winner if set, or calculate from sets, or calculate from points
            let winnerName = state.matchInfo.winner;
            if (!winnerName) {
                if (state.matchInfo.teamA.setsWon > state.matchInfo.teamB.setsWon) {
                    winnerName = state.matchInfo.teamA.name;
                } else if (state.matchInfo.teamB.setsWon > state.matchInfo.teamA.setsWon) {
                    winnerName = state.matchInfo.teamB.name;
                } else {
                    // Equal sets, check current set points
                    if (state.currentSet.teamA > state.currentSet.teamB) winnerName = state.matchInfo.teamA.name;
                    else if (state.currentSet.teamB > state.currentSet.teamA) winnerName = state.matchInfo.teamB.name;
                    else winnerName = "TIE MATCH";
                }
            }

            const historyData = {
                teamA: state.matchInfo.teamA.name,
                teamB: state.matchInfo.teamB.name,
                scoreA: state.matchInfo.teamA.setsWon,
                scoreB: state.matchInfo.teamB.setsWon,
                currentSetScore: `${state.currentSet.teamA}-${state.currentSet.teamB}`,
                winner: winnerName,
                timestamp: Date.now()
            };
            await RealtimeSync.addToCollection('volleyballHistory', historyData);
            console.log("Volleyball history saved!");
        } catch (e) {
            console.error("Volleyball Save Error:", e);
        }
    },

    async undo() {
        // Simple undo could be implemented if needed
    },

    async tick() {
        if (!this.state || !this.state.matchInfo.isTimerRunning) return;
        const newState = JSON.parse(JSON.stringify(this.state));
        newState.matchInfo.timer++; // Volleyball timer usually counts UP
        await this.sync(newState);
    },

    async setServing(team) {
        if (!this.state) return;
        const newState = JSON.parse(JSON.stringify(this.state));
        newState.matchInfo.servingTeam = team;
        await this.sync(newState);
    },

    async sync(state) {
        await RealtimeSync.updateDocument('settings', 'volleyballMatch', state);
    }
};
