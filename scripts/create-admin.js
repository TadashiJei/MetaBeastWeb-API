/**
 * Script to create an admin user
 * Run with: node scripts/create-admin.js
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const config = require('../config.js');
const { UserModel } = require('../users/users.model');

// Build MongoDB connection string
const mongoUri = `mongodb+srv://${config.mongo_user}:${config.mongo_pass}@${config.mongo_host}/${config.mongo_db}?retryWrites=true&w=majority`;

// Connect to MongoDB
mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
    createAdminUser();
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Create admin user
async function createAdminUser() {
    try {
        const username = 'admin';
        const email = 'admin@metabeast.fun';
        const password = 'admin123'; // You should change this in production
        
        // Check if user already exists
        const existingUser = await UserModel.findOne({ username });
        
        if (existingUser) {
            console.log(`User '${username}' already exists. Updating to admin...`);
            
            // Update to admin if not already
            if (existingUser.permission_level < 2) {
                await UserModel.updateOne(
                    { _id: existingUser._id },
                    { $set: { permission_level: 2 } }
                );
                console.log(`User '${username}' updated to admin.`);
            } else {
                console.log(`User '${username}' is already an admin.`);
            }
        } else {
            // Create new admin user
            const passwordHash = crypto.createHmac('sha512', config.jwt_secret).update(password).digest("hex");
            
            const newUser = new UserModel({
                username,
                email,
                password: passwordHash,
                permission_level: 2, // Admin level
                validation_level: 1,
                account_create_time: new Date(),
                last_login_time: null,
                last_online_time: null
            });
            
            await newUser.save();
            console.log(`Admin user '${username}' created successfully.`);
        }
        
        // Display login information
        console.log('\nAdmin Login Information:');
        console.log('------------------------');
        console.log(`Username: ${username}`);
        console.log(`Password: ${password}`);
        console.log('\nIMPORTANT: Change this password in production!');
        
        // Disconnect from MongoDB
        mongoose.disconnect();
    } catch (error) {
        console.error('Error creating admin user:', error);
        mongoose.disconnect();
        process.exit(1);
    }
}
