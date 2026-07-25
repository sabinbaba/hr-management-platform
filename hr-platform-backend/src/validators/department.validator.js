const { body, param } = require('express-validator');

const departmentValidator = [
  body('name').notEmpty().withMessage('Department name is required'),
];

const departmentIdParamValidator = [
  param('id').isUUID().withMessage('Valid department ID is required'),
];

module.exports = { departmentValidator, departmentIdParamValidator };
