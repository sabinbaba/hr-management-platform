const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { createLeaveValidator, updateLeaveStatusValidator } = require('../validators/leave.validator');

router.use(authenticate);

router.post('/', authorize('EMPLOYEE'), createLeaveValidator, validate, leaveController.create);
router.get('/', authorize('ADMIN', 'HR'), leaveController.listAll);
router.get('/my', leaveController.listMine);
router.patch('/:id', authorize('ADMIN', 'HR'), updateLeaveStatusValidator, validate, leaveController.updateStatus);

module.exports = router;
