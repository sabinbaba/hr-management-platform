const prisma = require('../src/config/database');

async function clearDatabase() {
  await prisma.auditLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.salary.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();
}

module.exports = { clearDatabase };
