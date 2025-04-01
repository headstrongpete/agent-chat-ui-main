const jwt = require('jsonwebtoken');
const { secret } = require('../config/jwt');
const User = require('../models/user');

module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    console.log('Auth middleware:', {
      hasAuthHeader: !!authHeader,
      startsWithBearer: authHeader?.startsWith('Bearer '),
      secret: secret ? '***' : 'missing'
    });

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token received:', token.substring(0, 20) + '...');
    
    // Verify token
    const decoded = jwt.verify(token, secret);
    console.log('Token decoded:', {
      userId: decoded.userId,
      role: decoded.role,
      iat: new Date(decoded.iat * 1000).toISOString(),
      exp: new Date(decoded.exp * 1000).toISOString()
    });
    
    // Find user and check if still active
    const user = await User.findById(decoded.userId);
    console.log('User found:', {
      found: !!user,
      active: user?.active,
      role: user?.role
    });

    if (!user || !user.active) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired, please log in again' });
    }
    return res.status(401).json({ message: 'Invalid authentication' });
  }
};