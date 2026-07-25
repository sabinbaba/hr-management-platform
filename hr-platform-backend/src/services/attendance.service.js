const prisma = require('../config/database');
const { getTodayDateOnly } = require('../utils/date');

async function getEmployeeByUserId(userId) {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) {
    const error = new Error('No employee profile linked to this account');
    error.statusCode = 404;
    throw error;
  }
  return employee;
}

async function checkIn(userId) {
  const employee = await getEmployeeByUserId(userId);
  const today = getTodayDateOnly();

  const existing = await prisma.attendance.findUnique({
    where: { employeeId_workDate: { employeeId: employee.id, workDate: today } },
  });

  if (existing) {
    const error = new Error('You have already checked in today');
    error.statusCode = 409;
    throw error;
  }

  return prisma.attendance.create({
    data: { employeeId: employee.id, workDate: today, checkIn: new Date() },
  });
}

async function checkOut(userId) {
  const employee = await getEmployeeByUserId(userId);
  const today = getTodayDateOnly();

  const existing = await prisma.attendance.findUnique({
    where: { employeeId_workDate: { employeeId: employee.id, workDate: today } },
  });

  if (!existing) {
    const error = new Error('You have not checked in today');
    error.statusCode = 409;
    throw error;
  }

  if (existing.checkOut) {
    const error = new Error('You have already checked out today');
    error.statusCode = 409;
    throw error;
  }

  return prisma.attendance.update({
    where: { id: existing.id },
    data: { checkOut: new Date() },
  });
}

async function getMyAttendance(userId) {
  const employee = await getEmployeeByUserId(userId);
  return prisma.attendance.findMany({
    where: { employeeId: employee.id },
    orderBy: { workDate: 'desc' },
  });
}

async function getAttendanceForEmployee(employeeId, requestingUser) {
  const isPrivileged = requestingUser.role === 'ADMIN' || requestingUser.role === 'HR';

  if (!isPrivileged) {
    const ownEmployee = await getEmployeeByUserId(requestingUser.userId);
    if (ownEmployee.id !== employeeId) {
      const error = new Error('You do not have permission to view this attendance record');
      error.statusCode = 403;
      throw error;
    }
  }

  return prisma.attendance.findMany({
    where: { employeeId },
    orderBy: { workDate: 'desc' },
  });
}

module.exports = { checkIn, checkOut, getMyAttendance, getAttendanceForEmployee };
