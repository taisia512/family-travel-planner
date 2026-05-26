const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const RolePermission = sequelize.define('RolePermission', {
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  permissionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'role_permissions'
});

module.exports = RolePermission;