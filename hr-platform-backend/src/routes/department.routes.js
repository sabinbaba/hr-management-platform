const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { departmentValidator, departmentIdParamValidator } = require('../validators/department.validator');

router.use(authenticate);

router.post('/', authorize('ADMIN'), departmentValidator, validate, departmentController.create);
router.get('/', departmentController.list);
router.get('/:id', departmentIdParamValidator, validate, departmentController.getOne);
router.put('/:id', authorize('ADMIN'), departmentIdParamValidator, validate, departmentController.update);
router.delete('/:id', authorize('ADMIN'), departmentIdParamValidator, validate, departmentController.remove);

module.exports = router;
