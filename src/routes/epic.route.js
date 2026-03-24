const express = require('express');
const router = express.Router();
const agileController = require('../controllers/agile.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);
router.get('/project/:projectId', agileController.getEpicsByProject);

module.exports = router;
