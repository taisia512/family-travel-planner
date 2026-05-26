const sequelize = require('../database/db');

const Trip = require('./Trip');
const Expense = require('./Expense');

const User = require('./User');
const Role = require('./Role');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
const ActivityLog = require('./ActivityLog');
const ObservationList = require('./ObservationList');
const LoginCode = require('./LoginCode');
const PasswordResetToken = require('./PasswordResetToken');

Trip.hasMany(Expense, {
  foreignKey: 'tripId',
  onDelete: 'CASCADE'
});

Expense.belongsTo(Trip, {
  foreignKey: 'tripId'
});

Role.hasMany(User, {
  foreignKey: 'roleId'
});

User.belongsTo(Role, {
  foreignKey: 'roleId'
});

User.hasMany(Trip, {
  foreignKey: 'userId',
  onDelete: 'CASCADE'
});

Trip.belongsTo(User, {
  foreignKey: 'userId'
});

User.hasMany(ActivityLog, {
  foreignKey: 'userId',
  onDelete: 'CASCADE'
});

ActivityLog.belongsTo(User, {
  foreignKey: 'userId'
});

Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'roleId',
  otherKey: 'permissionId'
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permissionId',
  otherKey: 'roleId'
});

User.hasMany(ObservationList, {
  foreignKey: 'userId',
  onDelete: 'CASCADE'
});

ObservationList.belongsTo(User, {
  foreignKey: 'userId'
});


User.hasMany(LoginCode, {
  foreignKey: 'userId',
  onDelete: 'CASCADE'
});

LoginCode.belongsTo(User, {
  foreignKey: 'userId'
});

User.hasMany(PasswordResetToken, {
  foreignKey: 'userId',
  onDelete: 'CASCADE'
});

PasswordResetToken.belongsTo(User, {
  foreignKey: 'userId'
});

module.exports = {
  sequelize,
  Trip,
  Expense,
  User,
  Role,
  Permission,
  RolePermission,
  ActivityLog,
  ObservationList,
  LoginCode,
  PasswordResetToken
};