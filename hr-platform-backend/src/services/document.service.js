const prisma = require('../config/database');
const fs = require('fs');

async function getEmployeeByUserId(userId) {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) {
    const error = new Error('No employee profile linked to this account');
    error.statusCode = 404;
    throw error;
  }
  return employee;
}

async function checkAccess(employeeId, requestingUser) {
  const isPrivileged = requestingUser.role === 'ADMIN' || requestingUser.role === 'HR';
  if (isPrivileged) return;

  const ownEmployee = await getEmployeeByUserId(requestingUser.userId);
  if (ownEmployee.id !== employeeId) {
    const error = new Error('You do not have permission to access this document');
    error.statusCode = 403;
    throw error;
  }
}

async function uploadDocument(employeeId, file, requestingUser) {
  await checkAccess(employeeId, requestingUser);

  return prisma.document.create({
    data: {
      employeeId,
      filePath: file.path,
      fileName: file.originalname,
    },
  });
}

async function listDocuments(employeeId, requestingUser) {
  await checkAccess(employeeId, requestingUser);

  return prisma.document.findMany({
    where: { employeeId },
    orderBy: { uploadedAt: 'desc' },
  });
}

async function getDocumentForDownload(documentId, requestingUser) {
  const document = await prisma.document.findUnique({ where: { id: documentId } });

  if (!document) {
    const error = new Error('Document not found');
    error.statusCode = 404;
    throw error;
  }

  await checkAccess(document.employeeId, requestingUser);

  if (!fs.existsSync(document.filePath)) {
    const error = new Error('File is missing from storage');
    error.statusCode = 404;
    throw error;
  }

  return document;
}

module.exports = { uploadDocument, listDocuments, getDocumentForDownload };
