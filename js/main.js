/**
 * main.js - Central Website Logic for BEC Britanika 2K26 (Cloud Synced)
 */

window.mainController = {
    isReady: false,

    async init() {
        // Wait for Cloud Sync or fallback
        const checkReady = () => {
            if (window.EventEngine && Object.keys(window.EventEngine.events).length >= 0) {
                this.isReady = true;
                this.onManagerReady();
            } else {
                setTimeout(checkReady, 500);
            }
        };
        checkReady();

        document.addEventListener('DOMContentLoaded', () => {
            this.setupMobileMenu();
        });

        // Listen for cloud events instead of polling
        window.addEventListener('eventsUpdate', () => this.autoRender());
        window.addEventListener('cricketUpdate', (e) => this.checkLiveMatch(e.detail));
        window.addEventListener('settingsUpdate', (e) => this.updateCountdown(e.detail));
    },

    onManagerReady() {
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
        if (!window.EventEngine) return;

        const events = Object.values(window.EventEngine.events).filter(e =>
            e.category === category ||
            e.category.toLowerCase().includes(category.toLowerCase())
        );

        const container = document.getElementById(containerId);
        if (container) {
            if (events.length === 0) {
                container.innerHTML = `<div class="card" style="grid-column: 1/-1; text-align: center;">Awaiting schedule updates...</div>`;
            } else {
                container.innerHTML = events.map(e => window.Renderer.renderEventCard(e)).join('');
            }
        }
    },

    setupMobileMenu() {
        const btn = document.querySelector('.mobile-menu-btn');
        const nav = document.querySelector('.nav-links');

        if (btn && nav) {
            // Create overlay if not exists
            let overlay = document.querySelector('.nav-active-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'nav-active-overlay';
                document.body.appendChild(overlay);
            }

            const toggle = () => {
                nav.classList.toggle('active');
                overlay.classList.toggle('active');
                document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
            };

            btn.onclick = toggle;
            overlay.onclick = toggle;

            // Close on link click
            nav.querySelectorAll('a').forEach(link => {
                link.onclick = () => {
                    nav.classList.remove('active');
                    overlay.classList.remove('active');
                    document.body.style.overflow = '';
                };
            });
        }
    },


    checkLiveMatch(state) {
        const heroIndicator = document.getElementById('live-indicator-hero');
        const hubIndicator = document.getElementById('hub-live-status');
        const heroTeamName = document.getElementById('hero-live-team');

        if (state && state.matchInfo && state.matchInfo.status === 'LIVE') {
            const { teamA, teamB, currentInnings } = state.matchInfo;
            const curTeam = (state.matchInfo.battingFirst === teamA.name) ? (currentInnings === 1 ? teamA : teamB) : (currentInnings === 1 ? teamB : teamA);
            const scoreText = `${teamA.name} VS ${teamB.name} | ${curTeam.score}/${curTeam.wickets}`;

            if (heroIndicator) heroIndicator.style.display = 'flex';
            if (heroTeamName) heroTeamName.innerText = scoreText;
            if (hubIndicator) hubIndicator.innerHTML = `<span class="status-badge status-live" style="font-size: 0.6rem;">LIVE: ${scoreText}</span>`;
        } else {
            if (heroIndicator) heroIndicator.style.display = 'none';
            if (hubIndicator) hubIndicator.innerHTML = '';
        }
    },

    updateCountdown(settings) {
        this.targetDate = settings.targetDate || 'February 7, 2026 09:00:00';
    }
};

/**
 * GLOBAL FUNCTIONS
 */
window.renderCards = (containerId, category) => window.mainController.renderCards(containerId, category);

window.openEventDetail = (id) => {
    const event = window.EventEngine.events[id];
    if (!event) return;

    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    if (!overlay || !content) return;

    content.innerHTML = `
        <span class="modal-close" onclick="closeEventModal()">&times;</span>
        <div class="modal-header-img">
            <img src="${event.image || 'assets/logo.png'}" onerror="this.src='assets/logo.png'" style="width: 100%; height: 250px; object-fit: cover; border-radius: 12px; margin-bottom: 20px;">
        </div>
        <h2 style="color: var(--primary); margin-bottom: 5px;">${event.name}</h2>
        <div style="display: flex; gap: 15px; font-size: 0.9rem; margin-bottom: 20px; color: var(--text-dim);">
            <span><i class="far fa-calendar-alt"></i> ${event.date || 'TBA'}</span>
            <span><i class="far fa-clock"></i> ${event.time || 'TBA'}</span>
            <span><i class="fas fa-map-marker-alt"></i> ${event.venue || 'Main Campus'}</span>
        </div>
        <div class="modal-body" style="line-height: 1.6;">
            <h3>Event Description</h3>
            <p>Join us for the ${event.name} at BEC Britanika 2K26.</p>
            
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
function initCountdown() {
    const countdown = () => {
        const targetRaw = window.mainController.targetDate || 'February 7, 2026 09:00:00';
        const countDate = new Date(targetRaw).getTime();
        const now = new Date().getTime();
        const gap = countDate - now;

        const second = 1000, minute = second * 60, hour = minute * 60, day = hour * 24;

        if (gap < 0 || isNaN(countDate)) {
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
