const expenseService = require('../services/expenseService');
const { createLog } = require('../services/logService');

const getExpensesByTrip = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  const expenses = await expenseService.getExpensesByTripId(tripId);

  res.json(expenses);
};

const createExpense = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  const userId = req.headers['x-user-id'];

  const newExpense = await expenseService.createExpense(tripId, req.body);

  await createLog({
    userId,
    action: 'CREATE_EXPENSE',
    details: `Added expense to trip ID ${tripId}`
  });

  const io = req.app.get('io');
  if (io) io.emit('activityLogged');

  res.status(201).json(newExpense);
};

const updateExpense = async (req, res) => {
  const id = parseInt(req.params.id);
  const userId = req.headers['x-user-id'];

  const updatedExpense = await expenseService.updateExpense(id, req.body);

  if (!updatedExpense) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  await createLog({
    userId,
    action: 'UPDATE_EXPENSE',
    details: `Updated expense ID ${id}`
  });

  const io = req.app.get('io');
  if (io) io.emit('activityLogged');

  res.json(updatedExpense);
};

const deleteExpense = async (req, res) => {
  const id = parseInt(req.params.id);
  const userId = req.headers['x-user-id'];

  const success = await expenseService.deleteExpense(id);

  if (!success) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  await createLog({
    userId,
    action: 'DELETE_EXPENSE',
    details: `Deleted expense ID ${id}`
  });

  const io = req.app.get('io');
  if (io) io.emit('activityLogged');

  res.status(204).send();
};

const getExpenseStats = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  const stats = await expenseService.getExpenseStatsForTrip(tripId);

  res.json(stats);
};

module.exports = {
  getExpensesByTrip,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats
};