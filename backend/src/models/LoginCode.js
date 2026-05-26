const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const LoginCode = sequelize.define('LoginCode', {
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
  tableName: 'login_codes'
});

module.exports = LoginCode;