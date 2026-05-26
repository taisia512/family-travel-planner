const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const { sequelize, User, Role, Permission } = require('../models');

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Sets up a minimal DB with two roles (admin / user), a full permission set,
 * and two seed users (one admin, one normal user).
 * Returns { adminUser, normalUser, adminRole, userRole }.
 */
async function setupDb() {
  await sequelize.sync({ force: true });

  const adminRole = await Role.create({ name: 'admin' });
  const userRole = await Role.create({ name: 'user' });

  const permissionNames = [
    'VIEW_TRIPS', 'CREATE_TRIP', 'UPDATE_TRIP', 'DELETE_TRIP',
    'VIEW_EXPENSES', 'CREATE_EXPENSE', 'DELETE_EXPENSE', 'VIEW_GLOBAL_STATS'
  ];
  const permissions = await Permission.bulkCreate(permissionNames.map((name) => ({ name })));

  await adminRole.setPermissions(permissions);
  await userRole.setPermissions(permissions.filter((p) => p.name !== 'VIEW_GLOBAL_STATS'));

  const adminHash = await bcrypt.hash('admin1234', 10);
  const userHash = await bcrypt.hash('user11234', 10);

  const adminUser = await User.create({
    fullName: 'Admin User',
    email: 'admin@gmail.com',
    password: adminHash,
    roleId: adminRole.id
  });

  const normalUser = await User.create({
    fullName: 'Normal User',
    email: 'user1@gmail.com',
    password: userHash,
    roleId: userRole.id
  });

  return { adminUser, normalUser, adminRole, userRole };
}

/**
 * Logs in via the API and returns the JWT token string.
 */
async function getToken(email, password) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.token;
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await setupDb();
});

afterAll(async () => {
  await sequelize.close();
});

// ---------------------------------------------------------------------------
// Registration tests
// ---------------------------------------------------------------------------

describe('POST /api/auth/signup', () => {
  test('valid registration returns 201 with token and user', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      fullName: 'New User',
      email: 'newuser@gmail.com',
      password: 'password123'
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe('newuser@gmail.com');
    expect(res.body.user.role).toBe('user');
  });

  test('duplicate email returns 409', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      fullName: 'Admin User',
      email: 'admin@gmail.com',
      password: 'password123'
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });

  test('missing fields return 400', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      email: 'incomplete@gmail.com'
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('invalid email format returns 400', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      fullName: 'Bad Email',
      email: 'not-an-email',
      password: 'password123'
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  test('short password returns 400', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      fullName: 'Short Pass',
      email: 'shortpass@gmail.com',
      password: 'abc'
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });
});

// ---------------------------------------------------------------------------
// Login tests
// ---------------------------------------------------------------------------

describe('POST /api/auth/login', () => {
  test('valid credentials return 200 with token and user', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@gmail.com',
      password: 'admin1234'
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe('admin@gmail.com');
    expect(res.body.user.role).toBe('admin');
    expect(Array.isArray(res.body.user.permissions)).toBe(true);
  });

  test('wrong password returns 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@gmail.com',
      password: 'wrongpassword'
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  test('unknown email returns 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@gmail.com',
      password: 'password123'
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  test('missing fields return 400', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@gmail.com'
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

// ---------------------------------------------------------------------------
// Protected route tests – authentication
// ---------------------------------------------------------------------------

describe('Protected routes – authentication', () => {
  test('GET /api/trips without token returns 401', async () => {
    const res = await request(app).get('/api/trips');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/trips with valid user token returns 200', async () => {
    const token = await getToken('user1@gmail.com', 'user11234');
    const res = await request(app)
      .get('/api/trips')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });

  test('GET /api/trips with invalid token returns 401', async () => {
    const res = await request(app)
      .get('/api/trips')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.statusCode).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Protected route tests – authorization (role-based)
// ---------------------------------------------------------------------------

describe('Protected routes – authorization', () => {
  test('GET /api/admin/users as normal user returns 403', async () => {
    const token = await getToken('user1@gmail.com', 'user11234');
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/access denied/i);
  });

  test('GET /api/admin/users as admin returns 200', async () => {
    const token = await getToken('admin@gmail.com', 'admin1234');
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/admin/activity as admin returns 200', async () => {
    const token = await getToken('admin@gmail.com', 'admin1234');
    const res = await request(app)
      .get('/api/admin/activity')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });
});
