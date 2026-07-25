const { body, param } = require('express-validator');

const createEmployeeValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('jobTitle').notEmpty().withMessage('Job title is required'),
  body('departmentId').isUUID().withMessage('Valid department ID is required'),
  body('hireDate').isISO8601().withMessage('Hire date must be a valid date'),
];

const employeeIdParamValidator = [
  param('id').isUUID().withMessage('Valid employee ID is required'),
];

module.exports = { createEmployeeValidator, employeeIdParamValidator };
