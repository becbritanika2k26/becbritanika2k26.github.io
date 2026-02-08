/**
 * KabaddiEngine - Real-time Scoring for Kabaddi
 */
import RealtimeSync from './realtimeSync.js';

window.KabaddiEngine = {
    state: null,
    _unsubscribe: null,

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
        await this.sync(newState);
    },

    async addPoints(teamKey, type, points = 1) {
        if (!this.state || this.state.matchInfo.status !== 'LIVE') return;
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
        const newState = JSON.parse(JSON.stringify(this.state));
        newState.matchInfo.status = status;
        await this.sync(newState);
    },

    async setHalf(half) {
        const newState = JSON.parse(JSON.stringify(this.state));
        newState.matchInfo.half = half;
        await this.sync(newState);
    },

    async sync(state) {
        await RealtimeSync.updateDocument('settings', 'kabaddiMatch', state);
    }
};
