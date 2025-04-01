module.exports = {
  secret: process.env.JWT_SECRET || 'your_development_secret_key',
  expiresIn: process.env.JWT_EXPIRES_IN || '1d' // 24-hour token lifespan
};