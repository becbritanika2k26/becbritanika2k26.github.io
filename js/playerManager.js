/**
 * PlayerManager - Manages squad lists and player-specific stats
 */
class PlayerManager {
    constructor() {
        this.squadA = [];
        this.squadB = [];
        this.activeStriker = null;
        this.activeNonStriker = null;
        this.activeBowler = null;
    }

    addPlayerToSquad(name, team) {
        const player = this.createPlayer(name, team);
        if (team === 'A') this.squadA.push(player);
        else this.squadB.push(player);
        this.save();
    }

    createPlayer(name, team) {
        return {
            id: Date.now() + Math.random(),
            name: name,
            team: team,
            batting: { runs: 0, balls: 0, fours: 0, sixes: 0, out: false, sr: 0 },
            bowling: { overs: 0, balls: 0, runs: 0, wickets: 0, econ: 0 }
        };
    }

    setPlayingXI(team, names) {
        const players = names.map(n => this.createPlayer(n, team));
        if (team === 'A') this.squadA = players;
        else this.squadB = players;
        this.save();
    }

    save() {
        localStorage.setItem('britanika_squads', JSON.stringify({
            squadA: this.squadA,
            squadB: this.squadB
        }));
    }

    load() {
        const data = localStorage.getItem('britanika_squads');
        if (data) {
            const parsed = JSON.parse(data);
            this.squadA = parsed.squadA;
            this.squadB = parsed.squadB;
        }
    }
}

export default new PlayerManager();
