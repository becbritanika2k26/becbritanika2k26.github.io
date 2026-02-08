/**
 * Renderer - Handles UI generation for BEC Britanika 2K26
 */

window.Renderer = {
    renderEventCard(event) {
        return `
            <div class="card event-card" data-category="${event.category}" id="card-${event.id}">
                <div class="card-image" style="${!event.image ? 'background: linear-gradient(135deg, #1e293b, #0f172a);' : ''}">
                    ${event.image ? `<img src="${event.image}" alt="${event.name}" onerror="this.style.display='none'">` : ''}
                    <div class="category-tag">${event.category}</div>
                </div>
                <div class="card-content">
                    <h3>${event.name}</h3>
                    <div class="event-meta">
                        <span><i class="far fa-calendar-alt"></i> ${event.date}</span>
                        <span><i class="far fa-clock"></i> ${event.time}</span>
                    </div>
                    <p><i class="fas fa-map-marker-alt"></i> ${event.venue}</p>
                    <div style="display: flex; gap: 8px; margin-top: 1rem;">
                        <button class="btn btn-primary" onclick="openEventDetail('${event.id}')" style="flex: 1; padding: 0.8rem 5px; font-size: 0.75rem;">
                            View Details
                        </button>
                        ${event.pdfUrl ? `
                            <a href="${event.pdfUrl.includes('drive.google.com') ? event.pdfUrl.replace(/\/file\/d\/([^/]+)\/view.*/, '/uc?export=download&id=$1') : event.pdfUrl}" 
                               target="_blank" class="btn btn-glass" style="flex: 1; padding: 0.8rem 5px; font-size: 0.75rem; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 4px; border-color: #ef4444; color: #ef4444;">
                                <i class="fas fa-file-pdf"></i> Rules
                            </a>
                        ` : ''}
                    </div>
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
                    ${e.status === 'ONGOING' ?
                '<span class="badge" style="background: rgba(34, 197, 94, 0.2); color: #22c55e;">LIVE NOW</span>' :
                e.status === 'COMPLETED' ?
                    '<span class="badge" style="background: rgba(148, 163, 184, 0.2); color: #94a3b8;">FINISHED</span>' :
                    '<span class="badge" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8;">SCHEDULED</span>'
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
