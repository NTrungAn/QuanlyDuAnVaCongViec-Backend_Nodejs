const express = require("express");
const router = express.Router();
const workflowController = require("../controllers/workflow.controller");
const { protect } = require("../middlewares/auth.middleware");

// Cần đăng nhập để sử dụng các route này
router.use(protect);

// Trạng thái (TaskStatus)
router.get("/projects/:projectId/statuses", workflowController.getStatusesByProject);
router.post("/projects/:projectId/statuses", workflowController.createStatus);
router.put("/statuses/:statusId", workflowController.updateStatus);
router.delete("/statuses/:statusId", workflowController.deleteStatus);

// Workflow & Steps
router.get("/projects/:projectId/workflow", workflowController.getWorkflowByProject);
router.get("/workflows/:workflowId/steps", workflowController.getWorkflowSteps);
router.post("/workflows/steps", workflowController.createStep);
router.delete("/workflows/steps/:stepId", workflowController.deleteStep);
router.post("/projects/:projectId/setup-default", workflowController.setupDefaultWorkflow);

module.exports = router;
