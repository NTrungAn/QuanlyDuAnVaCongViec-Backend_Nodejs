const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { protect, validate } = require('../middlewares/auth.middleware');
const { createProjectSchema, updateProjectSchema } = require('../validators/project.validator');

router.use(protect); // Tất cả các API Project đều yêu cầu đăng nhập

router.post('/', validate(createProjectSchema), projectController.createProject);
router.get('/', projectController.getAllProjects);
router.get('/:projectId', projectController.getProjectById);
router.put('/:projectId', validate(updateProjectSchema), projectController.updateProject);
router.delete('/:projectId', projectController.deleteProject);

router.post('/:projectId/members', projectController.addMember);
router.delete('/:projectId/members', projectController.removeMember);

module.exports = router;
