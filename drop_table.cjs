const sequelize = require('./backend/src/database/db');

async function fixPermissions() {
  try {
    await sequelize.query('DROP TABLE IF EXISTS role_permissions;');
    console.log('Table dropped successfully');
  } catch (err) {
    console.error(err);
  }
}

fixPermissions();
