const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const agileController = require('../controllers/agile.controller');
const { protect, validate } = require('../middlewares/auth.middleware');
const { createProjectSchema, updateProjectSchema } = require('../validators/project.validator');
const { createSprintSchema, createEpicSchema, linkTaskSchema } = require('../validators/agile.validator');

router.use(protect); // Tất cả các API Project đều yêu cầu đăng nhập

router.post('/', validate(createProjectSchema), projectController.createProject);
router.get('/', projectController.getAllProjects);
router.get('/:projectId', projectController.getProjectById);
router.put('/:projectId', validate(updateProjectSchema), projectController.updateProject);
router.delete('/:projectId', projectController.deleteProject);

router.post('/:projectId/members', projectController.addMember);
router.delete('/:projectId/members', projectController.removeMember);

router.post('/:projectId/sprints', validate(createSprintSchema), agileController.createSprint);
router.get('/:projectId/sprints', agileController.getSprintsByProject);
router.post('/:projectId/sprints/:sprintId/tasks', validate(linkTaskSchema), agileController.addTaskToSprint);

router.post('/:projectId/epics', validate(createEpicSchema), agileController.createEpic);
router.post('/:projectId/epics/:epicId/tasks', validate(linkTaskSchema), agileController.linkTaskToEpic);

module.exports = router;
