const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { protect, validate } = require('../middlewares/auth.middleware');
const { createTaskSchema, updateTaskSchema } = require('../validators/task.validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const evidenceDir = path.resolve(__dirname, '..', 'images', 'evidence');
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, evidenceDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `evidence-${uniqueSuffix}-${file.originalname.replace(/\s+/g, '_')}`);
  }
});
const upload = multer({ storage });

router.use(protect); // Tất cả các API Task đều yêu cầu đăng nhập

router.post('/', validate(createTaskSchema), taskController.createTask);
router.get('/project/:projectId', taskController.getTasksByProject);
router.get('/project/:projectId/backlog', taskController.getBacklogTasks);
router.get('/:taskId', taskController.getTaskById);
router.put('/:taskId', validate(updateTaskSchema), taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);

router.post('/:taskId/subtasks', validate(createTaskSchema), taskController.createSubtask);
router.get('/:taskId/subtasks', taskController.getSubtasks);

router.post('/:taskId/attachments', upload.single('file'), taskController.uploadAttachment);
router.get('/:taskId/attachments', taskController.getAttachments);
router.delete('/:taskId/attachments/:attachmentId', taskController.deleteAttachment);

module.exports = router;
