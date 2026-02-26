// === STATE ===
// API_BASE is defined in auth.js (loaded first)
let currentTab = 'pautas';
let currentDate = new Date();
let currentCalendarView = 'week'; // 'month', 'week', 'day'
let calendarData = [];
let selectedPost = null;
let recommendations = [];

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
                <div class="post-meta">${post.time} ${typeLabels[post.type]} • ${platformLabels[post.platform] || post.platform}</div>
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
                
                <button class="btn btn-regenerate" onclick="regenerateImage()" style="width: 100%; margin-top: 0.75rem; background: linear-gradient(135deg, #a78bfa, #8b5cf6); border: none; padding: 0.75rem; border-radius: 8px; color: white; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                    <span>🎨 Regenerar Pieza</span>
                </button>
                
                <div style="font-size: 0.8rem; color: var(--text-dim);">
                    <strong>Plataforma:</strong> ${post.platform}<br>
                    <strong>Fecha:</strong> ${post.date} ${post.time}<br>
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
        container.innerHTML = '<div class="activity-item">No hay assets disponibles</div>';
        return;
    }
    
    const html = assets.map(asset => `
        <div class="asset-card" onclick="showAssetDetail('${asset.id}')">
            <img src="${asset.thumbnail || asset.url}" 
                 alt="${asset.name}" 
                 class="asset-thumbnail"
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23222%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23666%22%3E📄%3C/text%3E%3C/svg%3E'">
            <div class="asset-info">
                <div class="asset-name">${asset.name}</div>
                <div class="asset-meta">${asset.type} • ${asset.size || 'N/A'}</div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function showAssetDetail(assetId) {
    // TODO: Implement asset detail view
    alert('Asset detail view coming soon!');
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

async function regenerateImage() {
    if (!selectedPost) return;
    
    if (!confirm(`¿Regenerar pieza gráfica para "${selectedPost.title}"?\n\nEsto tomará 30-60 segundos.`)) return;
    
    try {
        // Show loading state
        const regenerateBtn = event.target.closest('.btn-regenerate');
        const originalHTML = regenerateBtn.innerHTML;
        regenerateBtn.innerHTML = '<span>⏳ Generando...</span>';
        regenerateBtn.disabled = true;
        
        // Update preview with loading spinner
        const previewImage = document.getElementById('preview-image');
        const originalPreview = previewImage.innerHTML;
        previewImage.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 1rem;">
                <div style="font-size: 3rem;">⏳</div>
                <div style="color: var(--text-secondary); font-size: 0.9rem;">Generando con IA...</div>
            </div>
        `;
        
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
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Error al regenerar imagen');
        }
        
        // Update preview with new image
        previewImage.innerHTML = `<img src="${result.direct_url}" alt="Nueva pieza generada">`;
        
        // Update selectedPost
        selectedPost.image_url = result.direct_url;
        
        // Success notification
        alert(`✅ ¡Pieza regenerada exitosamente!\n\n📁 Guardada en Google Drive\n📊 Actualizada en Sheets`);
        
        // Reload calendar to show updated image
        await loadCalendar();
        addActivityLogItem(`🎨 Pieza regenerada: ${selectedPost.title.substring(0, 40)}...`);
        
        // Restore button
        regenerateBtn.innerHTML = originalHTML;
        regenerateBtn.disabled = false;
        
    } catch (error) {
        console.error('Error regenerating image:', error);
        alert('❌ Error al regenerar: ' + error.message);
        
        // Restore button and preview
        const regenerateBtn = event.target.closest('.btn-regenerate');
        regenerateBtn.innerHTML = '<span>🎨 Regenerar Pieza</span>';
        regenerateBtn.disabled = false;
        
        // Restore original preview if it exists
        if (selectedPost.image_url) {
            document.getElementById('preview-image').innerHTML = `<img src="${selectedPost.image_url}" alt="${selectedPost.title}">`;
        } else {
            document.getElementById('preview-image').innerHTML = '📸<br>Sin imagen';
        }
    }
}
