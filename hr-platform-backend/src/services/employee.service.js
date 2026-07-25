const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const SALT_ROUNDS = 10;

async function createEmployee(data) {
  const { email, password, fullName, jobTitle, departmentId, hireDate } = data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const error = new Error('A user with this email already exists');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const employee = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, passwordHash, role: 'EMPLOYEE' },
    });
    return tx.employee.create({
      data: {
        userId: user.id,
        fullName,
        jobTitle,
        departmentId,
        hireDate: new Date(hireDate),
      },
      include: { department: true },
    });
  });
  return employee;
}

async function getEmployees({ search, departmentId, page = 1, limit = 10 }) {
  const skip = (page - 1) * limit;
  const where = {
    ...(search && {
      fullName: { contains: search, mode: 'insensitive' },
    }),
    ...(departmentId && { departmentId }),
  };
  const [employees, total] = await prisma.$transaction([
    prisma.employee.findMany({
      where,
      skip,
      take: Number(limit),
      include: { department: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.employee.count({ where }),
  ]);
  return { employees, total, page: Number(page), limit: Number(limit) };
}

async function getEmployeeById(id) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { department: true, salaries: true },
  });
  if (!employee) {
    const error = new Error('Employee not found');
    error.statusCode = 404;
    throw error;
  }
  return employee;
}

async function getEmployeeByUserId(userId) {
  const employee = await prisma.employee.findUnique({
    where: { userId },
    include: { department: true },
  });
  if (!employee) {
    const error = new Error('No employee profile linked to this account');
    error.statusCode = 404;
    throw error;
  }
  return employee;
}

async function updateEmployee(id, data) {
  const { fullName, jobTitle, departmentId } = data;
  await getEmployeeById(id);
  return prisma.employee.update({
    where: { id },
    data: { fullName, jobTitle, departmentId },
    include: { department: true },
  });
}

async function deleteEmployee(id) {
  await getEmployeeById(id);
  return prisma.employee.delete({ where: { id } });
}

module.exports = { createEmployee, getEmployees, getEmployeeById, getEmployeeByUserId, updateEmployee, deleteEmployee };
