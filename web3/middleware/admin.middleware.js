/**
 * Admin middleware for protecting admin routes
 */

const jwt = require('jsonwebtoken');
const config = require('../../config.js');
const { UserModel } = require('../../users/users.model');
const Web3Tool = require('../tools/web3.tool');

// Middleware to check if user is an admin
exports.isAdmin = async (req, res, next) => {
    try {
        // Get authorization header
        let authorization = req.headers['authorization'];
        
        if (!authorization) {
            return res.status(401).json({ error: 'No authorization header provided' });
        }

        // Check if token format is valid
        if (authorization.startsWith('Bearer ')) {
            // Remove Bearer from string
            let token = authorization.slice(7, authorization.length);
            
            try {
                // Verify token
                let decoded = jwt.verify(token, config.jwt_secret);
                
                // Add user info to request
                req.jwt = decoded;
                
                // Update last online time
                await UserModel.patch(decoded.userId, { last_online_time: new Date() });
                
                // Use the Web3Tool.isAdmin middleware to check admin permissions
                return Web3Tool.isAdmin(req, res, next);
            } catch (err) {
                return res.status(401).json({ error: 'Invalid token' });
            }
        } else {
            return res.status(401).json({ error: 'Invalid authorization format' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Middleware to check if user is authenticated (any permission level)
exports.isAuthenticated = async (req, res, next) => {
    try {
        // Get authorization header
        let authorization = req.headers['authorization'];
        
        if (!authorization) {
            return res.status(401).json({ error: 'No authorization header provided' });
        }

        // Check if token format is valid
        if (authorization.startsWith('Bearer ')) {
            // Remove Bearer from string
            let token = authorization.slice(7, authorization.length);
            
            try {
                // Verify token
                let decoded = jwt.verify(token, config.jwt_secret);
                
                // Add user info to request
                req.jwt = decoded;
                
                // Update last online time
                await UserModel.patch(decoded.userId, { last_online_time: new Date() });
                
                // Continue to next middleware/route handler
                return next();
            } catch (err) {
                return res.status(401).json({ error: 'Invalid token' });
            }
        } else {
            return res.status(401).json({ error: 'Invalid authorization format' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};
