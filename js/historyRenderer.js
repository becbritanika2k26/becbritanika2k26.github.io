/**
 * HistoryRenderer - Renders match history sidebars for live scoreboards
 */
import RealtimeSync from './realtimeSync.js';

window.HistoryRenderer = {
    init(containerId, sportType) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const collectionMap = {
            'cricket': 'cricketHistory',
            'volleyball': 'volleyballHistory',
            'kabaddi': 'kabaddiHistory'
        };

        const collectionName = collectionMap[sportType];
        if (!collectionName) return;

        RealtimeSync.subscribeCollection(collectionName, (data) => {
            if (!data || data.length === 0) {
                container.innerHTML = '<div style="opacity:0.5; font-size: 0.7rem; text-align:center;">No match history yet.</div>';
                return;
            }

            // Sort by latest
            data.sort((a, b) => b.timestamp - a.timestamp);

            container.innerHTML = data.slice(0, 5).map(m => {
                const date = new Date(m.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });

                // For Cricket
                if (sportType === 'cricket') {
                    return `
                        <div class="side-match-card">
                            <div class="side-match-header">
                                <span>${date}</span>
                                <span style="color: var(--accent-gold);">WINNER</span>
                            </div>
                            <div class="side-match-teams">
                                <span>${m.teams.teamA.name} vs ${m.teams.teamB.name}</span>
                            </div>
                            <span class="side-winner-tag">${m.result.split(' won')[0]}</span>
                        </div>
                    `;
                }

                // For Volleyball/Kabaddi (Generic fallback)
                return `
                    <div class="side-match-card">
                        <div class="side-match-header">
                            <span>${date}</span>
                            <span style="color: var(--accent-gold);">WINNER</span>
                        </div>
                        <div class="side-match-teams">
                            <span>${m.teamA} vs ${m.teamB}</span>
                        </div>
                        <span class="side-winner-tag">${m.winner}</span>
                    </div>
                `;
            }).join('');
        }, 'timestamp', 'desc');
    }
};
