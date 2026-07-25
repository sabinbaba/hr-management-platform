const departmentService = require('../services/department.service');
const logger = require('../utils/logger');

async function create(req, res, next) {
  try {
    const department = await departmentService.createDepartment(req.body);
    logger.info(`Department created: ${department.name}`);
    res.status(201).json({ department });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const departments = await departmentService.getDepartments();
    res.status(200).json({ departments });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const department = await departmentService.getDepartmentById(req.params.id);
    res.status(200).json({ department });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const department = await departmentService.updateDepartment(req.params.id, req.body);
    logger.info(`Department updated: ${req.params.id}`);
    res.status(200).json({ department });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await departmentService.deleteDepartment(req.params.id);
    logger.info(`Department deleted: ${req.params.id}`);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getOne, update, remove };
