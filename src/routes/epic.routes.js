const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');
const { getEpicsByProject } = require('../controllers/epic.controller');

router.get('/project/:projectId', protect, getEpicsByProject);

module.exports = router;