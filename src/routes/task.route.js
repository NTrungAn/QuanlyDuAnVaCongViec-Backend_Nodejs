const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const taskController = require("../controllers/task.controller");
const { protect, validate } = require("../middlewares/auth.middleware");
const {
  createTaskSchema,
  updateTaskSchema,
} = require("../validators/task.validator");

// Cấu hình Multer cho upload tài liệu
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/attachments");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
});

router.use(protect); // Tất cả các API Task đều yêu cầu đăng nhập

router.post("/", validate(createTaskSchema), taskController.createTask);
router.get("/project/:projectId", taskController.getTasksByProject);
router.get("/project/:projectId/backlog", taskController.getBacklogTasks);
router.get("/:taskId", taskController.getTaskById);
router.put("/:taskId", validate(updateTaskSchema), taskController.updateTask);
router.delete("/:taskId", taskController.deleteTask);

// Subtasks
router.post("/:taskId/subtasks", validate(createTaskSchema), taskController.createSubtask);
router.get("/:taskId/subtasks", taskController.getSubtasks);

// Attachments
router.post("/:taskId/attachments", upload.single("file"), taskController.uploadAttachment);
router.get("/:taskId/attachments", taskController.getAttachments);
router.delete("/:taskId/attachments/:attachmentId", taskController.deleteAttachment);

module.exports = router;
