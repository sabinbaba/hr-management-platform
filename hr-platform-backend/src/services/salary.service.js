const prisma = require('../config/database');

async function getEmployeeByUserId(userId) {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) {
    const error = new Error('No employee profile linked to this account');
    error.statusCode = 404;
    throw error;
  }
  return employee;
}

async function addSalaryRecord(employeeId, { amount, effectiveDate }) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    const error = new Error('Employee not found');
    error.statusCode = 404;
    throw error;
  }

  return prisma.salary.create({
    data: {
      employeeId,
      amount,
      effectiveDate: new Date(effectiveDate),
    },
  });
}

async function getSalaryHistory(employeeId, requestingUser) {
  await checkAccess(employeeId, requestingUser);

  return prisma.salary.findMany({
    where: { employeeId },
    orderBy: { effectiveDate: 'desc' },
  });
}

async function getCurrentSalary(employeeId, requestingUser) {
  await checkAccess(employeeId, requestingUser);

  const current = await prisma.salary.findFirst({
    where: { employeeId },
    orderBy: { effectiveDate: 'desc' },
  });

  if (!current) {
    const error = new Error('No salary record exists for this employee yet');
    error.statusCode = 404;
    throw error;
  }

  return current;
}

async function checkAccess(employeeId, requestingUser) {
  const isPrivileged = requestingUser.role === 'ADMIN' || requestingUser.role === 'HR';
  if (isPrivileged) return;

  const ownEmployee = await getEmployeeByUserId(requestingUser.userId);
  if (ownEmployee.id !== employeeId) {
    const error = new Error('You do not have permission to view this salary information');
    error.statusCode = 403;
    throw error;
  }
}

module.exports = { addSalaryRecord, getSalaryHistory, getCurrentSalary };
