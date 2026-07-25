const { body, param } = require('express-validator');

const createSalaryValidator = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('effectiveDate').isISO8601().withMessage('Effective date must be a valid date'),
];

const employeeIdParamValidator = [
  param('employeeId').isUUID().withMessage('Valid employee ID is required'),
];

module.exports = { createSalaryValidator, employeeIdParamValidator };
