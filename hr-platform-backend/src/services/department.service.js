const prisma = require('../config/database');

async function createDepartment({ name }) {
  const existing = await prisma.department.findUnique({ where: { name } });
  if (existing) {
    const error = new Error('A department with this name already exists');
    error.statusCode = 409;
    throw error;
  }

  return prisma.department.create({ data: { name } });
}

async function getDepartments() {
  return prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { employees: true } } },
  });
}

async function getDepartmentById(id) {
  const department = await prisma.department.findUnique({
    where: { id },
    include: { employees: true },
  });

  if (!department) {
    const error = new Error('Department not found');
    error.statusCode = 404;
    throw error;
  }

  return department;
}

async function updateDepartment(id, { name }) {
  await getDepartmentById(id);
  return prisma.department.update({ where: { id }, data: { name } });
}

async function deleteDepartment(id) {
  const department = await getDepartmentById(id);

  if (department.employees.length > 0) {
    const error = new Error('Cannot delete a department that still has employees assigned');
    error.statusCode = 409;
    throw error;
  }

  return prisma.department.delete({ where: { id } });
}

module.exports = { createDepartment, getDepartments, getDepartmentById, updateDepartment, deleteDepartment };
