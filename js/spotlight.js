document.addEventListener('DOMContentLoaded', () => {
    initSpotlight();
});

function initSpotlight() {
    const spotlightOverlay = document.getElementById('spotlight-overlay');
    if (!spotlightOverlay) return;

    // Default data as requested
    const defaultEvents = [
        { time: "09:00 AM", session: "Morning", events: ["Running Race (Boys/Girls)", "Long Jump (Boys/Girls)", "Shot Put (Boys/Girls)", "Discus Throw (Boys/Girls)"] },
        { time: "02:00 PM", session: "Afternoon", events: ["Essay Writing (Boys/Girls)", "Painting Competition (Boys/Girls)"] }
    ];

    const todayStr = "Feb 07, 2026";
    document.getElementById('spotlight-date').innerText = todayStr;
    document.querySelector('.spotlight-header h2').innerText = "TODAY'S SPOTLIGHT";

    // Load from localStorage if admin has added custom ones
    const customSpotlight = JSON.parse(localStorage.getItem('bec_britanika_spotlight'));
    const eventsToShow = customSpotlight || defaultEvents;

    const contentArea = document.getElementById('spotlight-content');
    contentArea.innerHTML = eventsToShow.map(group => `
        <div class="spotlight-group">
            <div class="spotlight-session">${group.session} — ${group.time}</div>
            <div class="spotlight-list">
                ${group.events.map(e => `<div class="spotlight-item"><i class="fas fa-check-circle"></i> ${e}</div>`).join('')}
            </div>
        </div>
    `).join('');

    // For testing/initial phase, show on every visit if not seen in last 5 mins
    const lastSeen = localStorage.getItem('spotlight_last_seen');
    const now = Date.now();
    if (!lastSeen || (now - lastSeen > 300000)) { // 5 minutes instead of 1 hour
        setTimeout(() => {
            if (spotlightOverlay.style.display !== 'flex') {
                spotlightOverlay.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        }, 1200);
    }
}

function closeSpotlight() {
    document.getElementById('spotlight-overlay').style.display = 'none';
    document.body.style.overflow = 'auto';
    localStorage.setItem('spotlight_last_seen', Date.now());
}

window.closeSpotlight = closeSpotlight;
window.initSpotlight = initSpotlight;
