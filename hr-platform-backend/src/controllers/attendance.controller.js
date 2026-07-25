const attendanceService = require('../services/attendance.service');
const logger = require('../utils/logger');

async function checkIn(req, res, next) {
  try {
    const attendance = await attendanceService.checkIn(req.user.userId);
    logger.info(`Check-in recorded for user ${req.user.userId}`);
    res.status(201).json({ attendance });
  } catch (err) {
    next(err);
  }
}

async function checkOut(req, res, next) {
  try {
    const attendance = await attendanceService.checkOut(req.user.userId);
    logger.info(`Check-out recorded for user ${req.user.userId}`);
    res.status(200).json({ attendance });
  } catch (err) {
    next(err);
  }
}

async function listMine(req, res, next) {
  try {
    const attendance = await attendanceService.getMyAttendance(req.user.userId);
    res.status(200).json({ attendance });
  } catch (err) {
    next(err);
  }
}

async function listForEmployee(req, res, next) {
  try {
    const attendance = await attendanceService.getAttendanceForEmployee(req.params.employeeId, req.user);
    res.status(200).json({ attendance });
  } catch (err) {
    next(err);
  }
}

module.exports = { checkIn, checkOut, listMine, listForEmployee };
