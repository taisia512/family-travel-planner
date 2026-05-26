const sequelize = require('./backend/src/database/db');

async function migrate() {
  try {
    await sequelize.query('ALTER TABLE trips ADD COLUMN country VARCHAR(255);');
    await sequelize.query('ALTER TABLE trips ADD COLUMN city VARCHAR(255);');
    await sequelize.query('ALTER TABLE trips ADD COLUMN travelers INTEGER;');
    console.log('Columns added successfully');
  } catch (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('Columns already exist.');
    } else {
      console.error(err);
    }
  }
}

migrate();
