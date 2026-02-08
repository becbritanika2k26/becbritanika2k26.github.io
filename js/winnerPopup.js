/**
 * WinnerPopup & Confetti Helper (Cloud Sync Ready)
 */

window.WinnerPopup = {
    _lastId: null,

    init() {
        if (!document.getElementById('winner-popup-container')) {
            const container = document.createElement('div');
            container.id = 'winner-popup-container';
            container.innerHTML = `
                <div id="winner-popup" class="winner-popup-card">
                    <span class="close-popup" onclick="window.WinnerPopup.hide()">&times;</span>
                    <div id="popup-content"></div>
                </div>
            `;
            document.body.appendChild(container);
        }
        // Removed polling check() - WinnerEngine calls trigger() directly
    },

    trigger(w) {
        if (!w || this._lastId === w.id) return;

        // Prevent multiple popups for same winner in same session
        if (sessionStorage.getItem('shown_' + w.id)) return;

        this._lastId = w.id;
        sessionStorage.setItem('shown_' + w.id, 'true');

        const content = document.getElementById('popup-content');
        if (!content) return;

        content.innerHTML = `
            <div class="popup-top">
                <i class="fas fa-trophy winner-animate"></i>
                <div class="popup-title">NEW WINNER ANNOUNCED!</div>
            </div>
            <div class="popup-event">${w.eventName}</div>
            <div class="popup-champion">
                <div class="medal-gold">1st PLACE</div>
                <div class="champion-name">${w.winners.first}</div>
            </div>
            <div class="popup-mode">${w.mode} WINNER</div>
        `;

        const popup = document.getElementById('winner-popup');
        if (popup) {
            popup.classList.add('active');
            this.startConfetti();
            setTimeout(() => this.hide(), 10000); // Hide after 10s
        }
    },

    hide() {
        const popup = document.getElementById('winner-popup');
        if (popup) popup.classList.remove('active');
    },

    startConfetti() {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '3000';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const pieces = [];
        const colors = ['#ffd700', '#00f2fe', '#4facfe', '#f093fb', '#ffffff'];

        for (let i = 0; i < 150; i++) {
            pieces.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                r: Math.random() * 6 + 4,
                d: Math.random() * 150,
                color: colors[Math.floor(Math.random() * colors.length)],
                tilt: Math.random() * 10 - 10,
                tiltAngleIncremental: Math.random() * 0.07 + 0.05,
                tiltAngle: 0
            });
        }

        let animationFrame;
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            pieces.forEach((p, i) => {
                p.tiltAngle += p.tiltAngleIncremental;
                p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
                p.tilt = Math.sin(p.tiltAngle) * 15;

                ctx.beginPath();
                ctx.lineWidth = p.r;
                ctx.strokeStyle = p.color;
                ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
                ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
                ctx.stroke();

                if (p.y > canvas.height) {
                    pieces[i] = { ...p, y: -20, x: Math.random() * canvas.width };
                }
            });
            animationFrame = requestAnimationFrame(draw);
        };

        draw();
        setTimeout(() => {
            cancelAnimationFrame(animationFrame);
            if (document.body.contains(canvas)) document.body.removeChild(canvas);
        }, 6000);
    }
};

window.WinnerPopup.init();
