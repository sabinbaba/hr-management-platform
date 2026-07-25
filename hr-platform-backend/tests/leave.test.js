const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');
const { clearDatabase } = require('./helpers');

async function createEmployeeAndLogin(email) {
  await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'SecurePass123', role: 'ADMIN' });

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'SecurePass123' });

  const adminToken = adminLogin.body.token;

  const deptRes = await request(app)
    .post('/api/departments')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Test Department' });

  const empRes = await request(app)
    .post('/api/employees')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      email: 'employee@example.com',
      password: 'SecurePass123',
      fullName: 'Test Employee',
      jobTitle: 'Tester',
      departmentId: deptRes.body.department.id,
      hireDate: '2026-01-01',
    });

  const empLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'employee@example.com', password: 'SecurePass123' });

  return {
    adminToken,
    employeeToken: empLogin.body.token,
    employeeId: empRes.body.employee.id,
  };
}

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/leave-requests', () => {
  it('allows an EMPLOYEE to submit a leave request', async () => {
    const { employeeToken } = await createEmployeeAndLogin('admin1@example.com');

    const res = await request(app)
      .post('/api/leave-requests')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ startDate: '2026-08-01', endDate: '2026-08-05', reason: 'Vacation' });

    expect(res.statusCode).toBe(201);
    expect(res.body.leaveRequest.status).toBe('PENDING');
  });

  it('blocks an ADMIN from submitting a leave request', async () => {
    const { adminToken } = await createEmployeeAndLogin('admin2@example.com');

    const res = await request(app)
      .post('/api/leave-requests')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ startDate: '2026-08-01', endDate: '2026-08-05' });

    expect(res.statusCode).toBe(403);
  });

  it('rejects a request where endDate is before startDate', async () => {
    const { employeeToken } = await createEmployeeAndLogin('admin3@example.com');

    const res = await request(app)
      .post('/api/leave-requests')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ startDate: '2026-08-05', endDate: '2026-08-01' });

    expect(res.statusCode).toBe(400);
  });
});

describe('PATCH /api/leave-requests/:id (state machine)', () => {
  it('allows an ADMIN to approve a pending request', async () => {
    const { adminToken, employeeToken } = await createEmployeeAndLogin('admin4@example.com');

    const createRes = await request(app)
      .post('/api/leave-requests')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ startDate: '2026-08-01', endDate: '2026-08-05' });

    const leaveId = createRes.body.leaveRequest.id;

    const approveRes = await request(app)
      .patch(`/api/leave-requests/${leaveId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'APPROVED' });

    expect(approveRes.statusCode).toBe(200);
    expect(approveRes.body.leaveRequest.status).toBe('APPROVED');
  });

  it('blocks changing a request that has already been decided', async () => {
    const { adminToken, employeeToken } = await createEmployeeAndLogin('admin5@example.com');

    const createRes = await request(app)
      .post('/api/leave-requests')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ startDate: '2026-08-01', endDate: '2026-08-05' });

    const leaveId = createRes.body.leaveRequest.id;

    await request(app)
      .patch(`/api/leave-requests/${leaveId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'APPROVED' });

    const secondAttempt = await request(app)
      .patch(`/api/leave-requests/${leaveId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'REJECTED' });

    expect(secondAttempt.statusCode).toBe(409);
  });
});
