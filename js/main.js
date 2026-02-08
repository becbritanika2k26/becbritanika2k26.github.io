/**
 * main.js - Central Website Logic for BEC Britanika 2K26
 */

window.mainController = {
    isReady: false,

    async init() {
        // Wait for EventManager to have data
        const checkReady = () => {
            if (window.EventManager && window.EventManager._events.length > 0) {
                this.isReady = true;
                this.onManagerReady();
            } else {
                setTimeout(checkReady, 100);
            }
        };
        checkReady();

        // Standard listeners
        document.addEventListener('DOMContentLoaded', () => {
            this.setupMobileMenu();
            if (window.checkLiveMatch) window.checkLiveMatch();
        });
    },

    onManagerReady() {
        console.log("MainController: Manager Ready, initial rendering...");
        // Auto-run rendering if containers exist
        this.autoRender();
    },

    autoRender() {
        const containers = {
            'sports-container': 'sports',
            'cultural-container': 'cultural',
            'other-events-container': 'other-events'
        };

        Object.keys(containers).forEach(id => {
            const el = document.getElementById(id);
            if (el) this.renderCards(id, containers[id]);
        });
    },

    renderCards(containerId, category) {
        if (!this.isReady) {
            setTimeout(() => this.renderCards(containerId, category), 200);
            return;
        }

        const events = window.EventManager.getEvents().filter(e =>
            e.category === category ||
            (e._source && e._source === category) ||
            e.category.toLowerCase().includes(category.toLowerCase())
        );

        const container = document.getElementById(containerId);
        if (container) {
            if (events.length === 0) {
                container.innerHTML = `<div class="card" style="grid-column: 1/-1; text-align: center;">No events scheduled in this category yet.</div>`;
            } else {
                container.innerHTML = events.map(e => window.Renderer.renderEventCard(e)).join('');
            }
        }
    },

    setupMobileMenu() {
        const btn = document.querySelector('.mobile-menu-btn');
        const nav = document.querySelector('.nav-links');
        if (btn && nav) {
            btn.onclick = () => nav.classList.toggle('active');
        }
    }
};

/**
 * GLOBAL FUNCTIONS (To support old inline HTML calls)
 */
window.renderCards = (containerId, category) => window.mainController.renderCards(containerId, category);

window.openEventDetail = (id) => {
    const event = window.EventManager.getEventById(id);
    if (!event) return;

    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    if (!overlay || !content) return;

    content.innerHTML = `
        <span class="modal-close" onclick="closeEventModal()">&times;</span>
        <div class="modal-header-img">
            <img src="${event.image}" onerror="this.src='assets/default-event.png'" style="width: 100%; height: 250px; object-fit: cover; border-radius: 12px; margin-bottom: 20px;">
        </div>
        <h2 style="color: var(--primary); margin-bottom: 5px;">${event.name}</h2>
        <div style="display: flex; gap: 15px; font-size: 0.9rem; margin-bottom: 20px; color: var(--text-dim);">
            <span><i class="far fa-calendar-alt"></i> ${event.date}</span>
            <span><i class="far fa-clock"></i> ${event.time}</span>
            <span><i class="fas fa-map-marker-alt"></i> ${event.venue}</span>
        </div>
        <div class="modal-body" style="line-height: 1.6;">
            <h3>Event Description</h3>
            <p>Join us for the ${event.name} at BEC Britanika 2K26. Experience the competition and spirit of excellence.</p>
            
            ${event.participants && event.participants.length > 0 ? `
                <h3 style="margin-top: 20px;">Participants</h3>
                <ul style="padding-left: 20px; color: var(--text-dim);">
                    ${event.participants.map(p => `<li>${p}</li>`).join('')}
                </ul>
            ` : ''}

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                 <button class="btn btn-primary" onclick="window.print()">Download Schedule</button>
            </div>
        </div>
    `;
    overlay.style.display = 'flex';
};

window.closeEventModal = () => {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.style.display = 'none';
};

// Start
// -----------------------------------------------------------------
// COUNTDOWN TIMER
// -----------------------------------------------------------------
function initCountdown() {
    const countdown = () => {
        const targetRaw = localStorage.getItem('bec_britanika_target_date') || 'February 7, 2026 09:00:00';
        const countDate = new Date(targetRaw).getTime();
        const now = new Date().getTime();
        const gap = countDate - now;

        const second = 1000, minute = second * 60, hour = minute * 60, day = hour * 24;

        if (gap < 0) {
            if (document.getElementById('days')) {
                document.getElementById('days').innerText = '00';
                document.getElementById('hours').innerText = '00';
                document.getElementById('minutes').innerText = '00';
                document.getElementById('seconds').innerText = '00';
            }
            return;
        }

        const d = Math.floor(gap / day);
        const h = Math.floor((gap % day) / hour);
        const m = Math.floor((gap % hour) / minute);
        const s = Math.floor((gap % minute) / second);

        if (document.getElementById('days')) {
            document.getElementById('days').innerText = d < 10 ? '0' + d : d;
            document.getElementById('hours').innerText = h < 10 ? '0' + h : h;
            document.getElementById('minutes').innerText = m < 10 ? '0' + m : m;
            document.getElementById('seconds').innerText = s < 10 ? '0' + s : s;
        }
    };
    setInterval(countdown, 1000);
    countdown();
}

window.mainController.init();
document.addEventListener('DOMContentLoaded', initCountdown);
let demoInterval = null;
window.toggleDemoMode = () => {
    const btn = document.getElementById('demo-btn-text');
    if (demoInterval) {
        clearInterval(demoInterval);
        demoInterval = null;
        if (btn) { btn.innerText = "Start Simulation"; btn.classList.remove('btn-danger'); }
        alert("Simulation Stopped.");
    } else {
        const demoState = {
            matchInfo: { teamA: { name: 'BEC KINGS', score: 0, wickets: 0, balls: 0, scorecard: [] }, teamB: { name: 'TECH GIANTS', score: 0, wickets: 0, balls: 0, scorecard: [] }, totalOvers: 5, battingFirst: 'BEC KINGS', currentInnings: 1, status: 'LIVE' },
            batting: { striker: { name: 'Demo King', runs: 0, balls: 0 }, nonStriker: { name: 'Pro Batsman', runs: 0, balls: 0 } },
            bowling: { currentBowler: { name: 'Rocket Bowler', runs: 0, wickets: 0, balls: 0 } },
            recentBalls: [],
        };
        localStorage.setItem('britanika_current_match', JSON.stringify(demoState));
        demoInterval = setInterval(() => {
            let data = JSON.parse(localStorage.getItem('britanika_current_match'));
            const options = [0, 1, 2, 4, 6, 'W'];
            const res = options[Math.floor(Math.random() * options.length)];
            const team = data.matchInfo.teamA;
            if (res === 'W') { team.wickets++; team.balls++; data.matchInfo.lastEvent = 'WICKET'; data.recentBalls.push('W'); }
            else {
                const r = typeof res === 'number' ? res : 0;
                team.score += r; team.balls++; data.batting.striker.runs += r;
                data.recentBalls.push(res); if (r === 4) data.matchInfo.lastEvent = 'FOUR'; if (r === 6) data.matchInfo.lastEvent = 'SIX';
            }
            if (data.recentBalls.length > 6) data.recentBalls.shift();
            localStorage.setItem('britanika_current_match', JSON.stringify(data));
            if (window.checkLiveMatch) window.checkLiveMatch();
        }, 3000);
        if (btn) { btn.innerText = "Running..."; btn.classList.add('btn-danger'); }
    }
};

window.checkLiveMatch = () => {
    const raw = localStorage.getItem('britanika_current_match');
    const heroIndicator = document.getElementById('live-indicator-hero');
    const hubIndicator = document.getElementById('hub-live-status');
    if (raw) {
        const state = JSON.parse(raw);
        if (state.matchInfo && state.matchInfo.status === 'LIVE') {
            const { teamA, teamB, currentInnings } = state.matchInfo;
            const curTeam = (state.matchInfo.battingFirst === teamA.name) ? (currentInnings === 1 ? teamA : teamB) : (currentInnings === 1 ? teamB : teamA);
            const scoreText = `${teamA.name} vs ${teamB.name} | ${curTeam.score}/${curTeam.wickets}`;
            if (heroIndicator) { heroIndicator.style.display = 'flex'; const txt = heroIndicator.querySelector('.live-match-text'); if (txt) txt.innerText = scoreText; }
            if (hubIndicator) { hubIndicator.innerHTML = `<span class="status-badge status-live" style="font-size: 0.6rem;">LIVE: ${scoreText}</span>`; }
            return;
        }
    }
    if (heroIndicator) heroIndicator.style.display = 'none';
    if (hubIndicator) hubIndicator.innerHTML = '';
};
