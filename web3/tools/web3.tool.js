const config = require('../../config.js');
const Web3Service = require('../services/web3.service');
const MetaMaskModel = require('../models/metamask.model');

/**
 * Middleware to verify if a user has a valid MetaMask connection
 */
exports.hasValidConnection = async (req, res, next) => {
    try {
        const userId = req.jwt.userId;
        
        // Get user's MetaMask connections
        const connections = await MetaMaskModel.getByUserId(userId);
        
        if (!connections || connections.length === 0) {
            return res.status(403).send({ 
                error: 'No MetaMask wallet connected',
                code: 'NO_WALLET'
            });
        }
        
        // Check if any connection has a pending removal request
        const pendingRemovals = connections.filter(conn => 
            conn.removalRequest && conn.removalRequest.status === 'pending'
        );
        
        if (pendingRemovals.length > 0) {
            return res.status(403).send({ 
                error: 'Wallet disconnection is pending approval',
                code: 'PENDING_REMOVAL',
                wallets: pendingRemovals.map(conn => conn.walletAddress)
            });
        }
        
        // Store connections in request for later use
        req.metamaskConnections = connections;
        
        next();
    } catch (error) {
        console.error('Error verifying MetaMask connection:', error);
        return res.status(500).send({ error: error.message || 'Error verifying MetaMask connection' });
    }
};

/**
 * Middleware to verify if the user is connected to the Core blockchain
 */
exports.isCoreNetwork = async (req, res, next) => {
    try {
        const isCoreNetwork = await Web3Service.isCoreNetwork();
        
        if (!isCoreNetwork) {
            return res.status(400).send({ 
                error: 'Not connected to Core blockchain',
                code: 'WRONG_NETWORK'
            });
        }
        
        next();
    } catch (error) {
        console.error('Error verifying network:', error);
        return res.status(500).send({ error: error.message || 'Error verifying network' });
    }
};

/**
 * Middleware to verify if the user owns the specified wallet
 */
exports.ownsWallet = async (req, res, next) => {
    try {
        const userId = req.jwt.userId;
        const walletAddress = req.params.walletAddress || req.body.walletAddress;
        
        if (!walletAddress) {
            return res.status(400).send({ error: 'Wallet address is required' });
        }
        
        // Get the connection
        const connection = await MetaMaskModel.getByWalletAddress(walletAddress);
        
        if (!connection) {
            return res.status(404).send({ error: 'Wallet not found' });
        }
        
        if (connection.userId !== userId) {
            return res.status(403).send({ error: 'You do not own this wallet' });
        }
        
        // Store connection in request for later use
        req.metamaskConnection = connection;
        
        next();
    } catch (error) {
        console.error('Error verifying wallet ownership:', error);
        return res.status(500).send({ error: error.message || 'Error verifying wallet ownership' });
    }
};

/**
 * Middleware to verify if the user is an admin
 */
exports.isAdmin = (req, res, next) => {
    const permissionLevel = parseInt(req.jwt.permission_level);
    
    if (permissionLevel < config.permissions.ADMIN) {
        return res.status(403).send({
            error: 'Access denied. Admin privileges required.'
        });
    }
    
    next();
};
