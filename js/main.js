document.addEventListener('DOMContentLoaded', () => {
    initScrollProgress();
    initCountdown();
    initMobileMenu();
    initLiveUpdates();
    initFloatingButton();
    updateHomepageLiveFeed();
});

async function updateHomepageLiveFeed() {
    const container = document.getElementById('homepage-live-updates');
    if (!container) return;

    const updates = await window.DataManager.getUpdates();
    if (updates.length === 0) {
        container.innerHTML = '<p class="empty-msg">No recent updates.</p>';
        return;
    }

    container.innerHTML = updates.map(u => `
        <div class="mini-update">
            <span class="time"><i class="far fa-clock"></i> ${u.time}</span>
            <p><strong>${u.title}</strong>: ${u.content}</p>
        </div>
    `).join('');
}

function reopenSpotlight() {
    localStorage.removeItem('spotlight_last_seen');
    if (typeof initSpotlight === 'function') {
        initSpotlight();
    } else {
        location.reload();
    }
}

// Floating Button Logic
function initFloatingButton() {
    const btn = document.createElement('button');
    btn.className = 'floating-btn';
    btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Scroll Progress Bar
function initScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.id = 'scroll-progress';
    document.body.prepend(progressBar);

    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + "%";
    });
}

// Countdown Timer
function initCountdown() {
    const savedDate = localStorage.getItem('bec_britanika_target_date');
    const targetDateStr = savedDate || 'February 7, 2026 09:00:00';
    const targetDate = new Date(targetDateStr).getTime();
    const countdownItems = {
        days: document.getElementById('days'),
        hours: document.getElementById('hours'),
        minutes: document.getElementById('minutes'),
        seconds: document.getElementById('seconds')
    };

    if (!countdownItems.days) return;

    const timer = setInterval(() => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);

        countdownItems.days.innerText = d.toString().padStart(2, '0');
        countdownItems.hours.innerText = h.toString().padStart(2, '0');
        countdownItems.minutes.innerText = m.toString().padStart(2, '0');
        countdownItems.seconds.innerText = s.toString().padStart(2, '0');

        if (distance < 0) {
            clearInterval(timer);
            document.querySelector('.countdown').innerHTML = "<h2>EVENT STARTED!</h2>";
        }
    }, 1000);
}


// Mobile Menu
function initMobileMenu() {
    const btn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.nav-links');
    if (btn) {
        btn.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }
}

// Live Updates Ticker
async function initLiveUpdates() {
    const ticker = document.querySelector('.ticker-content');
    if (!ticker) return;

    const updates = await window.DataManager.getUpdates();
    ticker.innerHTML = updates.map(u => `<span> • ${u.title}: ${u.content} </span>`).join(' ');
}

// Global cache for event data to avoid large string issues in HTML attributes
window._eventCache = {};

// Render Event Cards
async function renderCards(containerId, fetchMethod) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const data = await fetchMethod();

    // Cache data
    data.forEach(item => {
        window._eventCache[item.id] = item;
    });

    container.innerHTML = data.map(item => {
        const totalParticipants = Array.isArray(item.participants)
            ? item.participants.length
            : Object.values(item.participants).flat().length;

        return `
            <div class="card" onclick="openModal('${item.id}')">
                <h3>${item.name}</h3>
                <div class="meta">
                    <span><i class="far fa-calendar"></i> ${item.date}</span>
                    <span><i class="far fa-clock"></i> ${item.time}</span>
                    <span><i class="fas fa-users"></i> ${totalParticipants} Participants</span>
                </div>
                <div class="category">${item.category}</div>
                ${item.result ? `<div class="result">Result: ${item.result}</div>` : ''}
            </div>
        `;
    }).join('');
}

// Helper to safely open/download PDFs (handles Base64 strings and paths)
function openPDF(pathOrData) {
    if (!pathOrData) return;

    if (pathOrData.startsWith('data:')) {
        // Create a temporary link to download Base64 PDF
        const link = document.createElement('a');
        link.href = pathOrData;
        link.download = 'participants_list.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        window.open(pathOrData, '_blank');
    }
}

// Modal System
function openModal(itemId) {
    const item = window._eventCache[itemId];
    if (!item) return;

    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');

    const isArrayParticipant = Array.isArray(item.participants);
    const totalParticipants = isArrayParticipant
        ? item.participants.length
        : Object.values(item.participants).flat().length;

    modalContent.innerHTML = `
        <span class="modal-close" onclick="closeModal()">&times;</span>
        <h2 style="color: var(--primary); margin-bottom: 0.5rem; font-size: 1.8rem;">${item.name}</h2>
        ${item.image ? `<img src="${item.image}" alt="${item.name}" class="modal-image" style="width: 100%; height: 200px; object-fit: cover; border-radius: 15px; margin-bottom: 1.5rem; border: 1px solid var(--glass-border);">` : ''}
        <div class="modal-meta-grid">
            <div class="meta-item"><i class="far fa-calendar"></i> ${item.date}</div>
            <div class="meta-item"><i class="far fa-clock"></i> ${item.time}</div>
            <div class="meta-item"><i class="fas fa-map-marker-alt"></i> ${item.venue}</div>
            <div class="meta-item"><i class="fas fa-users"></i> ${totalParticipants} Participants</div>
        </div>

        <div class="modal-tabs">
            <button class="tab-btn active" onclick="switchModalTab(this, 'details')">Details</button>
            <button class="tab-btn" onclick="switchModalTab(this, 'participants')">Participants</button>
            ${item.brackets || item.schedule ? `<button class="tab-btn" onclick="switchModalTab(this, 'brackets')">Brackets/Schedule</button>` : ''}
            <button class="tab-btn" onclick="switchModalTab(this, 'results')">Results</button>
        </div>

        <div id="modal-tab-content">
            <div id="details" class="tab-pane active">
                <p style="margin-bottom: 1rem;"><strong>Category:</strong> ${item.category}</p>
                <p>Welcome to ${item.name}. Join us for an exciting competition at Britanika 2K26.</p>
                ${item.participants_pdf ? `
                    <div style="margin-top: 2rem;">
                        <button onclick="openPDF('${item.participants_pdf.replace(/'/g, "\\'")}')" class="btn btn-download" style="width: auto;">
                            <i class="fas fa-file-pdf"></i> View Participants List
                        </button>
                    </div>
                ` : ''}
            </div>
            
            <div id="participants" class="tab-pane">
                <div class="search-container">
                    <input type="text" id="participant-search" placeholder="Search names..." onkeyup="filterParticipants()">
                </div>
                <div id="participants-list" class="styled-list">
                    ${renderParticipants(item.participants)}
                </div>
            </div>

            <div id="brackets" class="tab-pane">
                <div class="styled-list">
                    ${item.brackets ? renderBrackets(item.brackets) : (item.schedule ? renderSchedule(item.schedule) : 'No bracket available.')}
                </div>
            </div>

            <div id="results" class="tab-pane">
                <div class="result-placeholder">
                    ${item.result ? `<div class="result-card"><h3>Winner</h3><p>${item.result}</p></div>` : '<p>The results will be updated as soon as the event concludes. Stay tuned!</p>'}
                </div>
            </div>
        </div>
    `;

    modalOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function renderParticipants(participants) {
    if (Array.isArray(participants)) {
        if (participants.length === 0) return '<p class="empty-msg">TBA</p>';
        return participants.map(p => `<div class="participant-item">${p}</div>`).join('');
    } else {
        let html = '';
        for (const [cat, list] of Object.entries(participants)) {
            html += `<h4 class="cat-title">${cat}</h4>`;
            html += list.length > 0
                ? list.map(p => `<div class="participant-item">${p}</div>`).join('')
                : '<p class="empty-msg">No entries</p>';
        }
        return html;
    }
}

function renderBrackets(brackets) {
    return brackets.map(b => `
        <div class="match-item">
            <span class="match-name">${b.match}</span>
            <span class="match-teams">${b.teams}</span>
            <span class="match-time">${b.time}</span>
        </div>
    `).join('');
}

function renderSchedule(schedule) {
    return schedule.map(s => `
        <div class="match-item">
            <span class="match-name">${s.match}</span>
            <span class="match-time">${s.date ? s.date + ' | ' : ''}${s.time}</span>
        </div>
    `).join('');
}

function switchModalTab(btn, tabId) {
    const modal = btn.closest('.modal');
    modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    modal.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

function filterParticipants() {
    const query = document.getElementById('participant-search').value.toLowerCase();
    const items = document.querySelectorAll('.participant-item');
    items.forEach(item => {
        if (item.textContent.toLowerCase().includes(query)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
    document.body.style.overflow = 'auto';
}

window.openModal = openModal;
window.closeModal = closeModal;
window.renderCards = renderCards;
window.switchModalTab = switchModalTab;
window.filterParticipants = filterParticipants;
