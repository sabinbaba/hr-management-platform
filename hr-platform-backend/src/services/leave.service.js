const prisma = require('../config/database');
const { recordAudit } = require('./audit.service');

async function getEmployeeByUserId(userId) {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) {
    const error = new Error('No employee profile linked to this account');
    error.statusCode = 404;
    throw error;
  }
  return employee;
}

async function createLeaveRequest(userId, { startDate, endDate, reason }) {
  const employee = await getEmployeeByUserId(userId);

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < start) {
    const error = new Error('End date cannot be before start date');
    error.statusCode = 400;
    throw error;
  }

  return prisma.leaveRequest.create({
    data: {
      employeeId: employee.id,
      startDate: start,
      endDate: end,
      reason,
    },
  });
}

async function getAllLeaveRequests({ status, page = 1, limit = 10 }) {
  const skip = (page - 1) * limit;
  const where = { ...(status && { status }) };

  const [leaveRequests, total] = await prisma.$transaction([
    prisma.leaveRequest.findMany({
      where,
      skip,
      take: Number(limit),
      include: { employee: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.leaveRequest.count({ where }),
  ]);

  return { leaveRequests, total, page: Number(page), limit: Number(limit) };
}

async function getMyLeaveRequests(userId) {
  const employee = await getEmployeeByUserId(userId);

  return prisma.leaveRequest.findMany({
    where: { employeeId: employee.id },
    orderBy: { createdAt: 'desc' },
  });
}

async function updateLeaveStatus(id, status, performedByUserId) {
  const leaveRequest = await prisma.leaveRequest.findUnique({ where: { id } });

  if (!leaveRequest) {
    const error = new Error('Leave request not found');
    error.statusCode = 404;
    throw error;
  }

  if (leaveRequest.status !== 'PENDING') {
    const error = new Error(`This request has already been ${leaveRequest.status.toLowerCase()} and cannot be changed`);
    error.statusCode = 409;
    throw error;
  }

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: { status },
  });

  await recordAudit(performedByUserId, `LEAVE_REQUEST_${status}`, {
    leaveRequestId: id,
    previousStatus: 'PENDING',
    newStatus: status,
  });

  return updated;
}

module.exports = { createLeaveRequest, getAllLeaveRequests, getMyLeaveRequests, updateLeaveStatus };
