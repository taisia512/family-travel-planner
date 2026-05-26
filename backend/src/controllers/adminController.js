const { User, Role, Permission, ActivityLog, ObservationList } = require('../models');
const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: {
        model: Role,
        include: Permission
      },
      attributes: { exclude: ['password'] }
    });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.findAll({
      include: {
        model: User,
        attributes: ['email', 'fullName']
      },
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
};


const getObservationList = async (req, res) => {
  try {
    const suspiciousUsers = await ObservationList.findAll({
      include: {
        model: User,
        attributes: ['email', 'fullName']
      },
      order: [['updatedAt', 'DESC']]
    });

    res.json(suspiciousUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch observation list' });
  }
};

module.exports = {
  getUsers,
  getActivityLogs,
  getObservationList
};