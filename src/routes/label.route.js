const express = require('express');
const router = express.Router();
const labelController = require('../controllers/label.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect); // Tất cả các API Label đều yêu cầu đăng nhập

router.get('/project/:projectId', labelController.getLabelsByProject);
router.post('/', labelController.createLabel);
router.put('/:labelId', labelController.updateLabel);
router.delete('/:labelId', labelController.deleteLabel);

module.exports = router;
