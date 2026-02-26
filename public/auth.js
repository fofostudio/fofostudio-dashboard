// === GOOGLE OAUTH MANAGER ===

class GoogleAuth {
    constructor() {
        this.accessToken = localStorage.getItem('google_access_token');
        this.refreshToken = localStorage.getItem('google_refresh_token');
        this.expiresAt = parseInt(localStorage.getItem('google_expires_at') || '0');
        this.user = JSON.parse(localStorage.getItem('google_user') || 'null');
    }
    
    isAuthenticated() {
        return !!this.accessToken && this.expiresAt > Date.now();
    }
    
    getAccessToken() {
        return this.accessToken;
    }
    
    getUser() {
        return this.user;
    }
    
    async login() {
        try {
            const response = await fetch(`${API_BASE}/google-auth-url`);
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Redirect to Google OAuth
            window.location.href = data.url;
        } catch (error) {
            console.error('Login error:', error);
            alert('Error al iniciar sesión con Google: ' + error.message);
        }
    }
    
    async handleCallback(code) {
        try {
            const response = await fetch(`${API_BASE}/google-auth-callback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Save tokens
            this.accessToken = data.access_token;
            this.refreshToken = data.refresh_token;
            this.expiresAt = Date.now() + (data.expires_in * 1000);
            this.user = data.user;
            
            localStorage.setItem('google_access_token', this.accessToken);
            localStorage.setItem('google_refresh_token', this.refreshToken);
            localStorage.setItem('google_expires_at', this.expiresAt.toString());
            localStorage.setItem('google_user', JSON.stringify(this.user));
            
            // Remove code from URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            return true;
        } catch (error) {
            console.error('Callback error:', error);
            alert('Error al completar autenticación: ' + error.message);
            return false;
        }
    }
    
    async refreshAccessToken() {
        if (!this.refreshToken) {
            this.logout();
            return false;
        }
        
        try {
            const response = await fetch(`${API_BASE}/google-refresh-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: this.refreshToken })
            });
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Update access token
            this.accessToken = data.access_token;
            this.expiresAt = Date.now() + (data.expires_in * 1000);
            
            localStorage.setItem('google_access_token', this.accessToken);
            localStorage.setItem('google_expires_at', this.expiresAt.toString());
            
            return true;
        } catch (error) {
            console.error('Token refresh error:', error);
            this.logout();
            return false;
        }
    }
    
    async ensureValidToken() {
        // Refresh if token expires in less than 5 minutes
        if (this.expiresAt < Date.now() + (5 * 60 * 1000)) {
            return await this.refreshAccessToken();
        }
        return true;
    }
    
    logout() {
        this.accessToken = null;
        this.refreshToken = null;
        this.expiresAt = 0;
        this.user = null;
        
        localStorage.removeItem('google_access_token');
        localStorage.removeItem('google_refresh_token');
        localStorage.removeItem('google_expires_at');
        localStorage.removeItem('google_user');
        
        // Reload page
        window.location.reload();
    }
}

// Global instance
const googleAuth = new GoogleAuth();

// Enhanced fetch with auto-auth
async function fetchWithAuth(url, options = {}) {
    // Ensure token is valid
    if (googleAuth.isAuthenticated()) {
        await googleAuth.ensureValidToken();
        
        // Add auth header
        options.headers = options.headers || {};
        options.headers['Authorization'] = `Bearer ${googleAuth.getAccessToken()}`;
    }
    
    return fetch(url, options);
}
