import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/Form.css';
import { API_BASE_URL } from '../config/api';
function TripDetail({ trips }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const savedUser = JSON.parse(localStorage.getItem('user'));
  const userId = savedUser?.id;
  const token = localStorage.getItem('token');
  const permissions = savedUser?.permissions || [];

  const canUpdateTrip = permissions.includes('UPDATE_TRIP');
  const canCreateExpense = permissions.includes('CREATE_EXPENSE');
  const canDeleteExpense = permissions.includes('DELETE_EXPENSE');

  const [expenses, setExpenses] = useState([]);
  const [expenseStats, setExpenseStats] = useState({
    totalExpenses: 0,
    totalAmount: 0,
    averageAmount: 0
  });

  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: ''
  });

  const trip = trips.find((t) => t.id === parseInt(id, 10));

  useEffect(() => {
    const fetchExpenses = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/trips/${id}/expenses`, {
      headers: {
        'x-user-id': userId,
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    setExpenses(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Failed to fetch expenses:', error);
    setExpenses([]);
  }
};

const fetchExpenseStats = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/trips/${id}/expenses/stats`, {
      headers: {
        'x-user-id': userId,
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    setExpenseStats({
      totalExpenses: data.totalExpenses || 0,
      totalAmount: data.totalAmount || 0,
      averageAmount: data.averageAmount || 0
    });
  } catch (error) {
    console.error('Failed to fetch expense stats:', error);
  }
};
    if (trip) {
      fetchExpenses();
      fetchExpenseStats();
    }
  }, [id, trip]);

  if (!trip) {
    return (
      <div className="form-layout">
        <Sidebar />
        <main className="form-main">
          <div className="form-container">
            <h1 className="form-title">Trip not found</h1>
            <button
              className="btn confirm-btn"
              onClick={() => navigate('/dashboard')}
              type="button"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleEdit = () => {
    navigate(`/edit-trip/${id}`);
  };

  const handleAddExpense = async () => {
    if (
      newExpense.title.trim() === '' ||
      newExpense.amount === '' ||
      newExpense.category.trim() === ''
    ) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/trips/${id}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
           Authorization: `Bearer ${token}`
          },
        body: JSON.stringify({
          title: newExpense.title,
          amount: Number(newExpense.amount),
          category: newExpense.category
        })
      });

      const data = await res.json();

      setExpenses((prev) => [...prev, data]);

      const updatedTotalExpenses = expenseStats.totalExpenses + 1;
      const updatedTotalAmount = expenseStats.totalAmount + Number(data.amount);
      const updatedAverageAmount =
        updatedTotalExpenses > 0 ? updatedTotalAmount / updatedTotalExpenses : 0;

      setExpenseStats({
        totalExpenses: updatedTotalExpenses,
        totalAmount: updatedTotalAmount,
        averageAmount: updatedAverageAmount
      });

      setNewExpense({
        title: '',
        amount: '',
        category: ''
      });
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
  };

  const handleDeleteExpense = async (expenseId, expenseAmount) => {
    try {
      await fetch(`${API_BASE_URL}/api/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: {
  'x-user-id': userId,
  Authorization: `Bearer ${token}`
}
      });

      setExpenses((prev) => prev.filter((expense) => expense.id !== expenseId));

      const updatedTotalExpenses = Math.max(expenseStats.totalExpenses - 1, 0);
      const updatedTotalAmount = Math.max(expenseStats.totalAmount - Number(expenseAmount), 0);
      const updatedAverageAmount =
        updatedTotalExpenses > 0 ? updatedTotalAmount / updatedTotalExpenses : 0;

      setExpenseStats({
        totalExpenses: updatedTotalExpenses,
        totalAmount: updatedTotalAmount,
        averageAmount: updatedAverageAmount
      });
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  return (
    <div className="form-layout">
      <Sidebar />

      <main className="form-main">
        <div className="form-container">
          <h1 className="form-title">Trip Details:</h1>

          <div className="detail-group">
            <label>Country:</label>
            <div className="detail-value">
              {trip.country || '—'}
            </div>
          </div>

          <div className="detail-group">
            <label>City:</label>
            <div className="detail-value">
              {trip.city || trip.destination || '—'}
            </div>
          </div>

          <div className="detail-group">
            <label>Start Date:</label>
            <div className="detail-value">{formatDate(trip.startDate)}</div>
          </div>

          <div className="detail-group">
            <label>End Date:</label>
            <div className="detail-value">{formatDate(trip.endDate)}</div>
          </div>

          <div className="detail-group">
            <label>Travelers:</label>
            <div className="detail-value">{trip.travelers}</div>
          </div>

          <div className="trip-extra-section">
            <h2 className="trip-extra-title">Expense Statistics</h2>
            <div className="trip-stats-grid">
              <div className="trip-stat-card">
                <span className="trip-stat-label">Total expenses</span>
                <span className="trip-stat-value">{expenseStats.totalExpenses}</span>
              </div>

              <div className="trip-stat-card">
                <span className="trip-stat-label">Total amount</span>
                <span className="trip-stat-value">{expenseStats.totalAmount} RON</span>
              </div>

              <div className="trip-stat-card">
                <span className="trip-stat-label">Average amount</span>
                <span className="trip-stat-value">
                  {expenseStats.averageAmount.toFixed(2)} RON
                </span>
              </div>
            </div>
          </div>

          <div className="trip-extra-section">
            <h2 className="trip-extra-title">Expenses</h2>

            {expenses.length === 0 ? (
              <div className="trip-empty-expenses">No expenses yet.</div>
            ) : (
              <div className="trip-expenses-list">
                {expenses.map((expense) => (
                  <div key={expense.id} className="trip-expense-item">
                    <div className="trip-expense-info">
                      <div className="trip-expense-title">{expense.title}</div>
                      <div className="trip-expense-meta">
                        {expense.amount} RON · {expense.category}
                      </div>
                    </div>

                    {canDeleteExpense && (
                      <button
                        type="button"
                        className="btn cancel-btn trip-expense-delete"
                        onClick={() => handleDeleteExpense(expense.id, expense.amount)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {canCreateExpense && (
            <div className="trip-extra-section">
              <h2 className="trip-extra-title">Add Expense</h2>

              <div className="trip-expense-form">
                <input
                  type="text"
                  placeholder="Title"
                  value={newExpense.title}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, title: e.target.value })
                  }
                />

                <input
                  type="number"
                  placeholder="Amount"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, amount: e.target.value })
                  }
                />

                <input
                  type="text"
                  placeholder="Category"
                  value={newExpense.category}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, category: e.target.value })
                  }
                />

                <button
                  type="button"
                  className="btn confirm-btn trip-expense-add-btn"
                  onClick={handleAddExpense}
                >
                  Add Expense
                </button>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn cancel-btn"
              onClick={handleBack}
            >
              Back
            </button>

            {canUpdateTrip && (
              <button
                type="button"
                className="btn confirm-btn"
                onClick={handleEdit}
              >
                Edit Trip
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default TripDetail;
