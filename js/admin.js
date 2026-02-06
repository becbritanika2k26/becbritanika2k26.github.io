async function loadAdminData() {
    const type = document.getElementById('view-type').value;
    const container = document.getElementById('data-items-container');
    let data;

    if (type === 'spotlight') {
        data = JSON.parse(localStorage.getItem('bec_britanika_spotlight')) || [];
    } else {
        data = await window.DataManager.fetchData(type);
    }

    container.innerHTML = data.map(item => `
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 10px; border: 1px solid var(--glass-border); margin-bottom: 10px;">
            <div>
                <strong style="color: var(--primary);">${item.name || item.title || item.session}</strong>
                <div style="font-size: 0.8rem; color: var(--text-dim);">${item.date || item.time}</div>
            </div>
            <button class="btn" style="background: rgba(255,50,50,0.2); color: #ff5555; padding: 0.5rem 1rem; border-radius: 5px;" onclick="deleteItem('${type}', '${item.id}')">Delete</button>
        </div>
    `).join('') || '<p style="text-align: center; color: var(--text-dim);">No data found.</p>';
}

function showSuccess() {
    const msg = document.getElementById('status-msg');
    const status = document.getElementById('upload-status');
    msg.innerHTML = '<span style="color: #4ade80;">Success! Refresh site to see changes.</span>';

    // Clear form
    document.getElementById('name').value = '';
    document.getElementById('datetime').value = '';
    document.getElementById('info').value = '';
    document.getElementById('meta').value = '';
    document.getElementById('image-url').value = '';
    document.getElementById('participants-pdf').value = '';
    document.getElementById('pdf-file-input').value = '';
    if (status) {
        status.innerText = 'Max 2-3MB recommended for local storage.';
        status.style.color = 'var(--text-dim)';
    }

    loadAdminData();
    setTimeout(() => msg.innerText = '', 3000);
}

function handleSave() {
    const type = document.getElementById('target-type').value;
    const name = document.getElementById('name').value;
    const datetime = document.getElementById('datetime').value;
    const info = document.getElementById('info').value;
    const meta = document.getElementById('meta').value;
    const image = document.getElementById('image-url').value;
    const pdf = document.getElementById('participants-pdf').value;

    if (!name || !info) {
        alert('Please fill at least Session/Name and Events/Info');
        return;
    }

    if (type === 'spotlight') {
        const spotlightData = JSON.parse(localStorage.getItem('bec_britanika_spotlight')) || [];
        const entry = {
            id: Date.now().toString(),
            session: name,
            time: datetime,
            events: info.split(',').map(e => e.trim())
        };
        spotlightData.push(entry);
        localStorage.setItem('bec_britanika_spotlight', JSON.stringify(spotlightData));
        showSuccess();
    } else if (type === 'updates') {
        const entry = {
            id: Date.now().toString(),
            title: name,
            content: info,
            image: image || null,
            time: datetime || new Date().toLocaleString(),
            type: 'update'
        };
        window.DataManager.saveLocalData(type, entry);
        showSuccess();
    } else {
        const parts = datetime.split('|');
        const entry = {
            id: 'local-' + Date.now(),
            name: name,
            date: parts[0]?.trim() || 'TBA',
            time: parts[1]?.trim() || 'TBA',
            venue: info,
            image: image || null,
            category: meta || 'Open',
            participants_pdf: pdf || null,
            participants: [],
            result: ''
        };
        window.DataManager.saveLocalData(type, entry);
        showSuccess();
    }
}

function handleFileUpload(input) {
    const file = input.files[0];
    const status = document.getElementById('upload-status');
    const pdfInput = document.getElementById('participants-pdf');

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert('File is too large! Local storage limit is 5MB.');
        input.value = '';
        return;
    }

    const reader = new FileReader();
    status.innerText = 'Uploading...';

    reader.onload = function (e) {
        pdfInput.value = e.target.result;
        status.innerText = 'File uploaded as Base64 (' + (file.size / 1024).toFixed(1) + ' KB)';
        status.style.color = '#4ade80';
    };

    reader.onerror = function () {
        status.innerText = 'Upload failed';
        status.style.color = '#ff5555';
    };

    reader.readAsDataURL(file);
}

function deleteItem(type, id) {
    if (!confirm('Are you sure?')) return;

    if (type === 'spotlight') {
        const localData = JSON.parse(localStorage.getItem('bec_britanika_spotlight')) || [];
        const filtered = localData.filter(item => item.id != id);
        localStorage.setItem('bec_britanika_spotlight', JSON.stringify(filtered));
        loadAdminData();
    } else {
        const localData = JSON.parse(localStorage.getItem(`bec_britanika_${type}`)) || [];
        const filtered = localData.filter(item => item.id != id);
        if (localData.length === filtered.length) {
            alert("JSON file data cannot be deleted here.");
        } else {
            localStorage.setItem(`bec_britanika_${type}`, JSON.stringify(filtered));
            loadAdminData();
        }
    }
}

function saveConfig() {
    const targetDate = document.getElementById('config-target-date').value;
    if (!targetDate) {
        alert('Please enter a valid date');
        return;
    }
    localStorage.setItem('bec_britanika_target_date', targetDate);
    const msg = document.getElementById('status-msg');
    msg.innerHTML = '<span style="color: #4ade80;">Event Date Updated! Refresh the main site.</span>';
    setTimeout(() => msg.innerText = '', 3000);
}

window.handleSave = handleSave;
window.loadAdminData = loadAdminData;
window.deleteItem = deleteItem;
window.handleFileUpload = handleFileUpload;
window.saveConfig = saveConfig;
