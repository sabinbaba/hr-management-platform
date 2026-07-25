const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { employeeIdParamValidator } = require('../validators/attendance.validator');

router.use(authenticate);

router.post('/check-in', authorize('EMPLOYEE'), attendanceController.checkIn);
router.post('/check-out', authorize('EMPLOYEE'), attendanceController.checkOut);
router.get('/my', attendanceController.listMine);
router.get('/:employeeId', employeeIdParamValidator, validate, attendanceController.listForEmployee);

module.exports = router;
