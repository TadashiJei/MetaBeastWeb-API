const MetaMaskModel = require('../models/metamask.model');
const UserModel = require('../../users/users.model').UserModel;
const Web3Service = require('../services/web3.service');
const config = require('../../config.js');
const EmailTool = require('../../tools/email.tool');

/**
 * Connect a MetaMask wallet to a user account
 */
exports.connectWallet = async (req, res) => {
    try {
        const { walletAddress, signature } = req.body;
        const userId = req.jwt.userId;
        
        // Verify the signature if provided
        if (signature) {
            const user = await UserModel.getById(userId);
            if (!user || !user.metamask_nonce) {
                return res.status(400).send({ error: 'Invalid nonce. Please request a new one.' });
            }
            
            const message = Web3Service.createSignMessage(user.metamask_nonce, walletAddress);
            const isValid = Web3Service.verifySignature(walletAddress, message, signature);
            
            if (!isValid) {
                return res.status(400).send({ error: 'Invalid signature' });
            }
            
            // Clear the nonce after use
            await UserModel.patch(userId, { metamask_nonce: '' });
        }
        
        // Check if wallet is already connected to another user
        const existingConnection = await MetaMaskModel.getByWalletAddress(walletAddress);
        if (existingConnection && existingConnection.userId !== userId) {
            return res.status(409).send({ 
                error: 'Wallet already connected to another account',
                status: existingConnection.removalRequest.status
            });
        }
        
        // Create or update the connection
        let connection;
        if (existingConnection) {
            connection = await MetaMaskModel.update(existingConnection, {
                lastUsed: new Date(),
                chainId: req.body.chainId || ''
            });
        } else {
            connection = await MetaMaskModel.create({
                walletAddress: walletAddress,
                userId: userId,
                connectionTime: new Date(),
                lastUsed: new Date(),
                chainId: req.body.chainId || ''
            });
        }
        
        return res.status(200).send({
            message: 'Wallet connected successfully',
            connection: connection.toObj()
        });
    } catch (error) {
        console.error('Error connecting wallet:', error);
        return res.status(500).send({ error: error.message || 'Error connecting wallet' });
    }
};

/**
 * Get all MetaMask connections for the authenticated user
 */
exports.getUserConnections = async (req, res) => {
    try {
        const userId = req.jwt.userId;
        const connections = await MetaMaskModel.getByUserId(userId);
        
        return res.status(200).send({
            count: connections.length,
            connections: connections.map(conn => conn.toObj())
        });
    } catch (error) {
        console.error('Error getting user connections:', error);
        return res.status(500).send({ error: error.message || 'Error getting user connections' });
    }
};

/**
 * Request a nonce for MetaMask signature
 */
exports.requestNonce = async (req, res) => {
    try {
        const userId = req.jwt.userId;
        const nonce = Web3Service.generateNonce();
        
        // Store the nonce in the user document
        await UserModel.patch(userId, { metamask_nonce: nonce });
        
        return res.status(200).send({ nonce });
    } catch (error) {
        console.error('Error generating nonce:', error);
        return res.status(500).send({ error: error.message || 'Error generating nonce' });
    }
};

/**
 * Request removal of a MetaMask connection
 */
exports.requestRemoval = async (req, res) => {
    try {
        const { walletAddress, email, reason } = req.body;
        const userId = req.jwt.userId;
        
        // Verify the connection belongs to the user
        const connection = await MetaMaskModel.getByWalletAddress(walletAddress);
        if (!connection) {
            return res.status(404).send({ error: 'Connection not found' });
        }
        
        if (connection.userId !== userId) {
            return res.status(403).send({ error: 'You do not have permission to remove this connection' });
        }
        
        // Update the connection with removal request
        await MetaMaskModel.requestRemoval(walletAddress, email, reason);
        
        // Send email notification to admins
        if (config.smtp_enabled) {
            const user = await UserModel.getById(userId);
            const emailSubject = 'MetaMask Disconnection Request';
            const emailBody = `
                <h2>New MetaMask Disconnection Request</h2>
                <p><strong>User:</strong> ${user.username}</p>
                <p><strong>User ID:</strong> ${userId}</p>
                <p><strong>Wallet Address:</strong> ${walletAddress}</p>
                <p><strong>Contact Email:</strong> ${email || 'Not provided'}</p>
                <p><strong>Reason:</strong> ${reason || 'Not provided'}</p>
                <p><strong>Request Time:</strong> ${new Date().toISOString()}</p>
                <p>Please review this request in the admin dashboard.</p>
            `;
            
            // Send to admin email
            EmailTool.sendEmail(config.admin_email || config.smtp_email, emailSubject, emailBody);
            
            // Send confirmation to user if email provided
            if (email) {
                const userEmailSubject = 'MetaMask Disconnection Request Received';
                const userEmailBody = `
                    <h2>Your MetaMask Disconnection Request</h2>
                    <p>We have received your request to disconnect your MetaMask wallet from your MetaBeast account.</p>
                    <p><strong>Wallet Address:</strong> ${walletAddress}</p>
                    <p><strong>Request Time:</strong> ${new Date().toISOString()}</p>
                    <p>Our team will review your request and process it as soon as possible. You will receive a confirmation email once the disconnection is complete.</p>
                    <p>If you have any questions, please contact our support team.</p>
                `;
                EmailTool.sendEmail(email, userEmailSubject, userEmailBody);
            }
        }
        
        return res.status(200).send({ 
            message: 'Removal request submitted successfully',
            status: 'pending'
        });
    } catch (error) {
        console.error('Error requesting removal:', error);
        return res.status(500).send({ error: error.message || 'Error requesting removal' });
    }
};

/**
 * Get wallet balance
 */
exports.getWalletBalance = async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const userId = req.jwt.userId;
        
        // Verify the connection belongs to the user
        const connection = await MetaMaskModel.getByWalletAddress(walletAddress);
        if (!connection) {
            return res.status(404).send({ error: 'Connection not found' });
        }
        
        if (connection.userId !== userId) {
            return res.status(403).send({ error: 'You do not have permission to view this wallet' });
        }
        
        // Get balance
        const balance = await Web3Service.getBalance(walletAddress);
        
        return res.status(200).send({ 
            walletAddress,
            balance,
            unit: 'CORE'
        });
    } catch (error) {
        console.error('Error getting wallet balance:', error);
        return res.status(500).send({ error: error.message || 'Error getting wallet balance' });
    }
};

// Admin controllers

/**
 * Get all pending removal requests (admin only)
 */
exports.getPendingRemovals = async (req, res) => {
    try {
        const connections = await MetaMaskModel.getPendingRemovalRequests();
        
        // Enrich with user data
        const enrichedConnections = [];
        for (const connection of connections) {
            const user = await UserModel.getById(connection.userId);
            enrichedConnections.push({
                ...connection.toObj(),
                username: user ? user.username : 'Unknown'
            });
        }
        
        return res.status(200).send({
            count: enrichedConnections.length,
            connections: enrichedConnections
        });
    } catch (error) {
        console.error('Error getting pending removals:', error);
        return res.status(500).send({ error: error.message || 'Error getting pending removals' });
    }
};

/**
 * Process a removal request (admin only)
 */
exports.processRemovalRequest = async (req, res) => {
    try {
        const { walletAddress, status, notes } = req.body;
        const adminId = req.jwt.userId;
        
        // Validate status
        if (status !== 'approved' && status !== 'rejected') {
            return res.status(400).send({ error: 'Invalid status. Must be "approved" or "rejected"' });
        }
        
        // Process the request
        const connection = await MetaMaskModel.processRemovalRequest(walletAddress, status, adminId, notes);
        
        // If approved, remove the connection
        if (status === 'approved') {
            await MetaMaskModel.remove(walletAddress);
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
        
        return res.status(200).send({ 
            message: `Removal request ${status} successfully`,
            status
        });
    } catch (error) {
        console.error('Error processing removal request:', error);
        return res.status(500).send({ error: error.message || 'Error processing removal request' });
    }
};

/**
 * Get all MetaMask connections (admin only)
 */
exports.getAllConnections = async (req, res) => {
    try {
        // Get query parameters for pagination
        const perPage = parseInt(req.query.perPage) || 10;
        const page = parseInt(req.query.page) || 1;
        
        // Get all users with MetaMask connections
        const users = await UserModel.getAll();
        const userMap = {};
        users.forEach(user => {
            userMap[user.id] = user.username;
        });
        
        // Get all connections
        const connections = await MetaMaskModel.getAll(perPage, page);
        
        // Enrich with username
        const enrichedConnections = connections.map(conn => ({
            ...conn.toObj(),
            username: userMap[conn.userId] || 'Unknown'
        }));
        
        return res.status(200).send({
            count: await MetaMaskModel.count(),
            pendingRemovals: await MetaMaskModel.countPendingRemovals(),
            connections: enrichedConnections
        });
    } catch (error) {
        console.error('Error getting all connections:', error);
        return res.status(500).send({ error: error.message || 'Error getting all connections' });
    }
};
