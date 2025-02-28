const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const metamaskConnectionSchema = new Schema({
    walletAddress: { 
        type: String, 
        required: true, 
        index: true, 
        unique: true, 
        lowercase: true 
    },
    userId: { 
        type: String, 
        required: true, 
        index: true 
    },
    connectionTime: { 
        type: Date, 
        default: Date.now 
    },
    lastUsed: { 
        type: Date, 
        default: Date.now 
    },
    nonce: { 
        type: String, 
        default: "" 
    },
    chainId: { 
        type: String, 
        default: "" 
    },
    removalRequest: {
        status: { 
            type: String, 
            enum: ['none', 'pending', 'approved', 'rejected'], 
            default: 'none' 
        },
        requestTime: { 
            type: Date, 
            default: null 
        },
        reason: { 
            type: String, 
            default: "" 
        },
        email: { 
            type: String, 
            default: "" 
        },
        adminNotes: { 
            type: String, 
            default: "" 
        },
        processedBy: { 
            type: String, 
            default: "" 
        },
        processedTime: { 
            type: Date, 
            default: null 
        }
    }
});

metamaskConnectionSchema.methods.toObj = function() {
    var connection = this.toObject();
    delete connection.__v;
    delete connection._id;
    return connection;
};

const MetaMaskConnection = mongoose.model('MetaMaskConnections', metamaskConnectionSchema);

// CRUD Operations
exports.getByWalletAddress = async(address) => {
    try {
        const connection = await MetaMaskConnection.findOne({ walletAddress: address.toLowerCase() });
        return connection;
    } catch {
        return null;
    }
};

exports.getByUserId = async(userId) => {
    try {
        const connections = await MetaMaskConnection.find({ userId: userId });
        return connections || [];
    } catch {
        return [];
    }
};

exports.getPendingRemovalRequests = async() => {
    try {
        const connections = await MetaMaskConnection.find({ 'removalRequest.status': 'pending' });
        return connections || [];
    } catch {
        return [];
    }
};

exports.create = async(connectionData) => {
    try {
        // Ensure wallet address is lowercase
        if (connectionData.walletAddress) {
            connectionData.walletAddress = connectionData.walletAddress.toLowerCase();
        }
        
        const connection = new MetaMaskConnection(connectionData);
        return await connection.save();
    } catch (error) {
        throw error;
    }
};

exports.update = async(connection, data) => {
    try {
        // Update fields
        for (let i in data) {
            connection[i] = data[i];
        }
        
        // Save
        return await connection.save();
    } catch (error) {
        throw error;
    }
};

exports.updateByWalletAddress = async(walletAddress, data) => {
    try {
        const connection = await this.getByWalletAddress(walletAddress);
        if (!connection) {
            throw new Error('Connection not found');
        }
        
        return await this.update(connection, data);
    } catch (error) {
        throw error;
    }
};

exports.requestRemoval = async(walletAddress, email, reason) => {
    try {
        const connection = await this.getByWalletAddress(walletAddress);
        if (!connection) {
            throw new Error('Connection not found');
        }
        
        connection.removalRequest = {
            status: 'pending',
            requestTime: new Date(),
            reason: reason || '',
            email: email || ''
        };
        
        return await connection.save();
    } catch (error) {
        throw error;
    }
};

exports.processRemovalRequest = async(walletAddress, status, adminId, notes) => {
    try {
        const connection = await this.getByWalletAddress(walletAddress);
        if (!connection) {
            throw new Error('Connection not found');
        }
        
        if (connection.removalRequest.status !== 'pending') {
            throw new Error('No pending removal request found');
        }
        
        connection.removalRequest.status = status;
        connection.removalRequest.processedBy = adminId;
        connection.removalRequest.processedTime = new Date();
        connection.removalRequest.adminNotes = notes || '';
        
        return await connection.save();
    } catch (error) {
        throw error;
    }
};

exports.remove = async(walletAddress) => {
    try {
        return await MetaMaskConnection.deleteOne({ walletAddress: walletAddress.toLowerCase() });
    } catch (error) {
        throw error;
    }
};

exports.count = async() => {
    try {
        return await MetaMaskConnection.countDocuments();
    } catch {
        return 0;
    }
};

exports.countPendingRemovals = async() => {
    try {
        return await MetaMaskConnection.countDocuments({ 'removalRequest.status': 'pending' });
    } catch {
        return 0;
    }
};
