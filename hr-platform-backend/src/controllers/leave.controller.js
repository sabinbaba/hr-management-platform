const leaveService = require('../services/leave.service');
const logger = require('../utils/logger');

async function create(req, res, next) {
  try {
    const leaveRequest = await leaveService.createLeaveRequest(req.user.userId, req.body);
    logger.info(`Leave request submitted by user ${req.user.userId}`);
    res.status(201).json({ leaveRequest });
  } catch (err) {
    next(err);
  }
}

async function listAll(req, res, next) {
  try {
    const result = await leaveService.getAllLeaveRequests(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function listMine(req, res, next) {
  try {
    const leaveRequests = await leaveService.getMyLeaveRequests(req.user.userId);
    res.status(200).json({ leaveRequests });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const leaveRequest = await leaveService.updateLeaveStatus(req.params.id, req.body.status, req.user.userId);
    logger.info(`Leave request ${req.params.id} set to ${req.body.status} by ${req.user.userId}`);
    res.status(200).json({ leaveRequest });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, listAll, listMine, updateStatus };
