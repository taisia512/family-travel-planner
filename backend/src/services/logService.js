const { ActivityLog, ObservationList, User, Role } = require('../models');
const { Op } = require('sequelize');

const createLog = async ({ userId, action, details }) => {
  let userEmail = 'Unknown user';
  let userRole = 'unknown';

  if (userId) {
    const user = await User.findByPk(userId, {
      include: Role
    });

    if (user) {
      userEmail = user.email;
      userRole = user.Role ? user.Role.name : 'user';
    }
  }

  const log = await ActivityLog.create({
    userId,
    userEmail,
    userRole,
    action,
    details
  });

  await detectSuspiciousBehavior(userId, userEmail, userRole);

  return log;
};

const detectSuspiciousBehavior = async (userId, userEmail, userRole) => {
  if (!userId) return;

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  const deleteCount = await ActivityLog.count({
    where: {
      userId,
      action: {
        [Op.like]: '%DELETE%'
      },
      createdAt: {
        [Op.gte]: fiveMinutesAgo
      }
    }
  });

  const crudCount = await ActivityLog.count({
    where: {
      userId,
      action: {
        [Op.in]: [
          'CREATE_TRIP',
          'UPDATE_TRIP',
          'DELETE_TRIP',
          'CREATE_EXPENSE',
          'UPDATE_EXPENSE',
          'DELETE_EXPENSE'
        ]
      },
      createdAt: {
        [Op.gte]: tenMinutesAgo
      }
    }
  });

  let reason = null;
  let count = 0;

  if (deleteCount >= 3) {
    reason = 'User performed 3 or more delete actions in 5 minutes';
    count = deleteCount;
  } else if (crudCount >= 10) {
    reason = 'User performed 10 or more CRUD actions in 10 minutes';
    count = crudCount;
  }

  if (!reason) return;

  const existing = await ObservationList.findOne({
    where: { userId }
  });

  if (existing) {
    await existing.update({
      reason,
      suspiciousActionCount: count,
      status: 'UNDER_OBSERVATION'
    });
  } else {
    await ObservationList.create({
      userId,
      userEmail,
      userRole,
      reason,
      suspiciousActionCount: count,
      status: 'UNDER_OBSERVATION'
    });
  }
};

module.exports = {
  createLog
};