const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/login', loginLimiter, authController.login);

// Protected routes
router.get('/me', authMiddleware, authController.getMe);
router.put('/me', authMiddleware, authController.updateMe);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;