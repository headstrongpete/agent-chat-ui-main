const express = require('express');
const agentController = require('../controllers/agentController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting
const agentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Protect all routes
router.use(authMiddleware);

// Restrict admin-only routes
// GET / endpoint should be accessible by all authenticated users
router.get('/', agentController.getAllAgents);
router.get('/by-assistant/:assistantId', agentController.getAgentByAssistantId);

// Apply admin middleware to all other routes
router.use(adminMiddleware);

// Apply rate limiting
router.use(agentLimiter);

// Admin-only routes
router.post('/', agentController.createAgent);
router.get('/:id', agentController.getAgentById);
router.put('/:id', agentController.updateAgent);
router.delete('/:id', agentController.deleteAgent);
router.patch('/:id/status', agentController.toggleAgentStatus);
router.post('/available', agentController.fetchAvailableAgents);

module.exports = router;