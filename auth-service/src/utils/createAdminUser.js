require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');

// Default admin credentials
// const adminUser = {
//   username: 'admin',
//   password: 'Admin123!',
//   name: 'Administrator',
//   role: 'admin'
// };

const adminUser = {
  username: 'mrcrumpet',
  password: 'Crumpet123!',
  name: 'Mr Crumpet',
  role: 'user'
  };

async function createAdminUser() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agent-chat-auth';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ username: adminUser.username });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
    } else {
      // Create new admin user
      const newAdmin = new User(adminUser);
      await newAdmin.save();
      console.log('Admin user created successfully');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  createAdminUser();
}

module.exports = createAdminUser;