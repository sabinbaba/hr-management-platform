const employeeService = require('../services/employee.service');
const logger = require('../utils/logger');

async function create(req, res, next) {
  try {
    const employee = await employeeService.createEmployee(req.body);
    logger.info(`Employee created: ${employee.fullName}`);
    res.status(201).json({ employee });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const result = await employeeService.getEmployees(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    const isPrivileged = req.user.role === 'ADMIN' || req.user.role === 'HR';
    const isOwner = employee.userId === req.user.userId;
    if (!isPrivileged && !isOwner) {
      return res.status(403).json({ error: 'You do not have permission to view this profile' });
    }
    res.status(200).json({ employee });
  } catch (err) {
    next(err);
  }
}

async function getMyProfile(req, res, next) {
  try {
    const employee = await employeeService.getEmployeeByUserId(req.user.userId);
    res.status(200).json({ employee });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const employee = await employeeService.updateEmployee(req.params.id, req.body);
    logger.info(`Employee updated: ${req.params.id}`);
    res.status(200).json({ employee });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await employeeService.deleteEmployee(req.params.id);
    logger.info(`Employee deleted: ${req.params.id}`);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getOne, getMyProfile, update, remove };
