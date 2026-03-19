const express = require("express");
const router = express.Router();
const statController = require("../controllers/stat.controller");
const { protect } = require("../middlewares/auth.middleware");

router.use(protect);

router.get("/project/:projectId", statController.getProjectStats);
router.get(
  "/project/:projectId/performance",
  statController.getMemberPerformanceReport,
);
router.get(
  "/project/:projectId/timeline",
  statController.getProjectTimelineReport,
);
router.get("/dashboard", statController.getUserDashboardStats);

module.exports = router;
