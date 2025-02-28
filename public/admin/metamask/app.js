document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    AdminAuth.initAdminPage().then(auth => {
        if (!auth) return; // User not authenticated
        
        // Initialize the admin UI
        initUI();
        
        // Load initial data
        loadDashboardStats();
        loadPendingRequests();
        loadAllConnections();
    });
});

// UI Initialization
function initUI() {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all tabs and content
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    // Search functionality
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    
    searchBtn.addEventListener('click', () => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            searchConnections(searchTerm);
        } else {
            loadAllConnections();
        }
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
    
    // Modal close buttons
    document.querySelectorAll('.close, #process-cancel, #force-cancel').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Process request submit button
    document.getElementById('process-submit').addEventListener('click', processRemovalRequest);
    
    // Force remove submit button
    document.getElementById('force-submit').addEventListener('click', forceRemoveConnection);
    
    // Pagination buttons
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadAllConnections(currentPage);
        }
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadAllConnections(currentPage);
        }
    });
}

// Global variables for pagination
let currentPage = 1;
let totalPages = 1;
let pageSize = 10;

// Load dashboard statistics
function loadDashboardStats() {
    AdminAuth.authFetch('/api/admin/metamask/stats')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('total-connections').textContent = data.totalConnections;
            document.getElementById('pending-removals').textContent = data.pendingRemovals;
            document.getElementById('recent-connections').textContent = data.recentConnections;
        })
        .catch(error => {
            console.error('Error loading dashboard stats:', error);
            showErrorNotification('Failed to load dashboard statistics');
        });
}

// Load pending removal requests
function loadPendingRequests() {
    AdminAuth.authFetch('/api/admin/metamask/removal-requests')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const tableBody = document.getElementById('pending-table-body');
            tableBody.innerHTML = '';
            
            if (data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No pending removal requests</td></tr>';
                return;
            }
            
            data.forEach(request => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${formatWalletAddress(request.walletAddress)}</td>
                    <td>${request.user ? request.user.username : 'Unknown'}</td>
                    <td>${formatDate(request.removalRequest.requestedAt)}</td>
                    <td>${request.removalRequest.reason || 'No reason provided'}</td>
                    <td>
                        <button class="action-btn action-btn-view" title="View Details" data-id="${request._id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn action-btn-approve" title="Approve Request" data-id="${request._id}">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="action-btn action-btn-reject" title="Reject Request" data-id="${request._id}">
                            <i class="fas fa-times"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(tr);
                
                // Add event listeners for action buttons
                tr.querySelector('.action-btn-view').addEventListener('click', () => showConnectionDetails(request));
                tr.querySelector('.action-btn-approve').addEventListener('click', () => showProcessModal(request, 'approved'));
                tr.querySelector('.action-btn-reject').addEventListener('click', () => showProcessModal(request, 'rejected'));
            });
        })
        .catch(error => {
            console.error('Error loading pending requests:', error);
            document.getElementById('pending-table-body').innerHTML = 
                '<tr><td colspan="5" class="text-center">Error loading data. Please try again.</td></tr>';
        });
}

// Load all MetaMask connections
function loadAllConnections(page = 1) {
    const limit = pageSize;
    const skip = (page - 1) * limit;
    
    AdminAuth.authFetch(`/api/admin/metamask/connections?limit=${limit}&skip=${skip}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const tableBody = document.getElementById('connections-table-body');
            tableBody.innerHTML = '';
            
            if (data.connections.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No connections found</td></tr>';
                return;
            }
            
            data.connections.forEach(connection => {
                const tr = document.createElement('tr');
                
                // Determine status badge
                let statusBadge = '';
                if (connection.removalRequest && connection.removalRequest.status === 'pending') {
                    statusBadge = '<span class="badge badge-warning">Pending Removal</span>';
                } else if (connection.removalRequest && connection.removalRequest.status === 'approved') {
                    statusBadge = '<span class="badge badge-danger">Removed</span>';
                } else {
                    statusBadge = '<span class="badge badge-success">Active</span>';
                }
                
                tr.innerHTML = `
                    <td>${formatWalletAddress(connection.walletAddress)}</td>
                    <td>${connection.user ? connection.user.username : 'Unknown'}</td>
                    <td>${formatDate(connection.createdAt)}</td>
                    <td>${connection.lastUsed ? formatDate(connection.lastUsed) : 'Never'}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="action-btn action-btn-view" title="View Details" data-id="${connection._id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn action-btn-force" title="Force Remove" data-id="${connection._id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(tr);
                
                // Add event listeners for action buttons
                tr.querySelector('.action-btn-view').addEventListener('click', () => showConnectionDetails(connection));
                tr.querySelector('.action-btn-force').addEventListener('click', () => showForceRemoveModal(connection));
            });
            
            // Update pagination
            currentPage = page;
            totalPages = Math.ceil(data.total / limit);
            
            document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
            document.getElementById('prev-page').disabled = currentPage <= 1;
            document.getElementById('next-page').disabled = currentPage >= totalPages;
        })
        .catch(error => {
            console.error('Error loading connections:', error);
            document.getElementById('connections-table-body').innerHTML = 
                '<tr><td colspan="6" class="text-center">Error loading data. Please try again.</td></tr>';
        });
}

// Search connections
function searchConnections(searchTerm) {
    AdminAuth.authFetch(`/api/admin/metamask/connections?search=${encodeURIComponent(searchTerm)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const tableBody = document.getElementById('connections-table-body');
            tableBody.innerHTML = '';
            
            if (data.connections.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No matching connections found</td></tr>';
                return;
            }
            
            // Update the table with search results
            data.connections.forEach(connection => {
                // Same rendering logic as in loadAllConnections
                const tr = document.createElement('tr');
                
                let statusBadge = '';
                if (connection.removalRequest && connection.removalRequest.status === 'pending') {
                    statusBadge = '<span class="badge badge-warning">Pending Removal</span>';
                } else if (connection.removalRequest && connection.removalRequest.status === 'approved') {
                    statusBadge = '<span class="badge badge-danger">Removed</span>';
                } else {
                    statusBadge = '<span class="badge badge-success">Active</span>';
                }
                
                tr.innerHTML = `
                    <td>${formatWalletAddress(connection.walletAddress)}</td>
                    <td>${connection.user ? connection.user.username : 'Unknown'}</td>
                    <td>${formatDate(connection.createdAt)}</td>
                    <td>${connection.lastUsed ? formatDate(connection.lastUsed) : 'Never'}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="action-btn action-btn-view" title="View Details" data-id="${connection._id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn action-btn-force" title="Force Remove" data-id="${connection._id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(tr);
                
                // Add event listeners for action buttons
                tr.querySelector('.action-btn-view').addEventListener('click', () => showConnectionDetails(connection));
                tr.querySelector('.action-btn-force').addEventListener('click', () => showForceRemoveModal(connection));
            });
            
            // Update pagination for search results
            document.getElementById('page-info').textContent = `Search Results: ${data.connections.length} found`;
            document.getElementById('prev-page').disabled = true;
            document.getElementById('next-page').disabled = true;
        })
        .catch(error => {
            console.error('Error searching connections:', error);
            document.getElementById('connections-table-body').innerHTML = 
                '<tr><td colspan="6" class="text-center">Error searching data. Please try again.</td></tr>';
        });
}

// Show connection details modal
function showConnectionDetails(connection) {
    const modal = document.getElementById('connection-details-modal');
    const modalContent = document.getElementById('connection-details-content');
    
    // Show modal
    modal.classList.add('show');
    modalContent.innerHTML = '<div class="loading-spinner"></div>';
    
    // Fetch connection details
    AdminAuth.authFetch(`/api/admin/metamask/connections/${connection._id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Set connection details
            modalContent.innerHTML = `
                <h2>Connection Details</h2>
                <p>Wallet Address: ${formatWalletAddress(data.walletAddress)}</p>
                <p>User: ${data.user ? data.user.username : 'Unknown'}</p>
                <p>Connection Time: ${formatDate(data.createdAt)}</p>
                <p>Last Used: ${data.lastUsed ? formatDate(data.lastUsed) : 'Never'}</p>
                <p>Chain ID: ${data.chainId || 'Unknown'}</p>
            `;
            
            // Set status
            let status = 'Active';
            if (data.removalRequest) {
                if (data.removalRequest.status === 'pending') {
                    status = 'Pending Removal';
                } else if (data.removalRequest.status === 'approved') {
                    status = 'Removed';
                } else if (data.removalRequest.status === 'rejected') {
                    status = 'Removal Rejected';
                }
            }
            modalContent.innerHTML += `<p>Status: ${status}</p>`;
            
            // Show/hide removal request details
            if (data.removalRequest) {
                modalContent.innerHTML += `
                    <h3>Removal Request Details</h3>
                    <p>Request Time: ${formatDate(data.removalRequest.requestedAt)}</p>
                    <p>Email: ${data.removalRequest.email || 'Not provided'}</p>
                    <p>Reason: ${data.removalRequest.reason || 'No reason provided'}</p>
                `;
            }
        })
        .catch(error => {
            console.error('Error loading connection details:', error);
            modalContent.innerHTML = '<p>Error loading connection details. Please try again.</p>';
        });
}

// Show process removal request modal
function showProcessModal(connection, defaultDecision) {
    const modal = document.getElementById('process-modal');
    
    // Set connection details
    document.getElementById('process-wallet').value = connection.walletAddress;
    document.getElementById('process-user').value = connection.user ? connection.user.username : 'Unknown';
    document.getElementById('process-reason').value = connection.removalRequest.reason || 'No reason provided';
    
    // Set default decision radio button
    document.querySelector(`input[name="decision"][value="${defaultDecision}"]`).checked = true;
    
    // Clear notes
    document.getElementById('process-notes').value = '';
    
    // Store connection ID for submission
    modal.dataset.connectionId = connection._id;
    
    // Show the modal
    modal.style.display = 'block';
}

// Show force remove modal
function showForceRemoveModal(connection) {
    const modal = document.getElementById('force-modal');
    
    // Set connection details
    document.getElementById('force-wallet').value = connection.walletAddress;
    document.getElementById('force-user').value = connection.user ? connection.user.username : 'Unknown';
    
    // Clear reason
    document.getElementById('force-reason').value = '';
    
    // Store connection ID for submission
    modal.dataset.connectionId = connection._id;
    
    // Show the modal
    modal.style.display = 'block';
}

// Process removal request
function processRemovalRequest() {
    const modal = document.getElementById('process-modal');
    const connectionId = modal.dataset.connectionId;
    const decision = document.querySelector('input[name="decision"]:checked').value;
    const notes = document.getElementById('process-notes').value;
    
    // Create request body
    const requestBody = {
        connectionId,
        decision,
        notes
    };
    
    // Send request to API
    AdminAuth.authFetch('/api/admin/metamask/removal-requests/process', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Close modal
        modal.style.display = 'none';
        
        // Show success notification
        showSuccessNotification(`Request ${decision} successfully`);
        
        // Reload data
        loadDashboardStats();
        loadPendingRequests();
        loadAllConnections(currentPage);
    })
    .catch(error => {
        console.error('Error processing request:', error);
        showErrorNotification('Failed to process request');
    });
}

// Force remove connection
function forceRemoveConnection() {
    const modal = document.getElementById('force-modal');
    const connectionId = modal.dataset.connectionId;
    const reason = document.getElementById('force-reason').value;
    
    if (!reason || reason.trim() === '') {
        showErrorNotification('Please provide a reason for removal');
        return;
    }
    
    // Create request body
    const requestBody = {
        connectionId,
        reason
    };
    
    // Send request to API
    AdminAuth.authFetch('/api/admin/metamask/connections', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Close modal
        modal.style.display = 'none';
        
        // Show success notification
        showSuccessNotification('Connection removed successfully');
        
        // Reload data
        loadDashboardStats();
        loadPendingRequests();
        loadAllConnections(currentPage);
    })
    .catch(error => {
        console.error('Error removing connection:', error);
        showErrorNotification('Failed to remove connection');
    });
}

// Helper function to format wallet address
function formatWalletAddress(address) {
    if (!address) return 'Unknown';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
}

// Show success notification
function showSuccessNotification(message) {
    // Implementation depends on your notification system
    alert(message); // Simple fallback
}

// Show error notification
function showErrorNotification(message) {
    // Implementation depends on your notification system
    alert(`Error: ${message}`); // Simple fallback
}
