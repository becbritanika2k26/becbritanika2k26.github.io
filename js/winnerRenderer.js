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
        const icon = this.getCategoryIcon(w.category);
        const winners = w.winners || {};
        const first = winners.first || 'TBA';
        const second = winners.second || 'TBA';
        const third = winners.third || 'TBA';
        const college = winners.college || 'Bhubaneswar Engineering College';

        return `
            <div class="carousel-slide">
                <div class="winner-bg-icon"><i class="fas ${icon}"></i></div>
                <div class="winner-slide-content">
                    <div class="winner-event-tag">
                        <i class="fas ${icon}"></i>
                        <span>${w.category || 'Event'}</span>
                    </div>
                    <h2 class="winner-slide-title">${w.eventName || 'Britanika Event'}</h2>
                    <div class="winner-main-box">
                        <div class="winner-crown"><i class="fas fa-trophy fa-bounce"></i></div>
                        <div class="winner-rank-label">BRITANIKA CHAMPION</div>
                        <div class="winner-name-text">${first}</div>
                        <div class="winner-college-text">${college}</div>
                    </div>
                    <div class="winner-podium-row">
                        <div class="winner-podium-lite silver">
                            <span class="rank-tag">2nd</span>
                            <span class="name-tag">${second}</span>
                        </div>
                        <div class="winner-podium-lite bronze">
                            <span class="rank-tag">3rd</span>
                            <span class="name-tag">${third}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};
