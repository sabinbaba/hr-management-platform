const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const upload = require('../config/multer');
const { employeeIdParamValidator, documentIdParamValidator } = require('../validators/document.validator');

router.use(authenticate);

router.post('/:employeeId', employeeIdParamValidator, validate, upload.single('file'), documentController.upload);
router.get('/:employeeId', employeeIdParamValidator, validate, documentController.list);
router.get('/download/:id', documentIdParamValidator, validate, documentController.download);

module.exports = router;
