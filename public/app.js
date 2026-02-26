// === STATE ===
// API_BASE is defined in auth.js (loaded first)
let currentTab = 'pautas';
let currentDate = new Date();
let currentCalendarView = 'week'; // 'month', 'week', 'day'
let calendarData = [];
let selectedPost = null;
let recommendations = [];

// === UTILITY FUNCTIONS ===
// Convert 24h time to 12h with AM/PM
function formatTime12h(time24) {
    if (!time24) return '—';
    
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'pm' : 'am';
    const hours12 = hours % 12 || 12;
    
    return `${hours12}:${String(minutes).padStart(2, '0')}<span style="font-size: 0.7em; opacity: 0.7; margin-left: 2px;">${period}</span>`;
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initDashboard();
});

async function initAuth() {
    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        const success = await googleAuth.handleCallback(code);
        if (success) {
            updateGoogleAuthStatus();
            // Reload data with new auth
            await initDashboard();
        }
        return;
    }
    
    // Update auth status
    updateGoogleAuthStatus();
    
    // Setup auth button click
    document.getElementById('google-auth-pill').addEventListener('click', handleGoogleAuthClick);
}

function updateGoogleAuthStatus() {
    const statusEl = document.getElementById('google-auth-status');
    const pillEl = document.getElementById('google-auth-pill');
    
    if (googleAuth.isAuthenticated()) {
        const user = googleAuth.getUser();
        statusEl.textContent = '✓';
        pillEl.title = `Conectado como ${user.email}`;
        pillEl.style.background = 'rgba(34, 197, 94, 0.15)';
        pillEl.style.borderColor = 'rgba(34, 197, 94, 0.3)';
    } else {
        statusEl.textContent = 'Login';
        pillEl.title = 'Click para conectar Google Drive & Sheets';
        pillEl.style.background = 'rgba(245, 158, 11, 0.15)';
        pillEl.style.borderColor = 'rgba(245, 158, 11, 0.3)';
    }
}

function handleGoogleAuthClick() {
    if (googleAuth.isAuthenticated()) {
        // Show logout confirmation
        if (confirm('¿Cerrar sesión de Google?')) {
            googleAuth.logout();
        }
    } else {
        googleAuth.login();
    }
}

async function initDashboard() {
    await Promise.all([
        loadAdsOverview(),
        loadCampaigns(),
        loadCalendar(),
        loadRecommendations()
    ]);
    updateActivityLog();
    updateCalendarHeader();
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
        <div class="campaign-item ${campaign.status.toLowerCase()}" 
             onclick="showCampaignDetail('${campaign.id}')"
             style="cursor: pointer; transition: all 0.2s ease;">
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
    
    container.innerHTML = campaignsHTML + '<div id="campaign-detail-container"></div>';
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
        const response = await fetchWithAuth(`${API_BASE}/calendar-month?year=${year}&month=${month}`);
        const data = await response.json();
        
        calendarData = data.posts;
        renderCalendar();
    } catch (error) {
        console.error('Error loading calendar:', error);
        calendarData = [];
        renderCalendar();
    }
}





function showDayPosts(dateStr) {
    const dayPosts = calendarData.filter(post => post.date === dateStr);
    if (dayPosts.length === 0) return;
    
    // Sort by time (earliest first)
    dayPosts.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    
    const date = new Date(dateStr);
    const formattedDate = date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const typeIcons = {
        feed: '📱',
        story: '📲',
        reel: '🎬',
        carousel: '🎠'
    };
    
    const typeLabels = {
        feed: 'Feed',
        story: 'Historia',
        reel: 'Reel',
        carousel: 'Carrusel'
    };
    
    const platformLabels = {
        both: 'FB + IG',
        facebook: 'Facebook',
        instagram: 'Instagram'
    };
    
    const postsHTML = dayPosts.map(post => `
        <div class="post-item ${post.type}" onclick="showPostDetail('${post.id}')">
            <div class="post-content">
                <div class="post-title">${typeIcons[post.type] || ''} ${post.title}</div>
                <div class="post-meta">${formatTime12h(post.time)} ${typeLabels[post.type]} • ${platformLabels[post.platform] || post.platform}</div>
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
        const response = await fetchWithAuth(`${API_BASE}/get-post?id=${postId}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error loading post:', errorData);
            alert('Error al cargar el post: ' + (errorData.error || 'Error desconocido'));
            return;
        }
        
        const post = await response.json();
        selectedPost = post;
        
        const typeLabels = {
            feed: 'Feed Post',
            story: 'Historia',
            reel: 'Reel',
            carousel: 'Carrusel'
        };
        
        document.getElementById('modal-title').textContent = 'Editar Post';
        
        // Add wide class to modal
        const modal = document.getElementById('post-modal');
        const modalContent = modal.querySelector('.modal-content');
        modalContent.classList.add('modal-wide');
        
        const modalBody = document.getElementById('modal-body');
        modalBody.className = 'modal-body with-preview';
        modalBody.innerHTML = `
            <div class="post-preview">
                <div class="post-preview-type ${post.type}">
                    <div class="type-dot"></div>
                    <span>${typeLabels[post.type] || post.type}</span>
                </div>
                
                <div class="post-preview-image ${post.type}">
                    ${post.image_url ? `<img src="${post.image_url}" alt="${post.title}" id="preview-image">` : `<div class="post-preview-placeholder" id="preview-image">📸<br>Sin imagen</div>`}
                </div>
                
                <button class="btn btn-regenerate" onclick="regenerateImage(event)" style="width: 100%; margin-top: 0.75rem; background: linear-gradient(135deg, #a78bfa, #8b5cf6); border: none; padding: 0.75rem; border-radius: 8px; color: white; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                    <span>🎨 Regenerar Pieza con IA</span>
                </button>
                
                <button class="btn btn-secondary" onclick="uploadImageFromPC()" style="width: 100%; margin-top: 0.5rem; padding: 0.75rem; border-radius: 8px; font-weight: 600;">
                    <span>📤 Subir desde PC</span>
                </button>
                
                <button class="btn btn-secondary" onclick="changeImageManually()" style="width: 100%; margin-top: 0.5rem; padding: 0.75rem; border-radius: 8px; font-weight: 600;">
                    <span>🖼️ Cambiar URL de Imagen</span>
                </button>
                
                <input type="file" id="image-upload-input" accept="image/*" style="display: none;" onchange="handleImageUpload(event)">
                
                <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 0.75rem;">
                    <strong>Plataforma:</strong> ${post.platform}<br>
                    <strong>Fecha:</strong> ${post.date} ${formatTime12h(post.time)}<br>
                    <strong>Estado:</strong> <span class="post-status-badge ${post.status}">${post.status}</span>
                </div>
            </div>
            
            <div class="post-form">
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
                            <option value="feed" ${post.type === 'feed' ? 'selected' : ''}>Feed Post</option>
                            <option value="story" ${post.type === 'story' ? 'selected' : ''}>Historia</option>
                            <option value="reel" ${post.type === 'reel' ? 'selected' : ''}>Reel</option>
                            <option value="carousel" ${post.type === 'carousel' ? 'selected' : ''}>Carrusel</option>
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
                
                </div>
            </div>
        `;
        
        // Update modal footer with dynamic buttons
        const modalFooter = document.querySelector('.modal-footer');
        const isPublished = post.status === 'published';
        
        modalFooter.innerHTML = `
            <button class="btn btn-secondary" onclick="closeModal()">
                <span>← Volver</span>
            </button>
            <div style="display: flex; gap: 0.75rem; margin-left: auto;">
                ${!isPublished ? `
                    <button class="btn btn-success" onclick="publishNow()" style="background: linear-gradient(135deg, #22c55e, #16a34a);">
                        <span>🚀 Publicar Ya</span>
                    </button>
                ` : ''}
                <button class="btn btn-danger" onclick="deletePost()">Eliminar</button>
                <button class="btn btn-primary" onclick="savePost()">Guardar</button>
            </div>
        `;
        
        modalFooter.style.display = 'flex';
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
        await fetchWithAuth(`${API_BASE}/update-post?id=${selectedPost.id}`, {
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
        await fetchWithAuth(`${API_BASE}/delete-post?id=${selectedPost.id}`, {
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

async function publishNow() {
    if (!selectedPost) return;
    
    if (!confirm(`¿Publicar "${selectedPost.title}" AHORA en ${selectedPost.platform}?`)) return;
    
    try {
        // Show loading state
        const publishBtn = event.target.closest('.btn');
        const originalText = publishBtn.innerHTML;
        publishBtn.innerHTML = '<span>⏳ Publicando...</span>';
        publishBtn.disabled = true;
        
        const response = await fetchWithAuth(`${API_BASE}/publish-now`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                post_id: selectedPost.id,
                sheet_name: selectedPost.sheet_name,
                row_index: selectedPost.row_index,
                description: selectedPost.description,
                hashtags: selectedPost.hashtags || '',
                image_url: selectedPost.image_url,
                platform: selectedPost.platform,
                type: selectedPost.type
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Error al publicar');
        }
        
        closeModal();
        await loadCalendar();
        addActivityLogItem(`🚀 Post publicado: ${selectedPost.title.substring(0, 50)}...`);
        alert('✅ Post publicado exitosamente!\n\n' + (result.message || 'Publicado en ' + selectedPost.platform));
        
    } catch (error) {
        console.error('Error publishing post:', error);
        alert('❌ Error al publicar: ' + error.message);
        
        // Restore button
        const publishBtn = event.target.closest('.btn');
        publishBtn.innerHTML = '<span>🚀 Publicar Ya</span>';
        publishBtn.disabled = false;
    }
}

function closeModal() {
    const modal = document.getElementById('post-modal');
    modal.classList.add('hidden');
    modal.querySelector('.modal-content').classList.remove('modal-wide');
    document.getElementById('modal-body').className = 'modal-body';
    selectedPost = null;
}

// === NAVIGATION ===



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
        await fetchWithAuth(`${API_BASE}/sync-calendar`, { method: 'POST' });
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
    if (!log) return; // Protect against null - element doesn't exist in current layout
    
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
    if (!log) return; // Protect against null
    
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

// === TABS ===
function switchTab(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabName}`);
    });
    
    // Load tab-specific data
    if (tabName === 'pautas') {
        loadRecommendations();
    } else if (tabName === 'boveda') {
        loadBoveda();
    }
}

// === RECOMMENDATIONS ===
async function loadRecommendations() {
    try {
        const response = await fetch(`${API_BASE}/recommendations`);
        const data = await response.json();
        recommendations = data.recommendations || [];
        renderRecommendations();
    } catch (error) {
        console.error('Error loading recommendations:', error);
        renderRecommendations([]);
    }
}

function renderRecommendations() {
    const container = document.getElementById('recommendations-list');
    
    if (recommendations.length === 0) {
        container.innerHTML = '<div class="activity-item">No hay recomendaciones en este momento</div>';
        return;
    }
    
    const html = recommendations.map(rec => `
        <div class="recommendation-item">
            <div class="recommendation-header">
                <span class="recommendation-icon">${rec.icon || '💡'}</span>
                <span class="recommendation-priority ${rec.priority}">${rec.priority}</span>
            </div>
            <div class="recommendation-title">${rec.title}</div>
            <div class="recommendation-description">${rec.description}</div>
            <div class="recommendation-actions">
                <button class="btn-execute" onclick="executeRecommendation('${rec.id}')">
                    Ejecutar
                </button>
                <button class="btn-dismiss" onclick="dismissRecommendation('${rec.id}')">
                    Descartar
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

async function executeRecommendation(recId) {
    const rec = recommendations.find(r => r.id === recId);
    if (!rec) return;
    
    if (!confirm(`¿Ejecutar: ${rec.title}?`)) return;
    
    try {
        const response = await fetch(`${API_BASE}/execute-recommendation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recommendation_id: recId })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Error al ejecutar recomendación');
        }
        
        alert('✅ Recomendación ejecutada exitosamente!');
        await loadRecommendations();
        await loadCampaigns();
        addActivityLogItem(`✓ Ejecutado: ${rec.title}`);
        
    } catch (error) {
        console.error('Error executing recommendation:', error);
        alert('❌ Error: ' + error.message);
    }
}

function dismissRecommendation(recId) {
    recommendations = recommendations.filter(r => r.id !== recId);
    renderRecommendations();
    addActivityLogItem('✕ Recomendación descartada');
}

// === BOVEDA DE CONTENIDO ===
async function loadBoveda() {
    try {
        const filter = document.getElementById('boveda-filter').value;
        const response = await fetchWithAuth(`${API_BASE}/assets?filter=${filter}`);
        
        // Handle auth errors
        if (response.status === 401) {
            console.warn('Assets endpoint requires authentication');
            const container = document.getElementById('assets-grid');
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
                        <div style="margin-bottom: 1rem;">Autenticación requerida</div>
                        <div style="font-size: 0.9em; opacity: 0.7;">Inicia sesión con Google para acceder a la bóveda de contenido</div>
                    </div>
                `;
            }
            return;
        }
        
        const data = await response.json();
        renderAssets(data.assets || []);
    } catch (error) {
        console.error('Error loading assets:', error);
        renderAssets([]);
    }
}

function renderAssets(assets) {
    const container = document.getElementById('assets-grid');
    
    if (assets.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📂</div>
                <div>No hay assets en esta carpeta</div>
            </div>
        `;
        return;
    }
    
    const html = assets.map(asset => {
        const statusBadge = asset.usedInCalendar 
            ? `<div class="asset-status in-calendar" title="Usado en: ${asset.postTitle}">✓ En Calendario</div>`
            : `<div class="asset-status available">Disponible</div>`;
        
        const aspectBadge = asset.aspectRatio 
            ? `<div class="asset-aspect-badge">${asset.aspectRatio}</div>`
            : '';
        
        const recommendedType = asset.recommendedType
            ? `<div class="asset-recommended-type ${asset.recommendedType}">${getTypeLabel(asset.recommendedType)}</div>`
            : '';
        
        const dimensions = asset.width && asset.height
            ? `${asset.width}×${asset.height}`
            : '';
        
        const createButton = !asset.usedInCalendar
            ? `<button class="asset-create-btn" onclick="event.stopPropagation(); openCreatePostModal('${asset.id}', '${escapeHtml(asset.name)}', '${asset.url}', '${asset.recommendedType || 'feed'}', '${asset.aspectRatio || ''}')">
                + Crear Publicación
               </button>`
            : '';
        
        return `
            <div class="asset-card ${asset.usedInCalendar ? 'used' : 'available'}" 
                 onclick="showAssetDetail('${asset.id}', ${JSON.stringify(asset).replace(/"/g, '&quot;')})">
                ${statusBadge}
                ${aspectBadge}
                <img src="${asset.thumbnail || asset.url}" 
                     alt="${asset.name}" 
                     class="asset-thumbnail"
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23222%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23666%22%3E📄%3C/text%3E%3C/svg%3E'">
                <div class="asset-info">
                    <div class="asset-name" title="${asset.name}">${asset.name}</div>
                    <div class="asset-meta">
                        ${asset.type} • ${asset.size || 'N/A'}
                        ${dimensions ? ` • ${dimensions}` : ''}
                    </div>
                    ${recommendedType}
                </div>
                ${createButton}
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAssetDetail(assetId, assetData) {
    const asset = typeof assetData === 'string' ? JSON.parse(assetData) : assetData;
    
    const detailHTML = `
        <div style="padding: 2rem;">
            <h3 style="margin-bottom: 1.5rem; color: var(--text-primary);">${asset.name}</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div><strong>Tipo:</strong> ${asset.type}</div>
                <div><strong>Tamaño:</strong> ${asset.size}</div>
                <div><strong>Dimensiones:</strong> ${asset.width}×${asset.height || 'N/A'}</div>
                <div><strong>Aspect Ratio:</strong> ${asset.aspectRatio || 'N/A'}</div>
                <div><strong>Recomendado:</strong> ${asset.recommendedType ? getTypeLabel(asset.recommendedType) : 'N/A'}</div>
                <div><strong>Estado:</strong> ${asset.usedInCalendar ? '✓ En Calendario' : 'Disponible'}</div>
            </div>
            <div style="text-align: center; margin: 2rem 0;">
                <img src="${asset.url}" style="max-width: 100%; max-height: 400px; border-radius: 12px;" alt="${asset.name}">
            </div>
            ${asset.usedInCalendar ? `
                <div style="padding: 1rem; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 8px; margin-top: 1rem;">
                    <strong>Usado en:</strong> ${asset.postTitle} (${asset.postDate})
                </div>
            ` : `
                <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" 
                        onclick="openCreatePostModal('${asset.id}', '${escapeHtml(asset.name)}', '${asset.url}', '${asset.recommendedType || 'feed'}', '${asset.aspectRatio || ''}')">
                    + Crear Publicación con este Asset
                </button>
            `}
            <button class="btn btn-secondary" style="width: 100%; margin-top: 0.5rem;" onclick="closeModal()">
                Cerrar
            </button>
        </div>
    `;
    
    showModal('Detalle del Asset', detailHTML);
}

function openCreatePostModal(assetId, assetName, assetUrl, recommendedType, aspectRatio) {
    const today = new Date().toISOString().split('T')[0];
    
    const modalHTML = `
        <div style="padding: 2rem;">
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <img src="${assetUrl}" style="max-width: 100%; max-height: 200px; border-radius: 12px;" alt="${assetName}">
                <div style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);">${assetName}</div>
                ${aspectRatio ? `<div style="margin-top: 0.25rem; font-size: 0.75rem; color: var(--text-dim);">Ratio: ${aspectRatio}</div>` : ''}
            </div>
            
            <form id="create-post-form" onsubmit="handleCreatePostSubmit(event, '${assetId}', '${assetUrl}', '${assetName}')">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Fecha *</label>
                    <input type="date" id="post-date" value="${today}" required 
                           style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-glass); border-radius: 8px; color: var(--text-primary);">
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Hora</label>
                    <input type="time" id="post-time" value="12:00" 
                           style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-glass); border-radius: 8px; color: var(--text-primary);">
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Tipo de Publicación *</label>
                    <select id="post-type" required 
                            style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-glass); border-radius: 8px; color: var(--text-primary);">
                        <option value="feed" ${recommendedType === 'feed' ? 'selected' : ''}>📱 Feed Post</option>
                        <option value="story" ${recommendedType === 'story' ? 'selected' : ''}>📲 Historia</option>
                        <option value="reel" ${recommendedType === 'reel' ? 'selected' : ''}>🎬 Reel</option>
                        <option value="carousel" ${recommendedType === 'carousel' ? 'selected' : ''}>🎠 Carrusel</option>
                    </select>
                    ${recommendedType ? `<div style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--accent-orange);">✨ Recomendado según aspect ratio</div>` : ''}
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Plataforma *</label>
                    <select id="post-platform" required 
                            style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-glass); border-radius: 8px; color: var(--text-primary);">
                        <option value="both">Facebook + Instagram</option>
                        <option value="facebook">Solo Facebook</option>
                        <option value="instagram">Solo Instagram</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Título / Mensaje *</label>
                    <textarea id="post-title" required rows="3" placeholder="Escribe el mensaje principal..." 
                              style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-glass); border-radius: 8px; color: var(--text-primary); resize: vertical;"></textarea>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Descripción / Copy adicional</label>
                    <textarea id="post-description" rows="2" placeholder="Detalles adicionales (opcional)..." 
                              style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-glass); border-radius: 8px; color: var(--text-primary); resize: vertical;"></textarea>
                </div>
                
                <div style="display: flex; gap: 0.5rem;">
                    <button type="submit" class="btn btn-primary" style="flex: 1;">
                        ✓ Crear Publicación
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    `;
    
    showModal('+ Crear Publicación', modalHTML);
}

async function handleCreatePostSubmit(event, assetId, assetUrl, assetName) {
    event.preventDefault();
    
    const date = document.getElementById('post-date').value;
    const time = document.getElementById('post-time').value;
    const type = document.getElementById('post-type').value;
    const platform = document.getElementById('post-platform').value;
    const title = document.getElementById('post-title').value;
    const description = document.getElementById('post-description').value;
    
    try {
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Creando...';
        
        const response = await fetchWithAuth(`${API_BASE}/create-post-from-asset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                assetId,
                assetUrl,
                assetName,
                date,
                time,
                title,
                description,
                type,
                platform
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Error al crear publicación');
        }
        
        closeModal();
        alert('✅ Publicación creada exitosamente!');
        
        // Reload calendar and boveda
        await loadCalendar();
        await loadBoveda();
        addActivityLogItem(`📅 Nueva publicación: ${title.substring(0, 40)}...`);
        
    } catch (error) {
        console.error('Error creating post:', error);
        alert('❌ Error: ' + error.message);
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '✓ Crear Publicación';
    }
}

function showModal(title, content) {
    const modal = document.getElementById('post-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    modal.classList.remove('hidden');
}

function closeModal() {
    const modal = document.getElementById('post-modal');
    modal.classList.add('hidden');
}

async function refreshBoveda() {
    const btn = event.target.closest('.btn-icon');
    btn.style.transform = 'rotate(360deg)';
    await loadBoveda();
    setTimeout(() => {
        btn.style.transform = '';
    }, 600);
}

// Event listener for boveda filter
document.addEventListener('DOMContentLoaded', () => {
    const bovedaFilter = document.getElementById('boveda-filter');
    if (bovedaFilter) {
        bovedaFilter.addEventListener('change', loadBoveda);
    }
});

async function regenerateImage(event) {
    if (!selectedPost) return;
    
    if (!confirm(`¿Regenerar pieza gráfica para "${selectedPost.title}"?\n\nEsto tomará 30-90 segundos.`)) return;
    
    let regenerateBtn = null;
    let originalHTML = '';
    
    try {
        // Show loading state
        if (event && event.target) {
            regenerateBtn = event.target.closest('.btn-regenerate');
            if (regenerateBtn) {
                originalHTML = regenerateBtn.innerHTML;
                regenerateBtn.innerHTML = '<span>⏳ Generando...</span>';
                regenerateBtn.disabled = true;
            }
        }
        
        // Update preview with loading spinner
        const previewImage = document.getElementById('preview-image');
        let originalPreview = '';
        if (previewImage) {
            originalPreview = previewImage.innerHTML;
            previewImage.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 1rem;">
                    <div style="font-size: 3rem;">⏳</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">Generando con IA...</div>
                    <div style="color: var(--text-dim); font-size: 0.8rem; margin-top: 0.5rem;">Puede tomar hasta 90 segundos</div>
                </div>
            `;
        }
        
        const response = await fetchWithAuth(`${API_BASE}/regenerate-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                post_id: selectedPost.id,
                sheet_name: selectedPost.sheet_name,
                row_index: selectedPost.row_index,
                description: selectedPost.description,
                type: selectedPost.type,
                platform: selectedPost.platform
            })
        });
        
        // Handle timeout or HTML error pages
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Timeout o error del servidor. La generación puede tomar más tiempo. Por favor espera 1-2 minutos e intenta recargar.');
        }
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Error al regenerar imagen');
        }
        
        // Update preview with new image
        if (previewImage) {
            previewImage.innerHTML = `<img src="${result.direct_url}" alt="Nueva pieza generada">`;
        }
        
        // Update selectedPost
        selectedPost.image_url = result.direct_url;
        
        // Success notification
        alert(`✅ ¡Pieza regenerada exitosamente!\n\n📁 Guardada en Google Drive\n📊 Actualizada en Sheets`);
        
        // Reload calendar to show updated image
        await loadCalendar();
        addActivityLogItem(`🎨 Pieza regenerada: ${selectedPost.title.substring(0, 40)}...`);
        
        // Restore button
        if (regenerateBtn) {
            regenerateBtn.innerHTML = originalHTML || '<span>🎨 Regenerar Pieza</span>';
            regenerateBtn.disabled = false;
        }
        
    } catch (error) {
        console.error('Error regenerating image:', error);
        
        let errorMsg = error.message;
        if (error.message.includes('JSON') || error.message.includes('Unexpected token')) {
            errorMsg = 'Timeout del servidor (504). La generación puede estar en progreso. Espera 1-2 minutos y recarga para ver si la imagen se actualizó.';
        }
        
        alert('❌ Error al regenerar:\n\n' + errorMsg);
        
        // Restore button
        if (regenerateBtn) {
            regenerateBtn.innerHTML = originalHTML || '<span>🎨 Regenerar Pieza</span>';
            regenerateBtn.disabled = false;
        }
        
        // Restore original preview if it exists
        const previewImage = document.getElementById('preview-image');
        if (previewImage) {
            if (selectedPost.image_url) {
                previewImage.innerHTML = `<img src="${selectedPost.image_url}" alt="${selectedPost.title}">`;
            } else {
                previewImage.innerHTML = '📸<br>Sin imagen';
            }
        }
    }
}

// === CHANGE IMAGE MANUALLY ===
async function changeImageManually() {
    if (!selectedPost) return;
    
    const newImageUrl = prompt('Ingresa la URL de la nueva imagen:\n\n(Puede ser desde Google Drive, Catbox, o cualquier URL pública)', selectedPost.image_url || '');
    
    if (!newImageUrl) return; // User cancelled
    
    try {
        // Show loading
        const previewImage = document.getElementById('preview-image');
        if (previewImage) {
            const originalPreview = previewImage.innerHTML;
            previewImage.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 1rem;">
                    <div style="font-size: 3rem;">⏳</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">Actualizando imagen...</div>
                </div>
            `;
        }
        
        const response = await fetchWithAuth(`${API_BASE}/update-post-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                post_id: selectedPost.id,
                image_url: newImageUrl
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Error al actualizar imagen');
        }
        
        // Update preview
        if (previewImage) {
            previewImage.innerHTML = `<img src="${newImageUrl}" alt="${selectedPost.title}">`;
        }
        
        // Update selectedPost
        selectedPost.image_url = newImageUrl;
        
        alert('✅ Imagen actualizada exitosamente!');
        
        // Reload calendar
        await loadCalendar();
        addActivityLogItem(`🖼️ Imagen cambiada: ${selectedPost.title.substring(0, 40)}...`);
        
    } catch (error) {
        console.error('Error changing image:', error);
        alert('❌ Error al cambiar imagen: ' + error.message);
        
        // Restore original preview
        const previewImage = document.getElementById('preview-image');
        if (previewImage && selectedPost.image_url) {
            previewImage.innerHTML = `<img src="${selectedPost.image_url}" alt="${selectedPost.title}">`;
        }
    }
}

// === UPLOAD IMAGE FROM PC ===
function uploadImageFromPC() {
    if (!selectedPost) return;
    document.getElementById('image-upload-input').click();
}

async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!selectedPost) return;
    
    try {
        // Show loading
        const previewImage = document.getElementById('preview-image');
        if (previewImage) {
            previewImage.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 1rem;">
                    <div style="font-size: 3rem;">⏳</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">Procesando imagen...</div>
                </div>
            `;
        }
        
        // Read file as data URL
        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = new Image();
            img.onload = async () => {
                // Detect expected aspect ratio based on post type
                const expectedRatio = getExpectedAspectRatio(selectedPost.type);
                const currentRatio = img.width / img.height;
                
                // Check if crop is needed (tolerance 0.05)
                const needsCrop = Math.abs(currentRatio - expectedRatio.decimal) > 0.05;
                
                if (needsCrop) {
                    // Show crop modal
                    showCropModal(img, expectedRatio, file.name);
                } else {
                    // Upload directly
                    await uploadImageToServer(e.target.result, file.name);
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        
    } catch (error) {
        console.error('Error uploading image:', error);
        alert('❌ Error al subir imagen: ' + error.message);
    }
    
    // Clear input
    event.target.value = '';
}

function getExpectedAspectRatio(postType) {
    const ratios = {
        story: { label: '9:16', decimal: 9/16 },
        reel: { label: '9:16', decimal: 9/16 },
        feed: { label: '4:5', decimal: 4/5 },
        carousel: { label: '1:1', decimal: 1.0 }
    };
    return ratios[postType] || { label: '4:5', decimal: 4/5 };
}

function showCropModal(img, expectedRatio, fileName) {
    const modalHTML = `
        <div style="padding: 2rem;">
            <h3 style="margin-bottom: 1rem; color: var(--text-primary);">Ajustar Proporción</h3>
            <div style="background: rgba(255, 117, 25, 0.1); border: 1px solid var(--accent-orange); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
                <div style="font-size: 0.85rem; color: var(--text-primary);">
                    📐 La imagen debe ser <strong>${expectedRatio.label}</strong> para posts tipo <strong>${selectedPost.type}</strong>
                </div>
            </div>
            
            <div style="position: relative; max-width: 100%; max-height: 500px; overflow: hidden; background: #000; border-radius: 12px; margin-bottom: 1.5rem;">
                <canvas id="crop-canvas" style="max-width: 100%; height: auto; cursor: move;"></canvas>
            </div>
            
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-primary" onclick="applyCrop()" style="flex: 1;">
                    ✓ Aplicar Recorte
                </button>
                <button class="btn btn-secondary" onclick="closeModal()">
                    Cancelar
                </button>
            </div>
        </div>
    `;
    
    showModal('Recortar Imagen', modalHTML);
    
    // Initialize crop canvas
    setTimeout(() => {
        initCropCanvas(img, expectedRatio);
    }, 100);
}

let cropState = {
    img: null,
    ratio: null,
    canvas: null,
    ctx: null,
    cropX: 0,
    cropY: 0,
    cropWidth: 0,
    cropHeight: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0
};

function initCropCanvas(img, expectedRatio) {
    const canvas = document.getElementById('crop-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to image size (max 600px width)
    const maxWidth = 600;
    const scale = img.width > maxWidth ? maxWidth / img.width : 1;
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    
    cropState.img = img;
    cropState.ratio = expectedRatio;
    cropState.canvas = canvas;
    cropState.ctx = ctx;
    
    // Calculate initial crop area (centered, max size with correct ratio)
    const imgRatio = img.width / img.height;
    
    if (imgRatio > expectedRatio.decimal) {
        // Image is wider than target ratio
        cropState.cropHeight = img.height;
        cropState.cropWidth = img.height * expectedRatio.decimal;
        cropState.cropX = (img.width - cropState.cropWidth) / 2;
        cropState.cropY = 0;
    } else {
        // Image is taller than target ratio
        cropState.cropWidth = img.width;
        cropState.cropHeight = img.width / expectedRatio.decimal;
        cropState.cropX = 0;
        cropState.cropY = (img.height - cropState.cropHeight) / 2;
    }
    
    drawCropPreview();
    
    // Add drag handlers
    canvas.addEventListener('mousedown', startDrag);
    canvas.addEventListener('mousemove', drag);
    canvas.addEventListener('mouseup', endDrag);
    canvas.addEventListener('mouseleave', endDrag);
}

function drawCropPreview() {
    const { img, ctx, canvas, cropX, cropY, cropWidth, cropHeight } = cropState;
    if (!img || !ctx) return;
    
    const scale = canvas.width / img.width;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw full image dimmed
    ctx.globalAlpha = 0.4;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Draw crop area bright
    ctx.globalAlpha = 1.0;
    ctx.drawImage(
        img,
        cropX, cropY, cropWidth, cropHeight,
        cropX * scale, cropY * scale, cropWidth * scale, cropHeight * scale
    );
    
    // Draw crop border
    ctx.strokeStyle = '#ff7519';
    ctx.lineWidth = 3;
    ctx.strokeRect(cropX * scale, cropY * scale, cropWidth * scale, cropHeight * scale);
    
    // Draw corners
    const cornerSize = 20;
    ctx.fillStyle = '#ff7519';
    const x = cropX * scale;
    const y = cropY * scale;
    const w = cropWidth * scale;
    const h = cropHeight * scale;
    
    // Top-left
    ctx.fillRect(x - 2, y - 2, cornerSize, 4);
    ctx.fillRect(x - 2, y - 2, 4, cornerSize);
    
    // Top-right
    ctx.fillRect(x + w - cornerSize + 2, y - 2, cornerSize, 4);
    ctx.fillRect(x + w - 2, y - 2, 4, cornerSize);
    
    // Bottom-left
    ctx.fillRect(x - 2, y + h - 2, cornerSize, 4);
    ctx.fillRect(x - 2, y + h - cornerSize + 2, 4, cornerSize);
    
    // Bottom-right
    ctx.fillRect(x + w - cornerSize + 2, y + h - 2, cornerSize, 4);
    ctx.fillRect(x + w - 2, y + h - cornerSize + 2, 4, cornerSize);
}

function startDrag(e) {
    cropState.isDragging = true;
    const rect = cropState.canvas.getBoundingClientRect();
    const scale = cropState.canvas.width / cropState.img.width;
    cropState.dragStartX = (e.clientX - rect.left) / scale - cropState.cropX;
    cropState.dragStartY = (e.clientY - rect.top) / scale - cropState.cropY;
}

function drag(e) {
    if (!cropState.isDragging) return;
    
    const rect = cropState.canvas.getBoundingClientRect();
    const scale = cropState.canvas.width / cropState.img.width;
    
    let newX = (e.clientX - rect.left) / scale - cropState.dragStartX;
    let newY = (e.clientY - rect.top) / scale - cropState.dragStartY;
    
    // Constrain to image bounds
    newX = Math.max(0, Math.min(newX, cropState.img.width - cropState.cropWidth));
    newY = Math.max(0, Math.min(newY, cropState.img.height - cropState.cropHeight));
    
    cropState.cropX = newX;
    cropState.cropY = newY;
    
    drawCropPreview();
}

function endDrag() {
    cropState.isDragging = false;
}

async function applyCrop() {
    const { img, cropX, cropY, cropWidth, cropHeight } = cropState;
    
    try {
        // Create cropped canvas
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = cropWidth;
        croppedCanvas.height = cropHeight;
        const croppedCtx = croppedCanvas.getContext('2d');
        
        croppedCtx.drawImage(
            img,
            cropX, cropY, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
        );
        
        // Convert to blob
        const blob = await new Promise(resolve => croppedCanvas.toBlob(resolve, 'image/jpeg', 0.92));
        
        // Convert to base64
        const reader = new FileReader();
        reader.onload = async (e) => {
            closeModal();
            await uploadImageToServer(e.target.result, 'cropped-image.jpg');
        };
        reader.readAsDataURL(blob);
        
    } catch (error) {
        console.error('Error applying crop:', error);
        alert('❌ Error al recortar imagen: ' + error.message);
    }
}

async function uploadImageToServer(base64Data, fileName) {
    try {
        // Show loading in preview
        const previewImage = document.getElementById('preview-image');
        if (previewImage) {
            previewImage.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 1rem;">
                    <div style="font-size: 3rem;">⏳</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">Subiendo a Google Drive...</div>
                </div>
            `;
        }
        
        const response = await fetchWithAuth(`${API_BASE}/upload-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                post_id: selectedPost.id,
                image_data: base64Data,
                file_name: fileName
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Error al subir imagen');
        }
        
        // Update preview
        if (previewImage) {
            previewImage.innerHTML = `<img src="${result.image_url}" alt="${selectedPost.title}">`;
        }
        
        // Update selectedPost
        selectedPost.image_url = result.image_url;
        
        alert('✅ Imagen subida y actualizada exitosamente!');
        
        // Reload calendar
        await loadCalendar();
        addActivityLogItem(`📤 Imagen subida: ${selectedPost.title.substring(0, 40)}...`);
        
    } catch (error) {
        console.error('Error uploading to server:', error);
        alert('❌ Error al subir: ' + error.message);
        
        // Restore original preview
        const previewImage = document.getElementById('preview-image');
        if (previewImage && selectedPost.image_url) {
            previewImage.innerHTML = `<img src="${selectedPost.image_url}" alt="${selectedPost.title}">`;
        }
    }
}

// === CAMPAIGN DETAIL ===
let selectedCampaignId = null;

async function showCampaignDetail(campaignId) {
    if (selectedCampaignId === campaignId) {
        // Close if clicking same campaign
        closeCampaignDetail();
        return;
    }
    
    selectedCampaignId = campaignId;
    const container = document.getElementById('campaign-detail-container');
    
    // Show loading
    container.innerHTML = `
        <div class="campaign-detail">
            <div style="text-align: center; padding: 2rem;">
                <div class="loading-spinner" style="margin: 0 auto;"></div>
                <div style="margin-top: 1rem; color: var(--text-secondary);">Cargando detalles...</div>
            </div>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_BASE}/campaign-detail?campaign_id=${campaignId}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al cargar detalles');
        }
        
        renderCampaignDetail(data);
        
    } catch (error) {
        console.error('Error loading campaign detail:', error);
        showToast('Error al cargar detalles de la campaña', 'error');
        closeCampaignDetail();
    }
}

function renderCampaignDetail(data) {
    const container = document.getElementById('campaign-detail-container');
    const campaign = data.campaign;
    const ads = data.ads || [];
    
    container.innerHTML = `
        <div class="campaign-detail">
            <div class="campaign-detail-header">
                <div class="campaign-detail-title">📊 ${campaign.name}</div>
                <button class="campaign-detail-close" onclick="closeCampaignDetail()">Cerrar ✕</button>
            </div>
            
            <div class="campaign-metrics-grid">
                <div class="campaign-metric">
                    <div class="campaign-metric-label">Spend</div>
                    <div class="campaign-metric-value">${formatCurrency(campaign.spend)}</div>
                </div>
                <div class="campaign-metric">
                    <div class="campaign-metric-label">Impresiones</div>
                    <div class="campaign-metric-value">${formatNumber(campaign.impressions || 0)}</div>
                </div>
                <div class="campaign-metric">
                    <div class="campaign-metric-label">Clicks</div>
                    <div class="campaign-metric-value">${formatNumber(campaign.clicks || 0)}</div>
                </div>
                <div class="campaign-metric">
                    <div class="campaign-metric-label">CTR</div>
                    <div class="campaign-metric-value">${(campaign.ctr || 0).toFixed(2)}%</div>
                </div>
                <div class="campaign-metric">
                    <div class="campaign-metric-label">CPC</div>
                    <div class="campaign-metric-value">${formatCurrency(campaign.cpc || 0)}</div>
                </div>
                <div class="campaign-metric">
                    <div class="campaign-metric-label">CPM</div>
                    <div class="campaign-metric-value">${formatCurrency(campaign.cpm || 0)}</div>
                </div>
            </div>
            
            ${ads.length > 0 ? `
                <div class="campaign-ads-list">
                    <div class="campaign-ads-header">
                        🎨 Anuncios (${ads.length})
                    </div>
                    ${ads.map(ad => `
                        <div class="ad-card">
                            <div class="ad-card-header">
                                <div class="ad-name">${ad.name}</div>
                                <div class="ad-status ${ad.status.toLowerCase()}">${ad.status}</div>
                            </div>
                            ${ad.creative ? `
                                <div class="ad-creative">
                                    ${ad.creative.image_url ? `
                                        <img src="${ad.creative.image_url}" 
                                             alt="Creative" 
                                             class="ad-creative-image"
                                             onerror="this.style.display='none'">
                                    ` : ''}
                                    <div class="ad-creative-info">
                                        ${ad.creative.title ? `
                                            <div class="ad-creative-title">${ad.creative.title}</div>
                                        ` : ''}
                                        ${ad.creative.body ? `
                                            <div class="ad-creative-body">${ad.creative.body}</div>
                                        ` : ''}
                                    </div>
                                </div>
                            ` : ''}
                            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border-glass);">
                                <div>
                                    <div style="font-size: 0.7rem; color: var(--text-dim);">Spend</div>
                                    <div style="font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">${formatCurrency(ad.spend || 0)}</div>
                                </div>
                                <div>
                                    <div style="font-size: 0.7rem; color: var(--text-dim);">Clicks</div>
                                    <div style="font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">${formatNumber(ad.clicks || 0)}</div>
                                </div>
                                <div>
                                    <div style="font-size: 0.7rem; color: var(--text-dim);">CTR</div>
                                    <div style="font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">${(ad.ctr || 0).toFixed(2)}%</div>
                                </div>
                                <div>
                                    <div style="font-size: 0.7rem; color: var(--text-dim);">CPC</div>
                                    <div style="font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">${formatCurrency(ad.cpc || 0)}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : '<div style="text-align: center; padding: 2rem; color: var(--text-dim);">No hay anuncios en esta campaña</div>'}
        </div>
    `;
    
    // Scroll to detail
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeCampaignDetail() {
    selectedCampaignId = null;
    const container = document.getElementById('campaign-detail-container');
    if (container) {
        container.innerHTML = '';
    }
}
