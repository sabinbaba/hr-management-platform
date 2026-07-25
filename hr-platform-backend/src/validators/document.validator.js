const { param } = require('express-validator');

const employeeIdParamValidator = [
  param('employeeId').isUUID().withMessage('Valid employee ID is required'),
];

const documentIdParamValidator = [
  param('id').isUUID().withMessage('Valid document ID is required'),
];

module.exports = { employeeIdParamValidator, documentIdParamValidator };
