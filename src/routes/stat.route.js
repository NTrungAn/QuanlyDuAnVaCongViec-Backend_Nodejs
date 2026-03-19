const express = require('express');
const router = express.Router();
const statController = require('../controllers/stat.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.get('/project/:projectId', statController.getProjectStats);
router.get('/dashboard', statController.getUserDashboardStats);

module.exports = router;
