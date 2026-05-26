const { Expense } = require('../models');

const getExpensesByTripId = async (tripId) => {
  return await Expense.findAll({
    where: { tripId }
  });
};

const getExpenseById = async (id) => {
  return await Expense.findByPk(id);
};

const createExpense = async (tripId, expenseData) => {
  return await Expense.create({
    tripId,
    title: expenseData.title,
    amount: expenseData.amount,
    category: expenseData.category
  });
};

const updateExpense = async (id, updatedData) => {
  const expense = await Expense.findByPk(id);

  if (!expense) {
    return null;
  }

  await expense.update({
    title: updatedData.title,
    amount: updatedData.amount,
    category: updatedData.category
  });

  return expense;
};

const deleteExpense = async (id) => {
  const expense = await Expense.findByPk(id);

  if (!expense) {
    return false;
  }

  await expense.destroy();
  return true;
};

const getExpenseStatsForTrip = async (tripId) => {
  const expenses = await Expense.findAll({
    where: { tripId }
  });

  const totalExpenses = expenses.length;
  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const averageAmount = totalExpenses > 0 ? totalAmount / totalExpenses : 0;

  return {
    totalExpenses,
    totalAmount,
    averageAmount
  };
};

module.exports = {
  getExpensesByTripId,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStatsForTrip
};