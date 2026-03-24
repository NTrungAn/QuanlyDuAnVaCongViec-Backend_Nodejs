const express = require('express');
const router = express.Router();
const taskTypeController = require('../controllers/taskType.controller');
const { protect, validate } = require('../middlewares/auth.middleware');
const { createTaskTypeSchema, updateTaskTypeSchema } = require('../validators/taskType.validator');

router.use(protect);

router.get('/project/:projectId', taskTypeController.getTaskTypesByProject);
router.post('/project/:projectId', validate(createTaskTypeSchema), taskTypeController.createTaskType);
router.put('/project/:projectId/:typeId', validate(updateTaskTypeSchema), taskTypeController.updateTaskType);
router.delete('/project/:projectId/:typeId', taskTypeController.deleteTaskType);

module.exports = router;