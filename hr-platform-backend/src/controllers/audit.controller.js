const auditService = require('../services/audit.service');

async function list(req, res, next) {
  try {
    const result = await auditService.getAuditLogs(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { list };
