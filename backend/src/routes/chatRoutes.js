const express = require('express');
const router = express.Router();

const controller = require('../controllers/chatController');

const {
  authenticate
} = require('../middleware/authMiddleware');

router.get(
  '/chat/messages',
  authenticate,
  controller.getMessages
);

module.exports = router;