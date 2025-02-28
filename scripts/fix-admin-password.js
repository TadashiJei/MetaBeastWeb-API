/**
 * Script to fix the admin password
 * Run with: node scripts/fix-admin-password.js
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const config = require('../config.js');
const AuthTool = require('../authorization/auth.tool');

// Build MongoDB connection string
const mongoUri = `mongodb://${config.mongo_host}:${config.mongo_port}/${config.mongo_db}`;

// Connect to MongoDB
mongoose.connect(mongoUri).then(() => {
    console.log('Connected to MongoDB');
    fixAdminPassword();
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Fix admin password
async function fixAdminPassword() {
    try {
        // Get the users collection
        const usersCollection = mongoose.connection.collection('users');
        
        // Find admin user
        const adminUser = await usersCollection.findOne({ username: 'admin' });
        
        if (!adminUser) {
            console.log('Admin user not found');
            mongoose.disconnect();
            return;
        }
        
        console.log('Found admin user:', adminUser.username);
        
        // Create properly hashed password using AuthTool
        const password = 'admin123';
        const hashedPassword = AuthTool.hashPassword(password);
        
        // Update admin user with new password
        await usersCollection.updateOne(
            { _id: adminUser._id },
            { $set: { password: hashedPassword } }
        );
        
        console.log('Admin password updated successfully');
        console.log('\nAdmin Login Information:');
        console.log('------------------------');
        console.log('Username: admin');
        console.log('Password: admin123');
        console.log('\nIMPORTANT: Change this password in production!');
        
        mongoose.disconnect();
    } catch (error) {
        console.error('Error fixing admin password:', error);
        mongoose.disconnect();
        process.exit(1);
    }
}
