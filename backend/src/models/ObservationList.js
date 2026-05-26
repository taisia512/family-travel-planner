const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const ObservationList = sequelize.define('ObservationList', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userRole: {
    type: DataTypes.STRING,
    allowNull: false
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false
  },
  suspiciousActionCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'UNDER_OBSERVATION'
  }
}, {
  tableName: 'observation_list',
  timestamps: true
});

module.exports = ObservationList;