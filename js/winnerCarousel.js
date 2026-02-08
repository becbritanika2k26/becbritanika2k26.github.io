/**
 * WinnerCarousel - Auto-rotating winner display (Cloud Sync Ready)
 */

window.WinnerCarousel = {
    _currentIndex: 0,
    _timer: null,
    _winners: [],

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.start();
    },

    refresh(winners) {
        this._winners = winners || [];
        this.render();
    },

    render() {
        if (!this.container) return;
        const winners = this._winners;
        if (winners.length === 0) {
            this.container.innerHTML = '<div class="no-winners">Awaiting Results...</div>';
            return;
        }

        const topWinners = winners.slice(0, 5); // Show latest 5 in carousel
        this.container.innerHTML = `
            <div class="carousel-wrapper" id="carousel-wrapper">
                ${topWinners.map(w => window.WinnerRenderer.renderCarouselSlide(w)).join('')}
            </div>
            <div class="carousel-dots">
                ${topWinners.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}" onclick="window.WinnerCarousel.goTo(${i})"></span>`).join('')}
            </div>
        `;
        this.updateSlide();
    },

    start() {
        if (this._timer) clearInterval(this._timer);
        this._timer = setInterval(() => {
            this.next();
        }, 4000);
    },

    next() {
        const count = Math.min(this._winners.length, 5);
        if (count <= 1) return;
        this._currentIndex = (this._currentIndex + 1) % count;
        this.updateSlide();
    },

    goTo(index) {
        this._currentIndex = index;
        this.updateSlide();
        this.start(); // Restart timer
    },

    updateSlide() {
        const wrapper = document.getElementById('carousel-wrapper');
        if (!wrapper) return;
        wrapper.style.transform = `translateX(-${this._currentIndex * 100}%)`;

        // Update dots
        const dots = document.querySelectorAll('.carousel-dots .dot');
        dots.forEach((d, i) => {
            if (i === this._currentIndex) d.classList.add('active');
            else d.classList.remove('active');
        });
    }
};
