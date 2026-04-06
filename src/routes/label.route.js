const express = require('express');
const router = express.Router();
const labelController = require('../controllers/label.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.get('/project/:projectId', labelController.getLabelsByProject);
router.post('/', labelController.createLabel);
router.put('/:id', labelController.updateLabel);
router.delete('/:id', labelController.deleteLabel);

module.exports = router;
