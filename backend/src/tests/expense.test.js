const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const { sequelize, Trip, Expense, User, Role, Permission } = require('../models');

// ---------------------------------------------------------------------------
// Helper: get a valid JWT token for the test admin user
// ---------------------------------------------------------------------------
async function getAdminToken() {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@gmail.com', password: 'admin1234' });
  return res.body.token;
}

// ---------------------------------------------------------------------------
// Setup: fresh DB with roles, user, and expense seed data
// ---------------------------------------------------------------------------
beforeEach(async () => {
  await sequelize.sync({ force: true });

  // Roles & permissions
  const adminRole = await Role.create({ name: 'admin' });
  const userRole = await Role.create({ name: 'user' });
  const permissionNames = [
    'VIEW_TRIPS', 'CREATE_TRIP', 'UPDATE_TRIP', 'DELETE_TRIP',
    'VIEW_EXPENSES', 'CREATE_EXPENSE', 'DELETE_EXPENSE', 'VIEW_GLOBAL_STATS'
  ];
  const permissions = await Permission.bulkCreate(permissionNames.map((n) => ({ name: n })));
  await adminRole.setPermissions(permissions);
  await userRole.setPermissions(permissions.filter((p) => p.name !== 'VIEW_GLOBAL_STATS'));

  // Admin user with hashed password
  const hash = await bcrypt.hash('admin1234', 10);
  const adminUser = await User.create({
    fullName: 'Admin User',
    email: 'admin@gmail.com',
    password: hash,
    roleId: adminRole.id
  });

  // Seed trip and expenses
  const trip = await Trip.create({
    destination: 'Italy',
    startDate: '2026-06-10',
    endDate: '2026-06-20',
    price: 1200,
    userId: adminUser.id
  });

  await Expense.create({ tripId: trip.id, title: 'Hotel', amount: 500, category: 'Accommodation' });
  await Expense.create({ tripId: trip.id, title: 'Food', amount: 200, category: 'Meals' });
});

afterAll(async () => {
  await sequelize.close();
});

// ---------------------------------------------------------------------------
// Expenses API
// ---------------------------------------------------------------------------
describe('Expenses API', () => {
  test('GET /api/trips/:tripId/expenses - should return expenses', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .get('/api/trips/1/expenses')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
  });

  test('POST /api/trips/:tripId/expenses - should create expense', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .post('/api/trips/1/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Museum', amount: 50, category: 'Activities' });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Museum');
  });

  test('PUT /api/expenses/:id - should update expense', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .put('/api/expenses/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Hotel', amount: 600, category: 'Accommodation' });

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Updated Hotel');
  });

  test('DELETE /api/expenses/:id - should delete expense', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .delete('/api/expenses/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(204);
  });

  test('GET /api/trips/:tripId/expenses/stats - should return expense statistics', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .get('/api/trips/1/expenses/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.totalExpenses).toBe(2);
    expect(res.body.totalAmount).toBe(700);
  });

  test('GET /api/trips/:tripId/expenses without token returns 401', async () => {
    const res = await request(app).get('/api/trips/1/expenses');
    expect(res.statusCode).toBe(401);
  });
});