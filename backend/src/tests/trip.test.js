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
// Setup: fresh DB with roles, permissions, admin user, and trip seed data
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

  // Seed trips
  const trip1 = await Trip.create({
    destination: 'Italy',
    startDate: '2026-06-10',
    endDate: '2026-06-20',
    price: 1200,
    userId: adminUser.id
  });

  await Trip.create({
    destination: 'Japan',
    startDate: '2026-09-01',
    endDate: '2026-09-10',
    price: 2000,
    userId: adminUser.id
  });

  await Expense.create({
    tripId: trip1.id,
    title: 'Hotel',
    amount: 500,
    category: 'Accommodation'
  });
});

afterAll(async () => {
  await sequelize.close();
});

// ---------------------------------------------------------------------------
// Trips API
// ---------------------------------------------------------------------------
describe('Trips API', () => {
  test('GET /api/trips - should return all trips with pagination', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .get('/api/trips?page=1&pageSize=2')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.items.length).toBe(2);
    expect(res.body.totalItems).toBe(2);
  });

  test('GET /api/trips/:id - should return a trip', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .get('/api/trips/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.destination).toBe('Italy');
  });

  test('POST /api/trips - valid trip', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${token}`)
      .send({
        destination: 'Spain',
        startDate: '2026-07-01',
        endDate: '2026-07-10',
        price: 1000
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.destination).toBe('Spain');
  });

  test('POST /api/trips - invalid trip', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${token}`)
      .send({
        destination: '',
        startDate: '2026-07-10',
        endDate: '2026-07-01',
        price: -100
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  test('PUT /api/trips/:id - update trip', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .put('/api/trips/1')
      .set('Authorization', `Bearer ${token}`)
      .send({
        destination: 'France',
        startDate: '2026-06-10',
        endDate: '2026-06-20',
        price: 1500
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.destination).toBe('France');
  });

  test('DELETE /api/trips/:id - delete trip', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .delete('/api/trips/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(204);

    const check = await request(app)
      .get('/api/trips/1')
      .set('Authorization', `Bearer ${token}`);
    expect(check.statusCode).toBe(404);
  });

  test('GET /api/trips/stats - should return statistics', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .get('/api/trips/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.totalTrips).toBe(2);
    expect(res.body.totalPrice).toBe(3200);
  });

  test('GET /api/trips without token returns 401', async () => {
    const res = await request(app).get('/api/trips');
    expect(res.statusCode).toBe(401);
  });
});