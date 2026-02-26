// === CONFIG ===
const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:5555/api'
    : '/.netlify/functions';

// === STATE ===
let currentDate = new Date();
let currentView = 'grid';
let calendarData = [];
let selectedPost = null;

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});

async function initDashboard() {
    await Promise.all([
        loadAdsOverview(),
        loadCampaigns(),
        loadCalendar()
    ]);
    updateActivityLog();
    updateCurrentMonth();
}

// === ADS OVERVIEW ===
async function loadAdsOverview() {
    try {
        const timeframe = document.getElementById('ads-timeframe').value;
        const response = await fetch(`${API_BASE}/ads-overview?timeframe=${timeframe}`);
        const data = await response.json();
        
        renderAdsMetrics(data.metrics);
        updateHeaderStats(data.today_spend, data.scheduled_posts);
    } catch (error) {
        console.error('Error loading ads overview:', error);
        renderAdsMetrics({
            spend: 0,
            impressions: 0,
            clicks: 0,
            ctr: 0,
            cpc: 0,
            cpm: 0
        });
    }
}

function renderAdsMetrics(metrics) {
    const container = document.getElementById('ads-metrics');
    
    const metricsHTML = `
        <div class="metric-card">
            <div class="metric-label">Spend</div>
            <div class="metric-value">
                ${formatCurrency(metrics.spend)}
                <span class="metric-unit">COP</span>
            </div>
            <div class="metric-change ${metrics.spend_change > 0 ? 'positive' : 'negative'}">
                ${metrics.spend_change > 0 ? '↑' : '↓'} ${Math.abs(metrics.spend_change || 0).toFixed(1)}%
            </div>
        </div>
        
        <div class="metric-card">
            <div class="metric-label">Impresiones</div>
            <div class="metric-value">${formatNumber(metrics.impressions)}</div>
            <div class="metric-change ${metrics.impressions_change > 0 ? 'positive' : 'negative'}">
                ${metrics.impressions_change > 0 ? '↑' : '↓'} ${Math.abs(metrics.impressions_change || 0).toFixed(1)}%
            </div>
        </div>
        
        <div class="metric-card">
            <div class="metric-label">Clicks</div>
            <div class="metric-value">${formatNumber(metrics.clicks)}</div>
            <div class="metric-change ${metrics.clicks_change > 0 ? 'positive' : 'negative'}">
                ${metrics.clicks_change > 0 ? '↑' : '↓'} ${Math.abs(metrics.clicks_change || 0).toFixed(1)}%
            </div>
        </div>
        
        <div class="metric-card">
            <div class="metric-label">CTR</div>
            <div class="metric-value">
                ${metrics.ctr.toFixed(2)}
                <span class="metric-unit">%</span>
            </div>
        </div>
        
        <div class="metric-card">
            <div class="metric-label">CPC</div>
            <div class="metric-value">
                ${formatCurrency(metrics.cpc)}
                <span class="metric-unit">COP</span>
            </div>
        </div>
        
        <div class="metric-card">
            <div class="metric-label">CPM</div>
            <div class="metric-value">
                ${formatCurrency(metrics.cpm)}
                <span class="metric-unit">COP</span>
            </div>
        </div>
    `;
    
    container.innerHTML = metricsHTML;
}

function updateHeaderStats(todaySpend, scheduledPosts) {
    document.getElementById('today-spend').textContent = formatCurrency(todaySpend);
    document.getElementById('scheduled-posts').textContent = scheduledPosts;
}

// === CAMPAIGNS ===
async function loadCampaigns() {
    try {
        const response = await fetch(`${API_BASE}/campaigns`);
        const data = await response.json();
        renderCampaigns(data.campaigns);
    } catch (error) {
        console.error('Error loading campaigns:', error);
        renderCampaigns([]);
    }
}

function renderCampaigns(campaigns) {
    const container = document.getElementById('campaigns-list');
    
    if (campaigns.length === 0) {
        container.innerHTML = '<div class="activity-item">No hay campañas activas</div>';
        return;
    }
    
    const campaignsHTML = campaigns.map(campaign => `
        <div class="campaign-item ${campaign.status.toLowerCase()}">
            <div class="campaign-info">
                <div class="campaign-name">${campaign.name}</div>
                <div class="campaign-meta">${campaign.objective}</div>
            </div>
            <div class="campaign-metrics">
                <div class="campaign-metric">
                    <span>Spend:</span> ${formatCurrency(campaign.spend)}
                </div>
                <div class="campaign-metric">
                    <span>CTR:</span> ${campaign.ctr.toFixed(2)}%
                </div>
            </div>
            <div class="campaign-status ${campaign.status.toLowerCase()}">${campaign.status}</div>
        </div>
    `).join('');
    
    container.innerHTML = campaignsHTML;
}

async function refreshAds() {
    const btn = event.target.closest('.btn-icon');
    btn.style.transform = 'rotate(360deg)';
    await loadAdsOverview();
    await loadCampaigns();
    setTimeout(() => {
        btn.style.transform = '';
    }, 600);
}

// === CALENDAR ===
async function loadCalendar() {
    try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const response = await fetch(`${API_BASE}/calendar-month?year=${year}&month=${month}`);
        const data = await response.json();
        
        calendarData = data.posts;
        renderCalendar();
    } catch (error) {
        console.error('Error loading calendar:', error);
        calendarData = [];
        renderCalendar();
    }
}

function renderCalendar() {
    if (currentView === 'grid') {
        renderCalendarGrid();
    } else {
        renderCalendarList();
    }
}

function renderCalendarGrid() {
    const container = document.getElementById('calendar-days');
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    const prevMonthStart = prevMonthDays - startingDayOfWeek + 1;
    
    let daysHTML = '';
    
    // Previous month days
    for (let i = 0; i < startingDayOfWeek; i++) {
        const day = prevMonthStart + i;
        daysHTML += `<div class="calendar-day other-month"><div class="day-number">${day}</div></div>`;
    }
    
    // Current month days
    const today = new Date();
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayPosts = calendarData.filter(post => post.date === dateStr);
        const isToday = isCurrentMonth && day === today.getDate();
        
        const postsHTML = dayPosts.map(post => 
            `<div class="post-dot ${post.type} ${post.status}" title="${post.title}"></div>`
        ).join('');
        
        daysHTML += `
            <div class="calendar-day ${isToday ? 'today' : ''}" onclick="showDayPosts('${dateStr}')">
                <div class="day-number">${day}</div>
                <div class="day-posts">${postsHTML}</div>
            </div>
        `;
    }
    
    // Next month padding
    const totalCells = daysHTML.split('calendar-day').length - 1;
    const nextMonthDays = 42 - totalCells; // 6 weeks
    for (let i = 1; i <= nextMonthDays; i++) {
        daysHTML += `<div class="calendar-day other-month"><div class="day-number">${i}</div></div>`;
    }
    
    container.innerHTML = daysHTML;
}

function renderCalendarList() {
    const container = document.getElementById('calendar-list');
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let listHTML = '';
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayPosts = calendarData.filter(post => post.date === dateStr);
        
        if (dayPosts.length === 0) continue;
        
        const date = new Date(year, month, day);
        const weekday = date.toLocaleDateString('es-ES', { weekday: 'long' });
        
        const postsHTML = dayPosts.map(post => `
            <div class="post-item ${post.type}" onclick="showPostDetail('${post.id}')">
                <div class="post-content">
                    <div class="post-title">${post.title}</div>
                    <div class="post-meta">${post.time} • ${post.platform}</div>
                </div>
                <div class="post-status-badge ${post.status}">${post.status}</div>
            </div>
        `).join('');
        
        listHTML += `
            <div class="day-group">
                <div class="day-group-header">
                    <div class="day-group-date">${day}</div>
                    <div class="day-group-weekday">${weekday}</div>
                </div>
                <div class="post-list">${postsHTML}</div>
            </div>
        `;
    }
    
    container.innerHTML = listHTML || '<div class="activity-item">No hay posts programados este mes</div>';
}

function switchView(view) {
    currentView = view;
    
    // Update buttons
    document.querySelectorAll('.btn-toggle').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Toggle views
    document.getElementById('calendar-grid').classList.toggle('hidden', view !== 'grid');
    document.getElementById('calendar-list').classList.toggle('hidden', view !== 'list');
    
    renderCalendar();
}

function showDayPosts(dateStr) {
    const dayPosts = calendarData.filter(post => post.date === dateStr);
    if (dayPosts.length === 0) return;
    
    const date = new Date(dateStr);
    const formattedDate = date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const postsHTML = dayPosts.map(post => `
        <div class="post-item ${post.type}" onclick="showPostDetail('${post.id}')">
            <div class="post-content">
                <div class="post-title">${post.title}</div>
                <div class="post-meta">${post.time} • ${post.platform}</div>
            </div>
            <div class="post-status-badge ${post.status}">${post.status}</div>
        </div>
    `).join('');
    
    document.getElementById('modal-title').textContent = formattedDate;
    document.getElementById('modal-body').innerHTML = `
        <div class="post-list">${postsHTML}</div>
    `;
    document.querySelector('.modal-footer').style.display = 'none';
    document.getElementById('post-modal').classList.remove('hidden');
}

async function showPostDetail(postId) {
    try {
        const response = await fetch(`${API_BASE}/get-post?id=${postId}`);
        const post = await response.json();
        selectedPost = post;
        
        document.getElementById('modal-title').textContent = 'Editar Post';
        document.getElementById('modal-body').innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; color: var(--text-dim); font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Título</label>
                    <input type="text" id="edit-title" value="${post.title}" 
                           style="width: 100%; padding: 0.75rem; background: rgba(255,255,255,0.05); border: 1px solid var(--border-glass); border-radius: 8px; color: var(--text-primary); font-family: 'Outfit', sans-serif; font-size: 1rem;">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; color: var(--text-dim); font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Descripción</label>
                    <textarea id="edit-description" rows="4"
                              style="width: 100%; padding: 0.75rem; background: rgba(255,255,255,0.05); border: 1px solid var(--border-glass); border-radius: 8px; color: var(--text-primary); font-family: 'Outfit', sans-serif; font-size: 0.95rem; resize: vertical;">${post.description || ''}</textarea>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--text-dim); font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Fecha</label>
                        <input type="date" id="edit-date" value="${post.date}"
                               style="width: 100%; padding: 0.75rem; background: rgba(255,255,255,0.05); border: 1px solid var(--border-glass); border-radius: 8px; color: var(--text-primary); font-family: 'Outfit', sans-serif;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--text-dim); font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Hora</label>
                        <input type="time" id="edit-time" value="${post.time}"
                               style="width: 100%; padding: 0.75rem; background: rgba(255,255,255,0.05); border: 1px solid var(--border-glass); border-radius: 8px; color: var(--text-primary); font-family: 'Outfit', sans-serif;">
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--text-dim); font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Tipo</label>
                        <select id="edit-type"
                                style="width: 100%; padding: 0.75rem; background: rgba(255,255,255,0.05); border: 1px solid var(--border-glass); border-radius: 8px; color: var(--text-primary); font-family: 'Outfit', sans-serif; cursor: pointer;">
                            <option value="feed" ${post.type === 'feed' ? 'selected' : ''}>Feed</option>
                            <option value="story" ${post.type === 'story' ? 'selected' : ''}>Story</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--text-dim); font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Plataforma</label>
                        <select id="edit-platform"
                                style="width: 100%; padding: 0.75rem; background: rgba(255,255,255,0.05); border: 1px solid var(--border-glass); border-radius: 8px; color: var(--text-primary); font-family: 'Outfit', sans-serif; cursor: pointer;">
                            <option value="both" ${post.platform === 'both' ? 'selected' : ''}>Facebook + Instagram</option>
                            <option value="facebook" ${post.platform === 'facebook' ? 'selected' : ''}>Facebook</option>
                            <option value="instagram" ${post.platform === 'instagram' ? 'selected' : ''}>Instagram</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; color: var(--text-dim); font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Estado</label>
                    <div style="padding: 0.75rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); border-radius: 8px;">
                        <div class="post-status-badge ${post.status}">${post.status}</div>
                    </div>
                </div>
                
                ${post.image_url ? `
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; color: var(--text-dim); font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Imagen</label>
                    <img src="${post.image_url}" alt="Post image" style="width: 100%; border-radius: 8px; border: 1px solid var(--border-glass);">
                </div>
                ` : ''}
            </div>
        `;
        document.querySelector('.modal-footer').style.display = 'flex';
        document.getElementById('post-modal').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading post detail:', error);
    }
}

async function savePost() {
    if (!selectedPost) return;
    
    const updatedPost = {
        title: document.getElementById('edit-title').value,
        description: document.getElementById('edit-description').value,
        date: document.getElementById('edit-date').value,
        time: document.getElementById('edit-time').value,
        type: document.getElementById('edit-type').value,
        platform: document.getElementById('edit-platform').value
    };
    
    try {
        await fetch(`${API_BASE}/update-post?id=${selectedPost.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedPost)
        });
        
        closeModal();
        await loadCalendar();
        addActivityLogItem('✏️ Post actualizado: ' + updatedPost.title);
    } catch (error) {
        console.error('Error saving post:', error);
        alert('Error al guardar el post');
    }
}

async function deletePost() {
    if (!selectedPost) return;
    
    if (!confirm(`¿Eliminar "${selectedPost.title}"?`)) return;
    
    try {
        await fetch(`${API_BASE}/delete-post?id=${selectedPost.id}`, {
            method: 'DELETE'
        });
        
        closeModal();
        await loadCalendar();
        addActivityLogItem('🗑️ Post eliminado: ' + selectedPost.title);
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('Error al eliminar el post');
    }
}

function closeModal() {
    document.getElementById('post-modal').classList.add('hidden');
    selectedPost = null;
}

// === NAVIGATION ===
function updateCurrentMonth() {
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthStr = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    document.getElementById('current-month').textContent = monthStr;
}

async function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateCurrentMonth();
    await loadCalendar();
}

async function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateCurrentMonth();
    await loadCalendar();
}

// === QUICK ACTIONS ===
function createPost() {
    alert('Función de crear post próximamente');
}

async function pauseAllAds() {
    if (!confirm('¿Pausar todas las campañas activas?')) return;
    
    try {
        await fetch(`${API_BASE}/pause-all-ads`, { method: 'POST' });
        await loadCampaigns();
        addActivityLogItem('⏸ Todas las campañas pausadas');
    } catch (error) {
        console.error('Error pausing ads:', error);
        alert('Error al pausar campañas');
    }
}

async function exportReport() {
    try {
        const response = await fetch(`${API_BASE}/export-report`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fofostudio-report-${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
        addActivityLogItem('📥 Reporte exportado');
    } catch (error) {
        console.error('Error exporting report:', error);
        alert('Error al exportar reporte');
    }
}

async function syncCalendar() {
    const btn = event.target.closest('.action-btn');
    btn.style.opacity = '0.5';
    
    try {
        await fetch(`${API_BASE}/sync-calendar`, { method: 'POST' });
        await loadCalendar();
        addActivityLogItem('🔄 Calendario sincronizado con Google Sheets');
    } catch (error) {
        console.error('Error syncing calendar:', error);
        alert('Error al sincronizar calendario');
    } finally {
        btn.style.opacity = '1';
    }
}

// === ACTIVITY LOG ===
function updateActivityLog() {
    const log = document.getElementById('activity-log');
    const items = [
        { text: '✅ Dashboard cargado', time: 'Hace 1 min' },
        { text: '📊 Métricas actualizadas', time: 'Hace 5 min' },
        { text: '🔄 Calendario sincronizado', time: 'Hace 15 min' }
    ];
    
    log.innerHTML = items.map(item => `
        <div class="activity-item">
            ${item.text}
            <span class="activity-time">${item.time}</span>
        </div>
    `).join('');
}

function addActivityLogItem(text) {
    const log = document.getElementById('activity-log');
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `${text}<span class="activity-time">Ahora</span>`;
    log.insertBefore(item, log.firstChild);
    
    // Keep only last 5 items
    while (log.children.length > 5) {
        log.removeChild(log.lastChild);
    }
}

// === UTILITIES ===
function formatCurrency(value) {
    return new Intl.NumberFormat('es-CO', {
        maximumFractionDigits: 0
    }).format(value);
}

function formatNumber(value) {
    return new Intl.NumberFormat('es-CO').format(value);
}

// === EVENT LISTENERS ===
document.getElementById('ads-timeframe')?.addEventListener('change', loadAdsOverview);

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('post-modal').classList.contains('hidden')) {
        closeModal();
    }
});
