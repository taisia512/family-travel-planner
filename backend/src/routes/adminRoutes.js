const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

// All admin routes require a valid JWT AND the 'admin' role.
router.get('/users', authenticate, requireRole('admin'), adminController.getUsers);
router.get('/activity', authenticate, requireRole('admin'), adminController.getActivityLogs);
router.get('/observation-list', authenticate, requireRole('admin'), adminController.getObservationList);

module.exports = router;
