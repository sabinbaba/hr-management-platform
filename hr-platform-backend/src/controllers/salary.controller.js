const salaryService = require('../services/salary.service');
const logger = require('../utils/logger');

async function create(req, res, next) {
  try {
    const salary = await salaryService.addSalaryRecord(req.params.employeeId, req.body);
    logger.info(`Salary record added for employee ${req.params.employeeId}`);
    res.status(201).json({ salary });
  } catch (err) {
    next(err);
  }
}

async function history(req, res, next) {
  try {
    const salaries = await salaryService.getSalaryHistory(req.params.employeeId, req.user);
    res.status(200).json({ salaries });
  } catch (err) {
    next(err);
  }
}

async function current(req, res, next) {
  try {
    const salary = await salaryService.getCurrentSalary(req.params.employeeId, req.user);
    res.status(200).json({ salary });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, history, current };
