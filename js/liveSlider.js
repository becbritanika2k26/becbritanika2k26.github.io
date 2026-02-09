/**
 * LiveSlider.js - Cinematic Match Spotlight
 */
window.LiveSlider = {
    slides: [
        { id: 'cricket', category: 'Cricket', title: 'The Ultimate Clash', url: 'live-score.html', img: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=2067&auto=format&fit=crop' },
        { id: 'kabaddi', category: 'Kabaddi', title: 'Power & Strategy', url: 'live-kabaddi.html', img: 'https://images.unsplash.com/photo-1628172901323-999331818b2f?q=80&w=2070&auto=format&fit=crop' },
        { id: 'volleyball', category: 'Volleyball', title: 'Set for Victory', url: 'live-volleyball.html', img: 'https://images.unsplash.com/photo-1592656094267-764a45160876?q=80&w=2070&auto=format&fit=crop' }
    ],
    currentIndex: 0,

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.render();
        this.startAutoPlay();
        this.syncScores();
    },

    render() {
        this.container.innerHTML = this.slides.map((s, i) => `
            <div class="cinematic-slide ${i === 0 ? 'active-slide' : ''}" data-index="${i}">
                <img src="${s.img}" class="slide-bg-media" alt="${s.category}">
                <div class="slide-image-overlay"></div>
                <div class="slide-content">
                    <div class="slide-category">${s.category}</div>
                    <div class="slide-title">${s.title}</div>
                    <div class="slide-score-display" id="slide-score-${s.id}">
                        <span class="slide-status-dot"></span>
                        <span class="score-text">Fetching Live Status...</span>
                    </div>
                    <div class="slide-btn-wrap">
                        <a href="${s.url}" class="btn btn-primary">Watch Now</a>
                    </div>
                </div>
            </div>
        `).join('');
    },

    startAutoPlay() {
        setInterval(() => {
            this.currentIndex = (this.currentIndex + 1) % this.slides.length;
            this.updateActiveSlide();
        }, 6000);
    },

    updateActiveSlide() {
        const slides = this.container.querySelectorAll('.cinematic-slide');
        slides.forEach((s, i) => {
            s.classList.toggle('active-slide', i === this.currentIndex);
        });
        // Smooth scroll to active
        const slideWidth = slides[0].offsetWidth + 30; // 30 is gap
        this.container.scrollTo({
            left: this.currentIndex * slideWidth,
            behavior: 'smooth'
        });
    },

    syncScores() {
        // Listen for engine updates
        window.addEventListener('cricketUpdate', (e) => this.updateScore('cricket', e.detail));
        window.addEventListener('kabaddiUpdate', (e) => this.updateScore('kabaddi', e.detail));
        window.addEventListener('volleyballUpdate', (e) => this.updateScore('volleyball', e.detail));
    },

    updateScore(sport, state) {
        const el = document.querySelector(`#slide-score-${sport} .score-text`);
        const dot = document.querySelector(`#slide-score-${sport} .slide-status-dot`);
        if (!el || !state) return;

        const { status } = state.matchInfo;

        if (status === 'LIVE') {
            dot.style.display = 'inline-block';
            if (sport === 'cricket') {
                const { teamA, teamB, currentInnings, battingFirst } = state.matchInfo;
                const curKey = (battingFirst === teamA.name) ? (currentInnings === 1 ? 'teamA' : 'teamB') : (currentInnings === 1 ? 'teamB' : 'teamA');
                const team = state.matchInfo[curKey];
                el.innerText = `${teamA.name} vs ${teamB.name} | ${team.score}/${team.wickets}`;
            } else {
                el.innerText = `${state.matchInfo.teamA.name} vs ${state.matchInfo.teamB.name} | Live Action`;
            }
        } else if (status === 'COMPLETED') {
            dot.style.display = 'none';
            el.innerText = 'Match Concluded';
            el.style.color = 'var(--accent-green)';
        } else {
            dot.style.display = 'none';
            el.innerText = 'Starts Soon';
        }
    }
};
