const express = require('express');
const router = express.Router();
const controller = require('../controllers/generatorController');

router.post('/start', controller.startGenerating);
router.post('/stop', controller.stopGenerating);

module.exports = router;