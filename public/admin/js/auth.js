/**
 * Admin Authentication Script
 * This script handles authentication for all admin pages
 */

// Authentication utilities for admin pages

// Check if user is logged in and has admin privileges
function checkAuth() {
    // Skip auth check on login page
    if (window.location.pathname.includes('/admin/login')) {
        return;
    }
    
    const token = localStorage.getItem('admin_token');
    
    if (!token) {
        redirectToLogin();
        return;
    }
    
    // Validate token
    validateToken(token)
        .then(isValid => {
            if (!isValid) {
                redirectToLogin();
            }
        })
        .catch(() => {
            redirectToLogin();
        });
}

// Validate token and check admin permissions
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
        if (data.permission_level < 2) { // Admin permission level
            throw new Error('Not an admin');
        }
        return true;
    });
}

// Redirect to login page
function redirectToLogin() {
    localStorage.removeItem('admin_token');
    
    // Prevent redirect loops by checking if we're already on the login page
    if (!window.location.pathname.includes('/admin/login')) {
        window.location.href = '/admin/login.html';
    }
}

// Make authenticated API request
function authFetch(url, options = {}) {
    const token = localStorage.getItem('admin_token');
    
    if (!token) {
        redirectToLogin();
        return Promise.reject('No authentication token');
    }
    
    // Merge headers with Authorization
    const headers = {
        ...options.headers || {},
        'Authorization': `Bearer ${token}`
    };
    
    return fetch(url, {
        ...options,
        headers
    })
    .then(response => {
        // If unauthorized, redirect to login
        if (response.status === 401 || response.status === 403) {
            redirectToLogin();
            throw new Error('Authentication failed');
        }
        return response;
    });
}

// Logout function
function logout() {
    localStorage.removeItem('admin_token');
    redirectToLogin();
}

// Initialize admin page
function initAdminPage() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    const usernameEl = document.getElementById('admin-username');
    if (usernameEl) {
        const token = localStorage.getItem('admin_token');
        if (token) {
            fetch('/auth/validate', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => response.json())
            .then(data => {
                usernameEl.textContent = data.username;
            });
        }
    }
}

// Run auth check when page loads
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initAdminPage();
});

// Export functions for use in other scripts
window.AdminAuth = {
    checkAuth,
    validateToken,
    authFetch,
    logout
};
