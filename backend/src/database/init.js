const bcrypt = require('bcryptjs');
const {
  sequelize,
  Trip,
  Expense,
  User,
  Role,
  Permission
} = require('../models');

const SALT_ROUNDS = 10;

/**
 * Finds a user by email; creates them with a hashed password if they don't exist.
 * If they already exist with a plain-text password, migrates it to bcrypt.
 */
async function findOrCreateUser(email, fullName, plainPassword, roleId) {
  const existing = await User.findOne({ where: { email } });

  if (existing) {
    // Migrate plain-text password to bcrypt hash if needed
    if (!existing.password.startsWith('$2')) {
      existing.password = await bcrypt.hash(existing.password, SALT_ROUNDS);
      await existing.save();
      console.log(`Migrated password hash for ${email}`);
    }
    return existing;
  }

  const hashed = await bcrypt.hash(plainPassword, SALT_ROUNDS);
  return User.create({ fullName, email, password: hashed, roleId });
}

async function initDatabase() {
  try {
    await sequelize.sync();
    console.log('Database synced');

    const tripCount = await Trip.count();

    if (tripCount === 0) {
      const trip1 = await Trip.create({
        destination: 'Italy',
        startDate: '2026-06-10',
        endDate: '2026-06-20',
        price: 1200
      });

      const trip2 = await Trip.create({
        destination: 'Japan',
        startDate: '2026-09-01',
        endDate: '2026-09-10',
        price: 2000
      });

      await Expense.create({ tripId: trip1.id, title: 'Hotel', amount: 500, category: 'Accommodation' });
      await Expense.create({ tripId: trip1.id, title: 'Food', amount: 200, category: 'Meals' });
      await Expense.create({ tripId: trip2.id, title: 'Transport', amount: 300, category: 'Travel' });

      console.log('Initial trips and expenses inserted');
    }

    const [adminRole] = await Role.findOrCreate({ where: { name: 'admin' } });
    const [userRole] = await Role.findOrCreate({ where: { name: 'user' } });

    const permissionNames = [
      'VIEW_TRIPS',
      'CREATE_TRIP',
      'UPDATE_TRIP',
      'DELETE_TRIP',
      'VIEW_EXPENSES',
      'CREATE_EXPENSE',
      'DELETE_EXPENSE',
      'VIEW_GLOBAL_STATS'
    ];

    const permissions = [];
    for (const permissionName of permissionNames) {
      const [permission] = await Permission.findOrCreate({ where: { name: permissionName } });
      permissions.push(permission);
    }

    await adminRole.setPermissions(permissions);
    await userRole.setPermissions(permissions.filter((p) => p.name !== 'VIEW_GLOBAL_STATS'));

    const adminUser = await findOrCreateUser('admin@gmail.com', 'Admin User', 'admin1234', adminRole.id);
    await findOrCreateUser('user1@gmail.com', 'User One', 'user11234', userRole.id);
    await findOrCreateUser('user2@gmail.com', 'User Two', 'user21234', userRole.id);
    await findOrCreateUser('user3@gmail.com', 'User Three', 'user31234', userRole.id);

    // Assign existing ownerless trips to admin
    const existingTrips = await Trip.findAll({ where: { userId: null } });
    for (const trip of existingTrips) {
      trip.userId = adminUser.id;
      await trip.save();
    }

    console.log('Users, roles and permissions ready');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

module.exports = initDatabase;