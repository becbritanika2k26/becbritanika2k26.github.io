/**
 * WinnerCarousel - Auto-rotating winner display with Touch Support
 * BEC Britanika 2K26
 */

window.WinnerCarousel = {
    _currentIndex: 0,
    _timer: null,
    _winners: [],
    _touchStartX: 0,
    _isInteracting: false,
    _isInitialized: false,

    init(containerId) {
        if (this._isInitialized) return;
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.addInteractionListeners();
        this.start();
        this._isInitialized = true;
    },

    refresh(winners) {
        this._winners = winners || [];
        // Cap index if winners list shrunk
        const count = Math.min(this._winners.length, 8);
        if (this._currentIndex >= count && count > 0) {
            this._currentIndex = 0;
        }
        this.render();
    },

    render() {
        if (!this.container) return;
        const winners = this._winners;
        if (winners.length === 0) {
            this.container.innerHTML = '<div class="no-winners">Awaiting Champions...</div>';
            return;
        }

        const topWinners = winners.slice(0, 8); // Latest 8
        this.container.innerHTML = `
            <div class="carousel-container-inner" id="carousel-container-inner">
                <div class="carousel-wrapper" id="carousel-wrapper">
                    ${topWinners.map(w => window.WinnerRenderer.renderCarouselSlide(w)).join('')}
                </div>
                <div class="carousel-nav-btns">
                    <button class="carousel-nav-btn prev" onclick="window.WinnerCarousel.prev()"><i class="fas fa-chevron-left"></i></button>
                    <button class="carousel-nav-btn next" onclick="window.WinnerCarousel.next()"><i class="fas fa-chevron-right"></i></button>
                </div>
                <div class="carousel-dots">
                    ${topWinners.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}" onclick="window.WinnerCarousel.goTo(${i})"></span>`).join('')}
                </div>
            </div>
        `;
        this.updateSlide();
    },

    start() {
        this.stop();
        this._timer = setInterval(() => {
            if (!this._isInteracting) {
                this.next();
            }
        }, 4000);
    },

    stop() {
        if (this._timer) clearInterval(this._timer);
    },

    next() {
        const count = Math.min(this._winners.length, 8);
        if (count <= 1) return;
        this._currentIndex = (this._currentIndex + 1) % count;
        this.updateSlide();
    },

    prev() {
        const count = Math.min(this._winners.length, 8);
        if (count <= 1) return;
        this._currentIndex = (this._currentIndex - 1 + count) % count;
        this.updateSlide();
    },

    goTo(index) {
        this._currentIndex = index;
        this.updateSlide();
        this.start(); // Restart timer sequence
    },

    updateSlide() {
        const wrapper = document.getElementById('carousel-wrapper');
        const dots = document.querySelectorAll('.carousel-dots .dot');

        if (wrapper) {
            wrapper.style.transform = `translateX(-${this._currentIndex * 100}%)`;
        }

        if (dots.length > 0) {
            dots.forEach((d, i) => {
                d.classList.toggle('active', i === this._currentIndex);
            });
        }
    },

    addInteractionListeners() {
        const c = this.container;

        // Touch events
        c.addEventListener('touchstart', (e) => {
            this._touchStartX = e.touches[0].clientX;
            this._isInteracting = true;
        }, { passive: true });

        c.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = this._touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) this.next();
                else this.prev();
            }
            // Give a short delay before restarting auto-scroll
            setTimeout(() => { this._isInteracting = false; }, 2000);
        }, { passive: true });

        // Mouse events (for Desktop)
        c.addEventListener('mouseenter', () => { this._isInteracting = true; });
        c.addEventListener('mouseleave', () => { this._isInteracting = false; });
    }
};
