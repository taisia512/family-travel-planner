const express = require('express');
const router = express.Router();
const controller = require('../controllers/tripController');

const {
  authenticate,
  requirePermission
} = require('../middleware/authMiddleware');

// VIEW trips
router.get(
  '/',
  authenticate,
  requirePermission('VIEW_TRIPS'),
  controller.getTrips
);

// VIEW stats
router.get(
  '/stats',
  authenticate,
  requirePermission('VIEW_TRIPS'),
  controller.getTripStats
);

// VIEW single trip
router.get(
  '/:id',
  authenticate,
  requirePermission('VIEW_TRIPS'),
  controller.getTrip
);

// CREATE trip
router.post(
  '/',
  authenticate,
  requirePermission('CREATE_TRIP'),
  controller.createTrip
);

// UPDATE trip
router.put(
  '/:id',
  authenticate,
  requirePermission('UPDATE_TRIP'),
  controller.updateTrip
);

// DELETE trip
router.delete(
  '/:id',
  authenticate,
  requirePermission('DELETE_TRIP'),
  controller.deleteTrip
);

module.exports = router;