// === SETTINGS & HEALTH ===

let settingsLoaded = false;
let healthData = null;

async function openSettings() {
    const modal = document.getElementById('settings-modal');
    const body = document.getElementById('settings-body');
    
    // Load settings HTML if not loaded
    if (!settingsLoaded) {
        try {
            const response = await fetch('settings.html');
            const html = await response.text();
            body.innerHTML = html;
            settingsLoaded = true;
        } catch (error) {
            console.error('Error loading settings:', error);
            body.innerHTML = '<p>Error loading settings</p>';
        }
    }
    
    // Show modal
    modal.classList.remove('hidden');
    
    // Load health data
    await loadHealthData();
}

function closeSettingsModal() {
    document.getElementById('settings-modal').classList.add('hidden');
}

async function loadHealthData() {
    try {
        const response = await fetchWithAuth(`${API_BASE}/health-check`);
        healthData = await response.json();
        
        renderHealthOverview();
        updateConfigForms();
    } catch (error) {
        console.error('Error loading health data:', error);
    }
}

function renderHealthOverview() {
    if (!healthData) return;
    
    const container = document.getElementById('health-grid');
    if (!container) return;
    
    const services = [
        {
            name: 'Meta Ads',
            icon: '📊',
            data: healthData.meta
        },
        {
            name: 'Google OAuth',
            icon: '🔐',
            data: healthData.google_oauth
        },
        {
            name: 'Google Sheets',
            icon: '📊',
            data: healthData.google_sheets
        },
        {
            name: 'Google Drive',
            icon: '💾',
            data: healthData.google_drive
        }
    ];
    
    const html = services.map(service => {
        const status = service.data.status || 'unknown';
        const message = service.data.message || 'Unknown';
        
        return `
            <div class="health-card ${status}">
                <div class="health-card-title">${service.icon} ${service.name}</div>
                <div class="health-card-status">
                    <span class="status-badge ${status}">${getStatusLabel(status)}</span>
                </div>
                <div class="health-card-message">${message}</div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

function updateConfigForms() {
    if (!healthData) return;
    
    // Meta Ads
    updateMetaConfig();
    
    // Google OAuth
    updateGoogleOAuthConfig();
    
    // Google Sheets
    updateGoogleSheetsConfig();
    
    // Google Drive
    updateGoogleDriveConfig();
}

function updateMetaConfig() {
    const config = healthData.config.meta;
    const data = healthData.meta;
    
    // Status indicator
    const statusEl = document.getElementById('meta-status');
    if (statusEl) {
        const indicator = statusEl.querySelector('.status-indicator');
        const text = statusEl.querySelector('.status-text');
        
        indicator.className = `status-indicator ${data.status}`;
        text.textContent = getStatusLabel(data.status);
    }
    
    // Form fields
    const tokenEl = document.getElementById('meta-token');
    const accountIdEl = document.getElementById('meta-account-id');
    const accountNameEl = document.getElementById('meta-account-name');
    const accountStatusEl = document.getElementById('meta-account-status');
    
    if (tokenEl) tokenEl.value = config.access_token_set ? '••••••••' : '';
    if (accountIdEl) accountIdEl.value = config.ad_account_id || '';
    if (accountNameEl) accountNameEl.value = data.account_name || 'N/A';
    if (accountStatusEl) accountStatusEl.value = data.account_status || 'N/A';
}

function updateGoogleOAuthConfig() {
    const config = healthData.config.google_oauth;
    const data = healthData.google_oauth;
    
    // Status indicator
    const statusEl = document.getElementById('google-oauth-status');
    if (statusEl) {
        const indicator = statusEl.querySelector('.status-indicator');
        const text = statusEl.querySelector('.status-text');
        
        indicator.className = `status-indicator ${data.status}`;
        text.textContent = getStatusLabel(data.status);
    }
    
    // Form fields
    const clientIdEl = document.getElementById('google-client-id');
    const clientSecretEl = document.getElementById('google-client-secret');
    const redirectUriEl = document.getElementById('google-redirect-uri');
    const userEmailEl = document.getElementById('google-user-email');
    const userInfoEl = document.getElementById('google-user-info');
    const authBtn = document.getElementById('google-auth-btn');
    
    if (clientIdEl) clientIdEl.value = config.client_id_set ? '•••••••.apps.googleusercontent.com' : '';
    if (clientSecretEl) clientSecretEl.value = config.client_secret_set ? '••••••••' : '';
    if (redirectUriEl) redirectUriEl.value = config.redirect_uri || '';
    
    if (data.status === 'connected' && data.user_email) {
        if (userEmailEl) userEmailEl.value = data.user_email;
        if (userInfoEl) userInfoEl.style.display = 'block';
        if (authBtn) authBtn.textContent = 'Logout';
    } else {
        if (userInfoEl) userInfoEl.style.display = 'none';
        if (authBtn) authBtn.textContent = 'Login with Google';
    }
}

function updateGoogleSheetsConfig() {
    const config = healthData.config.google_sheets;
    const data = healthData.google_sheets;
    
    // Status indicator
    const statusEl = document.getElementById('sheets-status');
    if (statusEl) {
        const indicator = statusEl.querySelector('.status-indicator');
        const text = statusEl.querySelector('.status-text');
        
        indicator.className = `status-indicator ${data.status}`;
        text.textContent = getStatusLabel(data.status);
    }
    
    // Form fields
    const spreadsheetIdEl = document.getElementById('sheets-spreadsheet-id');
    const titleEl = document.getElementById('sheets-title');
    
    if (spreadsheetIdEl) spreadsheetIdEl.value = config.spreadsheet_id || '';
    if (titleEl) titleEl.value = data.spreadsheet_title || 'N/A';
}

function updateGoogleDriveConfig() {
    const data = healthData.google_drive;
    
    // Status indicator
    const statusEl = document.getElementById('drive-status');
    if (statusEl) {
        const indicator = statusEl.querySelector('.status-indicator');
        const text = statusEl.querySelector('.status-text');
        
        indicator.className = `status-indicator ${data.status}`;
        text.textContent = getStatusLabel(data.status);
    }
    
    // Form fields
    const usedEl = document.getElementById('drive-storage-used');
    const limitEl = document.getElementById('drive-storage-limit');
    
    if (usedEl) usedEl.value = data.storage_used_gb ? `${data.storage_used_gb} GB` : 'N/A';
    if (limitEl) limitEl.value = data.storage_limit_gb ? `${data.storage_limit_gb} GB` : 'N/A';
}

function getStatusLabel(status) {
    const labels = {
        'connected': 'Connected',
        'not_configured': 'Not Configured',
        'not_authenticated': 'Not Authenticated',
        'warning': 'Warning',
        'error': 'Error',
        'unknown': 'Unknown'
    };
    return labels[status] || status;
}
