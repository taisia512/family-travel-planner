const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const PasswordResetToken = sequelize.define('PasswordResetToken', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'password_reset_tokens'
});

module.exports = PasswordResetToken;