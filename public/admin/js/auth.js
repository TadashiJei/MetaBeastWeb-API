/**
 * Admin Authentication Script
 * This script handles authentication for all admin pages
 */

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('admin_token');
    if (!token) {
        // Check if we're already on the login page to prevent redirect loops
        if (!window.location.pathname.includes('/admin/login.html')) {
            window.location.href = '/admin/login.html';
        }
        return null;
    }
    return token;
}

// Validate token with server
function validateToken(token) {
    return fetch('/auth/validate', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Invalid token');
        }
        return response.json();
    })
    .then(data => {
        // Check if user has admin permissions
        if (data.permission_level < 2) {
            throw new Error('Not an admin');
        }
        return data;
    })
    .catch(error => {
        console.error('Authentication error:', error);
        localStorage.removeItem('admin_token');
        
        // Check if we're already on the login page to prevent redirect loops
        if (!window.location.pathname.includes('/admin/login.html')) {
            window.location.href = '/admin/login.html';
        }
        return null;
    });
}

// Initialize admin page
function initAdminPage() {
    const token = checkAuth();
    if (!token) return;

    // Set up logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('admin_token');
            window.location.href = '/admin/login.html';
        });
    }

    // Validate token and get user info
    return validateToken(token)
        .then(userData => {
            if (!userData) return null;
            
            // Set username if element exists
            const usernameEl = document.getElementById('admin-username');
            if (usernameEl) {
                usernameEl.textContent = userData.username;
            }
            
            return {
                token,
                userData
            };
        });
}

// Add authorization header to fetch options
function addAuthHeader(options = {}) {
    const token = localStorage.getItem('admin_token');
    if (!token) return options;
    
    if (!options.headers) {
        options.headers = {};
    }
    
    options.headers['Authorization'] = `Bearer ${token}`;
    return options;
}

// Authenticated fetch wrapper
function authFetch(url, options = {}) {
    return fetch(url, addAuthHeader(options));
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', initAdminPage);

// Export functions for use in other scripts
window.AdminAuth = {
    checkAuth,
    validateToken,
    initAdminPage,
    addAuthHeader,
    authFetch
};
