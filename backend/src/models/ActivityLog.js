const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const ActivityLog = sequelize.define('ActivityLog', {
  userEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userRole: {
    type: DataTypes.STRING,
    allowNull: true
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  details: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'activity_logs',
  timestamps: true
});

module.exports = ActivityLog;