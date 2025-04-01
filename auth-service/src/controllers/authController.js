const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { secret, expiresIn } = require('../config/jwt');

// Login user
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    // Find user by username
    const user = await User.findOne({ username }).select('+password');
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if user is active
    if (!user.active) {
      return res.status(401).json({ message: 'Account is inactive' });
    }
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Update last login timestamp
    user.lastLogin = Date.now();
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      secret,
      { expiresIn }
    );
    
    // Return user data and token
    return res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
exports.updateMe = async (req, res) => {
  try {
    const { name } = req.body;
    
    // Only allow updating the name
    if (name) {
      req.user.name = name;
      await req.user.save();
    }
    
    return res.status(200).json({
      user: {
        id: req.user._id,
        username: req.user.username,
        name: req.user.name,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    // In a stateless JWT implementation, the client is responsible for removing the token
    // The server can't invalidate the token directly
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};