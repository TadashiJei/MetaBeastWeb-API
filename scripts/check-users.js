const mongoose = require('mongoose');
const config = require('../config.js');

// Set up MongoDB connection
let user = "";
if(config.mongo_user && config.mongo_pass)
    user = config.mongo_user + ":" + config.mongo_pass + "@";

const connect = "mongodb://" + user + config.mongo_host + ":" + config.mongo_port + "/" + config.mongo_db;

mongoose.connect(connect)
    .then(() => {
        console.log('Connected to MongoDB');
        checkUsers();
    })
    .catch(err => {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    });

async function checkUsers() {
    try {
        // Get the users collection
        const usersCollection = mongoose.connection.collection('users');
        
        // Find all users
        const users = await usersCollection.find({}).toArray();
        
        console.log('Total users found:', users.length);
        
        if (users.length > 0) {
            console.log('\nUser details:');
            users.forEach(user => {
                console.log('-----------------------------------');
                console.log('ID:', user._id);
                console.log('Username:', user.username);
                console.log('Email:', user.email);
                console.log('Permission Level:', user.permission_level);
                console.log('-----------------------------------');
            });
        } else {
            console.log('No users found in the database.');
        }
        
        mongoose.connection.close();
    } catch (error) {
        console.error('Error checking users:', error);
        mongoose.connection.close();
        process.exit(1);
    }
}
