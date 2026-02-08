/**
 * CricketEngine - Core logic (Cloud-Synced Version)
 */

// Note: This file is now intended to be used as a module
import RealtimeSync from './realtimeSync.js';

window.CricketEngine = {
    state: null,
    history: [],
    _unsubscribe: null,

    getInitialState() {
        return {
            matchInfo: {
                teamA: { name: 'Team A', score: 0, wickets: 0, balls: 0, scorecard: [] },
                teamB: { name: 'Team B', score: 0, wickets: 0, balls: 0, scorecard: [] },
                totalOvers: 10,
                battingFirst: '',
                currentInnings: 1,
                target: null,
                status: 'LIVE',
                lastEvent: null
            },
            batting: {
                striker: { name: 'Striker', runs: 0, balls: 0, fours: 0, sixes: 0 },
                nonStriker: { name: 'Non-Striker', runs: 0, balls: 0, fours: 0, sixes: 0 },
            },
            bowling: {
                currentBowler: { name: 'Bowler', runs: 0, wickets: 0, balls: 0 },
            },
            recentBalls: [],
        };
    },

    /**
     * Start listening to cloud updates
     */
    initSync(onUpdateCallback) {
        if (this._unsubscribe) this._unsubscribe();
        this._unsubscribe = RealtimeSync.subscribeDoc('settings', 'cricketMatch', (data) => {
            this.state = data || this.getInitialState();
            if (onUpdateCallback) onUpdateCallback(this.state);
            // Dispatch global event for non-module components
            window.dispatchEvent(new CustomEvent('cricketUpdate', { detail: this.state }));
        });
    },

    async initMatch(config) {
        const newState = this.getInitialState();
        newState.matchInfo.teamA.name = config.teamA;
        newState.matchInfo.teamB.name = config.teamB;
        newState.matchInfo.totalOvers = config.totalOvers;
        newState.matchInfo.battingFirst = config.battingFirst;
        this.history = [];
        await this.syncToCloud(newState);
    },

    async setActivePlayers(striker, nonStriker, bowler) {
        if (!this.state) return;
        const newState = JSON.parse(JSON.stringify(this.state));
        if (striker) newState.batting.striker.name = striker;
        if (nonStriker) newState.batting.nonStriker.name = nonStriker;
        if (bowler) newState.bowling.currentBowler.name = bowler;
        await this.syncToCloud(newState);
    },

    async addBall(type, runs = 0) {
        if (!this.state || this.state.matchInfo.status !== 'LIVE') return;

        // Save history for local UNDO (optional, cloud doesn't easily support undo without versions)
        this.history.push(JSON.parse(JSON.stringify(this.state)));
        if (this.history.length > 20) this.history.shift();

        const newState = JSON.parse(JSON.stringify(this.state));
        const { teamA, teamB, battingFirst, currentInnings } = newState.matchInfo;
        const curKey = (battingFirst === teamA.name) ? (currentInnings === 1 ? 'teamA' : 'teamB') : (currentInnings === 1 ? 'teamB' : 'teamA');
        const team = newState.matchInfo[curKey];

        newState.matchInfo.lastEvent = null;

        if (type === 'RUNS') {
            team.score += runs; team.balls++;
            newState.batting.striker.runs += runs; newState.batting.striker.balls++;
            newState.bowling.currentBowler.runs += runs; newState.bowling.currentBowler.balls++;
            newState.recentBalls.push(runs);

            if (runs === 4) { newState.matchInfo.lastEvent = 'FOUR'; newState.batting.striker.fours++; }
            if (runs === 6) { newState.matchInfo.lastEvent = 'SIX'; newState.batting.striker.sixes++; }

            if (newState.batting.striker.runs === 50) newState.matchInfo.lastEvent = 'FIFTY';
            if (newState.batting.striker.runs === 100) newState.matchInfo.lastEvent = 'CENTURY';

            if (runs % 2 !== 0) {
                const temp = newState.batting.striker;
                newState.batting.striker = newState.batting.nonStriker;
                newState.batting.nonStriker = temp;
            }
        } else if (type === 'WICKET') {
            team.wickets++; team.balls++;
            newState.batting.striker.balls++;
            newState.bowling.currentBowler.wickets++;
            newState.bowling.currentBowler.balls++;
            newState.recentBalls.push('W');
            newState.matchInfo.lastEvent = 'WICKET';

            team.scorecard.push({
                name: newState.batting.striker.name,
                runs: newState.batting.striker.runs,
                balls: newState.batting.striker.balls,
                outType: 'Out'
            });

            newState.batting.striker = { name: 'New Batsman', runs: 0, balls: 0, fours: 0, sixes: 0 };
        } else if (type === 'WIDE') {
            team.score += (1 + runs); newState.bowling.currentBowler.runs += (1 + runs);
            newState.recentBalls.push('WD');
        } else if (type === 'NO_BALL') {
            team.score += (1 + runs); newState.batting.striker.runs += runs;
            newState.bowling.currentBowler.runs += (1 + runs); newState.recentBalls.push('NB');
        }

        if (team.balls % 6 === 0 && team.balls > 0 && type !== 'WIDE' && type !== 'NO_BALL') {
            const temp = newState.batting.striker;
            newState.batting.striker = newState.batting.nonStriker;
            newState.batting.nonStriker = temp;
        }

        const maxBalls = newState.matchInfo.totalOvers * 6;
        if (newState.matchInfo.currentInnings === 2 && team.score >= newState.matchInfo.target) {
            newState.matchInfo.status = 'COMPLETED';
            newState.matchInfo.lastEvent = 'WIN';
        }
        else if (team.balls >= maxBalls || team.wickets >= 10) {
            if (newState.matchInfo.currentInnings === 1) {
                newState.matchInfo.status = 'BREAK';
                newState.matchInfo.lastEvent = 'INNINGS_END';
            } else {
                newState.matchInfo.status = 'COMPLETED';
                newState.matchInfo.lastEvent = 'WIN';
            }
        }

        await this.syncToCloud(newState);
    },

    async startNextInnings() {
        if (!this.state || this.state.matchInfo.currentInnings !== 1) return;
        const newState = JSON.parse(JSON.stringify(this.state));
        const scoringTeamKey = (newState.matchInfo.battingFirst === newState.matchInfo.teamA.name) ? 'teamA' : 'teamB';

        const team = newState.matchInfo[scoringTeamKey];
        team.scorecard.push({ name: newState.batting.striker.name, runs: newState.batting.striker.runs, balls: newState.batting.striker.balls, outType: 'Not Out' });
        team.scorecard.push({ name: newState.batting.nonStriker.name, runs: newState.batting.nonStriker.runs, balls: newState.batting.nonStriker.balls, outType: 'Not Out' });

        newState.matchInfo.currentInnings = 2;
        newState.matchInfo.status = 'LIVE';
        newState.matchInfo.target = team.score + 1;
        newState.recentBalls = [];
        newState.batting.striker = { name: 'Striker', runs: 0, balls: 0, fours: 0, sixes: 0 };
        newState.batting.nonStriker = { name: 'Non-Striker', runs: 0, balls: 0, fours: 0, sixes: 0 };
        newState.bowling.currentBowler = { name: 'Bowler', runs: 0, wickets: 0, balls: 0 };

        await this.syncToCloud(newState);
    },

    async undo() {
        if (this.history.length > 0) {
            const lastState = this.history.pop();
            await this.syncToCloud(lastState);
        }
    },

    async syncToCloud(state) {
        await RealtimeSync.updateDocument('settings', 'cricketMatch', state);
    }
};
