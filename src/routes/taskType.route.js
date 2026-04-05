const express = require('express');
const router = express.Router();
const taskTypeController = require('../controllers/taskType.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect); // Tất cả các API TaskType đều yêu cầu đăng nhập

router.get('/project/:projectId', taskTypeController.getTaskTypesByProject);
router.post('/project/:projectId', taskTypeController.createTaskType);
router.put('/project/:projectId/:typeId', taskTypeController.updateTaskType);
router.delete('/project/:projectId/:typeId', taskTypeController.deleteTaskType);

module.exports = router;
