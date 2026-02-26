// === MODERN NOTIFICATION SYSTEM ===

// Replace native alert()
window.alert = function(message) {
    showAlert(message);
};

// Replace native confirm()
const originalConfirm = window.confirm;
window.confirm = function(message) {
    return showConfirm(message);
};

// Show alert modal
function showAlert(message, type = 'info') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modern-modal';
        modal.innerHTML = `
            <div class="modern-modal-overlay"></div>
            <div class="modern-modal-content modern-alert ${type}">
                <div class="modern-modal-icon">
                    ${type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}
                </div>
                <div class="modern-modal-message">${message}</div>
                <div class="modern-modal-actions">
                    <button class="btn btn-primary" id="alert-ok">Entendido</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Animate in
        setTimeout(() => modal.classList.add('active'), 10);
        
        // Handle button
        document.getElementById('alert-ok').addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
                resolve();
            }, 300);
        });
        
        // Close on overlay click
        modal.querySelector('.modern-modal-overlay').addEventListener('click', () => {
            document.getElementById('alert-ok').click();
        });
    });
}

// Show confirm modal
function showConfirm(message, options = {}) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modern-modal';
        
        const confirmText = options.confirmText || 'Aceptar';
        const cancelText = options.cancelText || 'Cancelar';
        const type = options.type || 'question';
        const icon = options.icon || '❓';
        
        modal.innerHTML = `
            <div class="modern-modal-overlay"></div>
            <div class="modern-modal-content modern-confirm ${type}">
                <div class="modern-modal-icon">${icon}</div>
                <div class="modern-modal-message">${message}</div>
                <div class="modern-modal-actions">
                    <button class="btn btn-secondary" id="confirm-cancel">${cancelText}</button>
                    <button class="btn btn-primary" id="confirm-ok">${confirmText}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Animate in
        setTimeout(() => modal.classList.add('active'), 10);
        
        // Handle buttons
        document.getElementById('confirm-ok').addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
                resolve(true);
            }, 300);
        });
        
        document.getElementById('confirm-cancel').addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
                resolve(false);
            }, 300);
        });
        
        // Close on overlay click = cancel
        modal.querySelector('.modern-modal-overlay').addEventListener('click', () => {
            document.getElementById('confirm-cancel').click();
        });
        
        // ESC key = cancel
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                document.getElementById('confirm-cancel').click();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    });
}

// Toast notification (non-blocking)
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `modern-toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <div class="modern-toast-icon">${icons[type] || icons.info}</div>
        <div class="modern-toast-message">${message}</div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('active'), 10);
    
    // Auto-remove
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 300);
    }, duration);
    
    // Click to dismiss
    toast.addEventListener('click', () => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 300);
    });
}

// Loading modal
function showLoading(message = 'Cargando...') {
    const id = 'loading-' + Date.now();
    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'modern-modal loading-modal';
    modal.innerHTML = `
        <div class="modern-modal-overlay"></div>
        <div class="modern-modal-content modern-loading">
            <div class="loading-spinner"></div>
            <div class="modern-modal-message">${message}</div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
    
    return id;
}

function hideLoading(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

// Prompt modal (input)
function showPrompt(message, defaultValue = '', options = {}) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modern-modal';
        
        const placeholder = options.placeholder || '';
        const confirmText = options.confirmText || 'Aceptar';
        const cancelText = options.cancelText || 'Cancelar';
        
        modal.innerHTML = `
            <div class="modern-modal-overlay"></div>
            <div class="modern-modal-content modern-prompt">
                <div class="modern-modal-message">${message}</div>
                <input type="text" 
                       class="modern-prompt-input" 
                       id="prompt-input"
                       placeholder="${placeholder}"
                       value="${defaultValue}">
                <div class="modern-modal-actions">
                    <button class="btn btn-secondary" id="prompt-cancel">${cancelText}</button>
                    <button class="btn btn-primary" id="prompt-ok">${confirmText}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
        
        const input = document.getElementById('prompt-input');
        input.focus();
        input.select();
        
        const handleOk = () => {
            const value = input.value;
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
                resolve(value);
            }, 300);
        };
        
        const handleCancel = () => {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
                resolve(null);
            }, 300);
        };
        
        document.getElementById('prompt-ok').addEventListener('click', handleOk);
        document.getElementById('prompt-cancel').addEventListener('click', handleCancel);
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleOk();
            if (e.key === 'Escape') handleCancel();
        });
        
        modal.querySelector('.modern-modal-overlay').addEventListener('click', handleCancel);
    });
}
