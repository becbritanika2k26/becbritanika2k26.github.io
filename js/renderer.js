/**
 * Renderer - Handles UI generation for BEC Britanika 2K26
 */

window.Renderer = {
    renderEventCard(event) {
        return `
            <div class="card event-card" data-category="${event.category}" id="card-${event.id}">
                <div class="card-image">
                    <img src="${event.image}" alt="${event.name}" onerror="this.src='assets/default-event.png'">
                    <div class="category-tag">${event.category}</div>
                </div>
                <div class="card-content">
                    <h3>${event.name}</h3>
                    <div class="event-meta">
                        <span><i class="far fa-calendar-alt"></i> ${event.date}</span>
                        <span><i class="far fa-clock"></i> ${event.time}</span>
                    </div>
                    <p><i class="fas fa-map-marker-alt"></i> ${event.venue}</p>
                    <button class="btn btn-primary" onclick="openEventDetail('${event.id}')" style="width: 100%; margin-top: 1rem;">
                        View Details
                    </button>
                </div>
            </div>
        `;
    },

    renderEventTable(events, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (events.length === 0) {
            container.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem;">No events found matching your filters.</td></tr>';
            return;
        }

        container.innerHTML = events.map(e => `
            <tr class="${e.deleted ? 'row-deleted' : ''}">
                <td style="font-weight: bold;">${e.name}</td>
                <td><span class="admin-tag">${e.category}</span></td>
                <td>${e.date}</td>
                <td>${e.time}</td>
                <td>${e.venue}</td>
                <td>
                    ${e.deleted ?
                `<span class="badge badge-danger">Deleted</span>` :
                `<span class="badge badge-success">Active</span>`
            }
                </td>
                <td class="table-actions">
                    <button class="btn-icon edit" onclick="adminEditEvent('${e.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    ${e.deleted ?
                `<button class="btn-icon restore" onclick="adminRestoreEvent('${e.id}')" title="Restore"><i class="fas fa-undo"></i></button>` :
                `<button class="btn-icon delete" onclick="adminDeleteEvent('${e.id}')" title="Delete"><i class="fas fa-trash"></i></button>`
            }
                </td>
            </tr>
        `).join('');
    }
};
