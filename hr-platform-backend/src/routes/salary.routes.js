const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salary.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { createSalaryValidator, employeeIdParamValidator } = require('../validators/salary.validator');

router.use(authenticate);

router.post('/:employeeId', authorize('ADMIN', 'HR'), employeeIdParamValidator, createSalaryValidator, validate, salaryController.create);
router.get('/:employeeId/history', employeeIdParamValidator, validate, salaryController.history);
router.get('/:employeeId/current', employeeIdParamValidator, validate, salaryController.current);

module.exports = router;
