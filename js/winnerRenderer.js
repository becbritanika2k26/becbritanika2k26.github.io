/**
 * WinnerRenderer - Shared UI templates for Winner System
 */

window.WinnerRenderer = {
    getCategoryIcon(cat) {
        const icons = {
            "Outdoor Sports": "fa-running",
            "Indoor Events": "fa-chess-pawn",
            "Cultural": "fa-music",
            "Technical": "fa-microchip"
        };
        return icons[cat] || "fa-trophy";
    },

    renderWinnerCard(w) {
        return `
            <div class="winner-card glass-panel" data-id="${w.id}">
                ${w.isNew ? '<span class="new-badge">NEW</span>' : ''}
                <div class="winner-card-header">
                    <i class="fas ${this.getCategoryIcon(w.category)}"></i>
                    <span>${w.category}</span>
                </div>
                <h3>${w.eventName}</h3>
                
                <div class="podium-mini">
                    <div class="podium-item second">
                        <div class="medal silver">2</div>
                        <div class="winner-name">${w.winners.second || 'TBA'}</div>
                    </div>
                    <div class="podium-item first">
                        <div class="medal gold"><i class="fas fa-crown"></i></div>
                        <div class="winner-name">${w.winners.first || 'TBA'}</div>
                        <div class="mode-tag">${w.mode}</div>
                    </div>
                    <div class="podium-item third">
                        <div class="medal bronze">3</div>
                        <div class="winner-name">${w.winners.third || 'TBA'}</div>
                    </div>
                </div>
                
                <div class="winner-date">${new Date(w.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | ${new Date(w.timestamp).toLocaleDateString()}</div>
            </div>
        `;
    },

    renderCarouselSlide(w) {
        return `
            <div class="carousel-slide">
                <div class="slide-content">
                    <div class="slide-event-type">${w.category}</div>
                    <h2 class="slide-title">${w.eventName}</h2>
                    <div class="slide-winner-main">
                        <div class="crown-icon"><i class="fas fa-trophy fa-bounce"></i></div>
                        <div class="winner-label">CHAMPION</div>
                        <div class="winner-primary-name">${w.winners.first}</div>
                    </div>
                </div>
            </div>
        `;
    }
};
