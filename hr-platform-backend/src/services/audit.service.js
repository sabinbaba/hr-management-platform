const prisma = require('../config/database');
const logger = require('../utils/logger');

async function recordAudit(userId, action, metadata = {}) {
  try {
    await prisma.auditLog.create({
      data: { userId, action, metadata },
    });
  } catch (err) {
    logger.error(`Failed to write audit log: ${err.message}`);
  }
}

async function getAuditLogs({ page = 1, limit = 20, action, userEmail }) {
  const skip = (page - 1) * limit;

  const where = {
    ...(action && { action }),
    ...(userEmail && {
      user: { email: { contains: userEmail, mode: 'insensitive' } },
    }),
  };

  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      skip,
      take: Number(limit),
      include: { user: { select: { email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page: Number(page), limit: Number(limit) };
}

module.exports = { recordAudit, getAuditLogs };
