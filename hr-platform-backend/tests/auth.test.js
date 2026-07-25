const request = require('supertest');
const app = require('../src/app');
const { clearDatabase } = require('./helpers');

beforeEach(async () => {
  await clearDatabase();
});

describe('POST /api/auth/register', () => {
  it('creates a new user with valid data', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'SecurePass123', role: 'ADMIN' });

    expect(res.statusCode).toBe(201);
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', password: 'SecurePass123', role: 'ADMIN' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', password: 'SecurePass123', role: 'ADMIN' });

    expect(res.statusCode).toBe(409);
  });

  it('rejects an invalid email with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'SecurePass123', role: 'ADMIN' });

    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'login-test@example.com', password: 'SecurePass123', role: 'ADMIN' });
  });

  it('logs in successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login-test@example.com', password: 'SecurePass123' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('rejects an incorrect password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login-test@example.com', password: 'WrongPassword' });

    expect(res.statusCode).toBe(401);
  });

  it('gives the same error for a nonexistent email as for a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'doesnotexist@example.com', password: 'WrongPassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });
});
