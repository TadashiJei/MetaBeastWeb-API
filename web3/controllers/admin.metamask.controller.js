const MetaMaskModel = require('../models/metamask.model');
const UserModel = require('../../users/users.model').UserModel;
const config = require('../../config.js');
const EmailTool = require('../../tools/email.tool');

/**
 * Get dashboard stats for MetaMask connections
 */
exports.getDashboardStats = async (req, res) => {
    try {
        // Get counts
        const totalConnections = await MetaMaskModel.count();
        const pendingRemovals = await MetaMaskModel.countPendingRemovals();
        
        // Get recent connections (last 7 days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const recentConnections = await MetaMaskModel.getRecentConnections(oneWeekAgo);
        
        return res.status(200).send({
            totalConnections,
            pendingRemovals,
            recentConnections: recentConnections.length
        });
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        return res.status(500).send({ error: error.message || 'Error getting dashboard stats' });
    }
};

/**
 * Get all pending removal requests with detailed user information
 */
exports.getPendingRemovalRequests = async (req, res) => {
    try {
        const connections = await MetaMaskModel.getPendingRemovalRequests();
        
        // Enrich with user data
        const enrichedRequests = [];
        for (const connection of connections) {
            const user = await UserModel.getById(connection.userId);
            if (user) {
                enrichedRequests.push({
                    ...connection.toObj(),
                    username: user.username,
                    userEmail: user.email,
                    accountCreated: user.account_create_time,
                    lastLogin: user.last_login_time
                });
            }
        }
        
        return res.status(200).send({
            count: enrichedRequests.length,
            requests: enrichedRequests
        });
    } catch (error) {
        console.error('Error getting pending removal requests:', error);
        return res.status(500).send({ error: error.message || 'Error getting pending removal requests' });
    }
};

/**
 * Process a removal request
 */
exports.processRemovalRequest = async (req, res) => {
    try {
        const { walletAddress, status, notes } = req.body;
        const adminId = req.jwt.userId;
        
        // Validate status
        if (status !== 'approved' && status !== 'rejected') {
            return res.status(400).send({ error: 'Invalid status. Must be "approved" or "rejected"' });
        }
        
        // Get the connection
        const connection = await MetaMaskModel.getByWalletAddress(walletAddress);
        if (!connection) {
            return res.status(404).send({ error: 'Connection not found' });
        }
        
        if (connection.removalRequest.status !== 'pending') {
            return res.status(400).send({ error: 'No pending removal request for this connection' });
        }
        
        // Process the request
        await MetaMaskModel.processRemovalRequest(walletAddress, status, adminId, notes);
        
        // If approved, remove the connection
        let removed = false;
        if (status === 'approved') {
            const result = await MetaMaskModel.remove(walletAddress);
            removed = result.deletedCount > 0;
        }
        
        // Send email notification
        if (config.smtp_enabled && connection.removalRequest.email) {
            const emailSubject = `MetaMask Disconnection Request ${status.charAt(0).toUpperCase() + status.slice(1)}`;
            const emailBody = `
                <h2>Your MetaMask Disconnection Request</h2>
                <p>Your request to disconnect your MetaMask wallet from your MetaBeast account has been ${status}.</p>
                <p><strong>Wallet Address:</strong> ${walletAddress}</p>
                <p><strong>Request Time:</strong> ${connection.removalRequest.requestTime}</p>
                <p><strong>Processed Time:</strong> ${new Date().toISOString()}</p>
                ${status === 'approved' 
                    ? '<p>The wallet has been successfully disconnected from your account.</p>' 
                    : '<p>Your wallet remains connected to your account. If you believe this is an error, please contact our support team.</p>'}
                ${notes ? `<p><strong>Admin Notes:</strong> ${notes}</p>` : ''}
            `;
            
            EmailTool.sendEmail(connection.removalRequest.email, emailSubject, emailBody);
        }
        
        // Get admin username
        const admin = await UserModel.getById(adminId);
        const adminUsername = admin ? admin.username : 'Unknown';
        
        return res.status(200).send({ 
            message: `Removal request ${status} successfully`,
            status,
            processed: {
                by: adminUsername,
                at: new Date(),
                removed
            }
        });
    } catch (error) {
        console.error('Error processing removal request:', error);
        return res.status(500).send({ error: error.message || 'Error processing removal request' });
    }
};

/**
 * Get all MetaMask connections with detailed information
 */
exports.getAllConnections = async (req, res) => {
    try {
        // Get query parameters for pagination
        const perPage = parseInt(req.query.perPage) || 10;
        const page = parseInt(req.query.page) || 1;
        const filter = req.query.filter || '';
        
        // Get all connections with pagination
        const connections = await MetaMaskModel.getAllPaginated(perPage, page, filter);
        const totalCount = await MetaMaskModel.countFiltered(filter);
        
        // Enrich with user data
        const enrichedConnections = [];
        for (const connection of connections) {
            const user = await UserModel.getById(connection.userId);
            if (user) {
                enrichedConnections.push({
                    ...connection.toObj(),
                    username: user.username,
                    userEmail: user.email,
                    accountCreated: user.account_create_time,
                    lastLogin: user.last_login_time
                });
            } else {
                enrichedConnections.push({
                    ...connection.toObj(),
                    username: 'Unknown',
                    userEmail: 'Unknown',
                    accountCreated: null,
                    lastLogin: null
                });
            }
        }
        
        return res.status(200).send({
            totalCount,
            pendingRemovals: await MetaMaskModel.countPendingRemovals(),
            page,
            perPage,
            totalPages: Math.ceil(totalCount / perPage),
            connections: enrichedConnections
        });
    } catch (error) {
        console.error('Error getting all connections:', error);
        return res.status(500).send({ error: error.message || 'Error getting all connections' });
    }
};

/**
 * Get connection history for a specific wallet address
 */
exports.getConnectionHistory = async (req, res) => {
    try {
        const { walletAddress } = req.params;
        
        // Get the connection
        const connection = await MetaMaskModel.getByWalletAddress(walletAddress);
        if (!connection) {
            return res.status(404).send({ error: 'Connection not found' });
        }
        
        // Get user details
        const user = await UserModel.getById(connection.userId);
        
        // Get connection history
        const history = await MetaMaskModel.getConnectionHistory(walletAddress);
        
        return res.status(200).send({
            connection: connection.toObj(),
            user: user ? {
                id: user.id,
                username: user.username,
                email: user.email,
                accountCreated: user.account_create_time,
                lastLogin: user.last_login_time
            } : null,
            history
        });
    } catch (error) {
        console.error('Error getting connection history:', error);
        return res.status(500).send({ error: error.message || 'Error getting connection history' });
    }
};

/**
 * Force remove a connection (admin override)
 */
exports.forceRemoveConnection = async (req, res) => {
    try {
        const { walletAddress, reason } = req.body;
        const adminId = req.jwt.userId;
        
        // Get the connection
        const connection = await MetaMaskModel.getByWalletAddress(walletAddress);
        if (!connection) {
            return res.status(404).send({ error: 'Connection not found' });
        }
        
        // Get user details
        const user = await UserModel.getById(connection.userId);
        
        // Log the forced removal
        console.log(`Admin ${adminId} force removed connection for wallet ${walletAddress} belonging to user ${connection.userId}. Reason: ${reason || 'Not provided'}`);
        
        // Remove the connection
        const result = await MetaMaskModel.remove(walletAddress);
        
        // Send email notification to user if email is available
        if (config.smtp_enabled && user && user.email) {
            const emailSubject = 'MetaMask Connection Removed by Administrator';
            const emailBody = `
                <h2>MetaMask Connection Removed</h2>
                <p>Your MetaMask wallet connection has been removed from your MetaBeast account by an administrator.</p>
                <p><strong>Wallet Address:</strong> ${walletAddress}</p>
                <p><strong>Removal Time:</strong> ${new Date().toISOString()}</p>
                ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                <p>If you believe this is an error or have any questions, please contact our support team.</p>
            `;
            
            EmailTool.sendEmail(user.email, emailSubject, emailBody);
        }
        
        // Get admin username
        const admin = await UserModel.getById(adminId);
        const adminUsername = admin ? admin.username : 'Unknown';
        
        return res.status(200).send({ 
            message: 'Connection removed successfully',
            removed: result.deletedCount > 0,
            removedBy: adminUsername
        });
    } catch (error) {
        console.error('Error force removing connection:', error);
        return res.status(500).send({ error: error.message || 'Error force removing connection' });
    }
};
