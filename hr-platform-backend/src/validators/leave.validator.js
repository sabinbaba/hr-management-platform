const { body, param } = require('express-validator');

const createLeaveValidator = [
  body('startDate').isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').isISO8601().withMessage('End date must be a valid date'),
  body('reason').optional().isString(),
];

const updateLeaveStatusValidator = [
  param('id').isUUID().withMessage('Valid leave request ID is required'),
  body('status').isIn(['APPROVED', 'REJECTED']).withMessage('Status must be APPROVED or REJECTED'),
];

module.exports = { createLeaveValidator, updateLeaveStatusValidator };
