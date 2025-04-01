// Admin middleware
// Checks if the authenticated user has admin role
module.exports = (req, res, next) => {
  // User should be attached to request by auth middleware
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};