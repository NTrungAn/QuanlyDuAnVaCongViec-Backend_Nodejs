const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { protect, validate } = require('../middlewares/auth.middleware');
const { createTaskSchema, updateTaskSchema } = require('../validators/task.validator');

router.use(protect); // Tất cả các API Task đều yêu cầu đăng nhập

router.post('/', validate(createTaskSchema), taskController.createTask);
router.get('/project/:projectId', taskController.getTasksByProject);
router.get('/project/:projectId/backlog', taskController.getBacklogTasks);
router.get('/:taskId', taskController.getTaskById);
router.get('/:taskId/activities', taskController.getTaskActivities);
router.put('/:taskId/restore', taskController.restoreTask);
router.put('/:taskId/archive', taskController.archiveTask);
router.put('/:taskId', validate(updateTaskSchema), taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);

module.exports = router;
