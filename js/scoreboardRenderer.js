/**
 * ScoreboardRenderer - Updates the DOM based on match state
 */
class ScoreboardRenderer {
    constructor() {
        this.selectors = {
            mainScore: '#main-score-display',
            teamAName: '#team-a-name',
            teamBName: '#team-b-name',
            overs: '#current-overs',
            recentBalls: '#recent-balls-container',
            strikerName: '#striker-name',
            strikerRuns: '#striker-runs',
            nonStrikerName: '#non-striker-name',
            nonStrikerRuns: '#non-striker-runs',
            bowlerName: '#bowler-name',
            bowlerStats: '#bowler-stats',
            bowlerEcon: '#bowler-econ',
            matchStatus: '#match-status-badge',
            target: '#target-info',
            rrInfo: '#rr-info'
        };
    }

    render(state) {
        if (!state) return;

        const { teamA, teamB, currentInnings, target, status, totalOvers } = state.matchInfo;

        this.updateText(this.selectors.teamAName, teamA.name);
        this.updateText(this.selectors.teamBName, teamB.name);

        const currentTeam = currentInnings === 1
            ? (state.matchInfo.battingFirst === teamA.name ? teamA : teamB)
            : (state.matchInfo.battingFirst === teamA.name ? teamB : teamA);

        this.updateText(this.selectors.mainScore, `${currentTeam.score}/${currentTeam.wickets}`);
        this.updateText(this.selectors.overs, this.formatOvers(currentTeam.balls));

        // Batsmen Stats
        const striker = state.batting.striker;
        const nonStriker = state.batting.nonStriker;
        this.updateText(this.selectors.strikerName, striker.name + '*');
        this.updateText(this.selectors.strikerRuns, `${striker.runs} (${striker.balls})`);
        this.updateText(this.selectors.nonStrikerName, nonStriker.name);
        this.updateText(this.selectors.nonStrikerRuns, `${nonStriker.runs} (${nonStriker.balls})`);

        // Bowler Stats
        const bowler = state.bowling.currentBowler;
        this.updateText(this.selectors.bowlerName, bowler.name);
        this.updateText(this.selectors.bowlerStats, `${bowler.wickets}-${bowler.runs} (${this.formatOvers(bowler.balls)})`);

        const econ = bowler.balls > 0 ? ((bowler.runs / bowler.balls) * 6).toFixed(2) : '0.00';
        this.updateText(this.selectors.bowlerEcon, `ECON: ${econ}`);

        // CRR Calculation
        const crr = currentTeam.balls > 0 ? ((currentTeam.score / currentTeam.balls) * 6).toFixed(2) : '0.00';

        // Target info & RRR
        if (target) {
            const remRuns = target - currentTeam.score;
            const maxBalls = totalOvers * 6;
            const remBalls = Math.max(0, maxBalls - currentTeam.balls);
            const rrr = remBalls > 0 ? ((remRuns / remBalls) * 6).toFixed(2) : '0.00';

            this.updateText(this.selectors.target, `TARGET: ${target} | NEED ${remRuns} OF ${remBalls}`);
            this.updateText(this.selectors.rrInfo, `CRR: ${crr} | RRR: ${rrr}`);
        } else {
            this.updateText(this.selectors.rrInfo, `CRR: ${crr}`);
            this.updateText(this.selectors.target, `1ST INNINGS`);
        }

        // Recent Balls
        this.renderRecentBalls(state.recentBalls);

        // Match status
        const statusBadge = document.querySelector(this.selectors.matchStatus);
        if (statusBadge) {
            statusBadge.innerText = status;
            statusBadge.className = `status-badge ${status.toLowerCase()}`;
        }
    }

    renderRecentBalls(balls = []) {
        const container = document.querySelector(this.selectors.recentBalls);
        if (!container) return;

        container.innerHTML = '';
        const displayBalls = balls.slice(-6);
        displayBalls.forEach(ball => {
            const dot = document.createElement('div');
            dot.className = `ball-dot ${this.getBallClass(ball)}`;
            dot.innerText = ball;
            container.appendChild(dot);
        });
    }

    getBallClass(val) {
        if (val === 4) return 'four';
        if (val === 6) return 'six';
        if (val === 'W') return 'wicket';
        if (['WD', 'NB', 'LB'].includes(val)) return 'extra';
        return 'normal';
    }

    formatOvers(balls) {
        const completes = Math.floor(balls / 6);
        const remaining = balls % 6;
        return `${completes}.${remaining}`;
    }

    updateText(selector, text) {
        const el = document.querySelector(selector);
        if (el && el.innerText !== String(text)) {
            el.innerText = text;
            el.classList.add('updated-pulse');
            setTimeout(() => el.classList.remove('updated-pulse'), 500);
        }
    }
}

export default new ScoreboardRenderer();
