const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { createEmployeeValidator, employeeIdParamValidator } = require('../validators/employee.validator');

router.use(authenticate);

router.post('/', authorize('ADMIN', 'HR'), createEmployeeValidator, validate, employeeController.create);
router.get('/', authorize('ADMIN', 'HR'), employeeController.list);
router.get('/my', employeeController.getMyProfile);
router.get('/:id', employeeIdParamValidator, validate, employeeController.getOne);
router.put('/:id', authorize('ADMIN', 'HR'), employeeIdParamValidator, validate, employeeController.update);
router.delete('/:id', authorize('ADMIN'), employeeIdParamValidator, validate, employeeController.remove);

module.exports = router;
