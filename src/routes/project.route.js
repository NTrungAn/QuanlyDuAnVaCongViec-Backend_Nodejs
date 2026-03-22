const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const agileController = require('../controllers/agile.controller');
const { protect, validate } = require('../middlewares/auth.middleware');
const { createProjectSchema, updateProjectSchema } = require('../validators/project.validator');
const { createSprintSchema, createEpicSchema, linkTaskSchema, updateEpicSchema, updateSprintSchema } = require('../validators/agile.validator');

router.use(protect); // Tất cả các API Project đều yêu cầu đăng nhập

router.post('/', validate(createProjectSchema), projectController.createProject);
router.get('/', projectController.getAllProjects);
router.get('/:projectId', projectController.getProjectById);
router.put('/:projectId', validate(updateProjectSchema), projectController.updateProject);
router.delete('/:projectId', projectController.deleteProject);

router.post('/:projectId/members', projectController.addMember);
router.delete('/:projectId/members', projectController.removeMember);

router.get('/:projectId/backlog', agileController.getBacklogData);
router.patch('/:projectId/tasks/order', agileController.updateTaskOrder);

router.post('/:projectId/sprints', validate(createSprintSchema), agileController.createSprint);
router.get('/:projectId/sprints', agileController.getSprintsByProject);
router.post('/:projectId/sprints/:sprintId/tasks', validate(linkTaskSchema), agileController.addTaskToSprint);
router.put('/:projectId/sprints/:sprintId', validate(updateSprintSchema), agileController.updateSprint);
router.patch('/:projectId/sprints/:sprintId/start', agileController.startSprint);
router.delete('/:projectId/sprints/:sprintId', agileController.deleteSprint);


router.post('/:projectId/epics', validate(createEpicSchema), agileController.createEpic);
router.post('/:projectId/epics/:epicId/tasks', validate(linkTaskSchema), agileController.linkTaskToEpic);
router.put('/:projectId/epics/:epicId', validate(updateEpicSchema), agileController.updateEpic);
router.delete('/:projectId/epics/:epicId', agileController.deleteEpic);

module.exports = router;
