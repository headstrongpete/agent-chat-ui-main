require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

// Constants
const PORT = process.env.PORT || 4000; // Changed from 4001 to 4000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agent-chat-auth';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  process.exit(1);
});