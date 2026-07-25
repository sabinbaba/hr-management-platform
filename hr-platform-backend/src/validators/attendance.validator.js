const { param } = require('express-validator');

const employeeIdParamValidator = [
  param('employeeId').isUUID().withMessage('Valid employee ID is required'),
];

module.exports = { employeeIdParamValidator };
