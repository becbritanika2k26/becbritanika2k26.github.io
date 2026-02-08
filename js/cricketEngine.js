/**
 * CricketEngine - Core logic (Advanced Version)
 */
window.CricketEngine = {
    state: null,
    history: [],

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
                lastEvent: null // For animations: 'FOUR', 'SIX', 'WICKET', 'CENTURY'
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

    initMatch(config) {
        this.state = this.getInitialState();
        this.state.matchInfo.teamA.name = config.teamA;
        this.state.matchInfo.teamB.name = config.teamB;
        this.state.matchInfo.totalOvers = config.totalOvers;
        this.state.matchInfo.battingFirst = config.battingFirst;
        this.history = [];
        this.save();
    },

    setActivePlayers(striker, nonStriker, bowler) {
        if (!this.state) this.load();
        if (striker) this.state.batting.striker.name = striker;
        if (nonStriker) this.state.batting.nonStriker.name = nonStriker;
        if (bowler) this.state.bowling.currentBowler.name = bowler;
        this.save();
    },

    addBall(type, runs = 0) {
        if (!this.state || this.state.matchInfo.status !== 'LIVE') return;

        // Save history for UNDO
        this.history.push(JSON.parse(JSON.stringify(this.state)));
        if (this.history.length > 20) this.history.shift();

        const { teamA, teamB, battingFirst, currentInnings } = this.state.matchInfo;
        const curKey = (battingFirst === teamA.name) ? (currentInnings === 1 ? 'teamA' : 'teamB') : (currentInnings === 1 ? 'teamB' : 'teamA');
        const team = this.state.matchInfo[curKey];

        this.state.matchInfo.lastEvent = null; // Reset

        if (type === 'RUNS') {
            team.score += runs; team.balls++;
            this.state.batting.striker.runs += runs; this.state.batting.striker.balls++;
            this.state.bowling.currentBowler.runs += runs; this.state.bowling.currentBowler.balls++;
            this.state.recentBalls.push(runs);

            if (runs === 4) { this.state.matchInfo.lastEvent = 'FOUR'; this.state.batting.striker.fours++; }
            if (runs === 6) { this.state.matchInfo.lastEvent = 'SIX'; this.state.batting.striker.sixes++; }

            // Check Century/Half-Century (simplified trigger)
            if (this.state.batting.striker.runs === 50) this.state.matchInfo.lastEvent = 'FIFTY';
            if (this.state.batting.striker.runs === 100) this.state.matchInfo.lastEvent = 'CENTURY';

            if (runs % 2 !== 0) this.rotateStrike();
        } else if (type === 'WICKET') {
            team.wickets++; team.balls++;
            this.state.batting.striker.balls++;
            this.state.bowling.currentBowler.wickets++;
            this.state.bowling.currentBowler.balls++;
            this.state.recentBalls.push('W');
            this.state.matchInfo.lastEvent = 'WICKET';

            // Add to scorecard
            team.scorecard.push({
                name: this.state.batting.striker.name,
                runs: this.state.batting.striker.runs,
                balls: this.state.batting.striker.balls,
                outType: 'Out'
            });

            // Reset striker for next player
            this.state.batting.striker = { name: 'New Batsman', runs: 0, balls: 0, fours: 0, sixes: 0 };
        } else if (type === 'WIDE') {
            team.score += (1 + runs); this.state.bowling.currentBowler.runs += (1 + runs);
            this.state.recentBalls.push('WD');
        } else if (type === 'NO_BALL') {
            team.score += (1 + runs); this.state.batting.striker.runs += runs;
            this.state.bowling.currentBowler.runs += (1 + runs); this.state.recentBalls.push('NB');
        }

        // Over Complete
        if (team.balls % 6 === 0 && team.balls > 0 && type !== 'WIDE' && type !== 'NO_BALL') {
            this.rotateStrike();
        }

        // --- THE FIX: End Innings if All Out (10 wickets) OR Overs completed ---
        const maxBalls = this.state.matchInfo.totalOvers * 6;

        // 1. Check for 2nd innings win
        if (this.state.matchInfo.currentInnings === 2 && team.score >= this.state.matchInfo.target) {
            this.state.matchInfo.status = 'COMPLETED';
            this.state.matchInfo.lastEvent = 'WIN';
        }
        // 2. Check for innings end (Overs OR Wickets)
        else if (team.balls >= maxBalls || team.wickets >= 10) {
            if (this.state.matchInfo.currentInnings === 1) {
                this.state.matchInfo.status = 'BREAK';
                this.state.matchInfo.lastEvent = 'INNINGS_END';
            } else {
                this.state.matchInfo.status = 'COMPLETED';
                this.state.matchInfo.lastEvent = 'WIN';
            }
        }

        this.save();
    },

    startNextInnings() {
        if (this.state.matchInfo.currentInnings === 1) {
            const scoringTeamKey = (this.state.matchInfo.battingFirst === this.state.matchInfo.teamA.name) ? 'teamA' : 'teamB';

            // Add remaining batsman to scorecard before switching
            const team = this.state.matchInfo[scoringTeamKey];
            team.scorecard.push({ name: this.state.batting.striker.name, runs: this.state.batting.striker.runs, balls: this.state.batting.striker.balls, outType: 'Not Out' });
            team.scorecard.push({ name: this.state.batting.nonStriker.name, runs: this.state.batting.nonStriker.runs, balls: this.state.batting.nonStriker.balls, outType: 'Not Out' });

            this.state.matchInfo.currentInnings = 2;
            this.state.matchInfo.status = 'LIVE';
            this.state.matchInfo.target = team.score + 1;
            this.state.recentBalls = [];
            this.state.batting.striker = { name: 'Striker', runs: 0, balls: 0, fours: 0, sixes: 0 };
            this.state.batting.nonStriker = { name: 'Non-Striker', runs: 0, balls: 0, fours: 0, sixes: 0 };
            this.state.bowling.currentBowler = { name: 'Bowler', runs: 0, wickets: 0, balls: 0 };
            this.save();
        }
    },

    rotateStrike() {
        const temp = JSON.parse(JSON.stringify(this.state.batting.striker));
        this.state.batting.striker = this.state.batting.nonStriker;
        this.state.batting.nonStriker = temp;
    },

    undo() { if (this.history.length > 0) { this.state = this.history.pop(); this.save(); } },
    save() { window.StorageManager.saveMatchState(this.state); },
    load() {
        const s = window.StorageManager.getMatchState();
        if (s) this.state = s;
        else this.state = this.getInitialState();
        return this.state;
    }
};
