const express = require('express');
const router = express.Router();
const controller = require('../controllers/expenseController');

const {
  authenticate,
  requirePermission
} = require('../middleware/authMiddleware');

// GET all expenses for a trip
router.get(
  '/trips/:tripId/expenses',
  authenticate,
  requirePermission('VIEW_EXPENSES'),
  controller.getExpensesByTrip
);

// GET expense stats
router.get(
  '/trips/:tripId/expenses/stats',
  authenticate,
  requirePermission('VIEW_EXPENSES'),
  controller.getExpenseStats
);

// CREATE expense
router.post(
  '/trips/:tripId/expenses',
  authenticate,
  requirePermission('CREATE_EXPENSE'),
  controller.createExpense
);

// UPDATE expense
router.put(
  '/expenses/:id',
  authenticate,
  requirePermission('CREATE_EXPENSE'),
  controller.updateExpense
);

// DELETE expense
router.delete(
  '/expenses/:id',
  authenticate,
  requirePermission('DELETE_EXPENSE'),
  controller.deleteExpense
);

module.exports = router;