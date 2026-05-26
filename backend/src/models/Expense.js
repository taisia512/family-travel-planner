const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const Expense = sequelize.define('Expense', {
  tripId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'expenses'
});

module.exports = Expense;