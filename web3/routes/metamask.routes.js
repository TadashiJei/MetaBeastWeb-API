const MetaMaskController = require('../controllers/metamask.controller');
const AdminMetaMaskController = require('../controllers/admin.metamask.controller');
const AuthTool = require('../../authorization/auth.tool');
const Web3Tool = require('../tools/web3.tool');

exports.route = function (app) {
    // User MetaMask routes
    
    // Request a nonce for MetaMask signature
    app.get('/api/metamask/nonce', [
        AuthTool.isValidJWT,
        MetaMaskController.requestNonce
    ]);
    
    // Connect a MetaMask wallet
    app.post('/api/metamask', [
        AuthTool.isValidJWT,
        MetaMaskController.connectWallet
    ]);
    
    // Get user's MetaMask connections
    app.get('/api/metamask', [
        AuthTool.isValidJWT,
        MetaMaskController.getUserConnections
    ]);
    
    // Request removal of a MetaMask connection
    app.post('/api/metamask/removal-request', [
        AuthTool.isValidJWT,
        Web3Tool.ownsWallet,
        MetaMaskController.requestRemoval
    ]);
    
    // Get wallet balance
    app.get('/api/metamask/:walletAddress/balance', [
        AuthTool.isValidJWT,
        Web3Tool.ownsWallet,
        MetaMaskController.getWalletBalance
    ]);
    
    // Admin MetaMask routes
    
    // Get dashboard stats
    app.get('/api/admin/metamask/stats', [
        AuthTool.isValidJWT,
        Web3Tool.isAdmin,
        AdminMetaMaskController.getDashboardStats
    ]);
    
    // Get all pending removal requests
    app.get('/api/admin/metamask/removal-requests', [
        AuthTool.isValidJWT,
        Web3Tool.isAdmin,
        AdminMetaMaskController.getPendingRemovalRequests
    ]);
    
    // Process a removal request
    app.post('/api/admin/metamask/removal-requests/process', [
        AuthTool.isValidJWT,
        Web3Tool.isAdmin,
        AdminMetaMaskController.processRemovalRequest
    ]);
    
    // Get all MetaMask connections
    app.get('/api/admin/metamask/connections', [
        AuthTool.isValidJWT,
        Web3Tool.isAdmin,
        AdminMetaMaskController.getAllConnections
    ]);
    
    // Get connection history for a specific wallet
    app.get('/api/admin/metamask/connections/:walletAddress/history', [
        AuthTool.isValidJWT,
        Web3Tool.isAdmin,
        AdminMetaMaskController.getConnectionHistory
    ]);
    
    // Force remove a connection (admin override)
    app.delete('/api/admin/metamask/connections', [
        AuthTool.isValidJWT,
        Web3Tool.isAdmin,
        AdminMetaMaskController.forceRemoveConnection
    ]);
};
