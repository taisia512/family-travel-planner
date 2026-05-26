const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const Permission = sequelize.define('Permission', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'permissions'
});

module.exports = Permission;