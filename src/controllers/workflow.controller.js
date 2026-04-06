const workflowService = require("../services/workflow.service");

const getStatusesByProject = async (req, res) => {
  try {
    const statuses = await workflowService.getStatusesByProject(req.params.projectId);
    res.json(statuses);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const createStatus = async (req, res) => {
  try {
    const status = await workflowService.createStatus(req.params.projectId, req.body);
    res.status(201).json(status);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const status = await workflowService.updateStatus(req.params.statusId, req.body);
    res.json(status);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteStatus = async (req, res) => {
  try {
    await workflowService.deleteStatus(req.params.statusId);
    res.json({ message: "Xóa trạng thái thành công" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getWorkflowByProject = async (req, res) => {
  try {
    const workflow = await workflowService.getWorkflowByProject(req.params.projectId);
    res.json(workflow);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getWorkflowSteps = async (req, res) => {
  try {
    const steps = await workflowService.getWorkflowSteps(req.params.workflowId);
    res.json(steps);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const createStep = async (req, res) => {
  try {
    const step = await workflowService.createStep(req.body);
    res.status(201).json(step);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteStep = async (req, res) => {
  try {
    await workflowService.deleteStep(req.params.stepId);
    res.json({ message: "Xóa bước chuyển đổi thành công" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
const setupDefaultWorkflow = async (req, res) => {
  try {
    const result = await workflowService.setupDefaultWorkflow(req.params.projectId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  getStatusesByProject,
  createStatus,
  updateStatus,
  deleteStatus,
  getWorkflowByProject,
  getWorkflowSteps,
  createStep,
  deleteStep,
  setupDefaultWorkflow,
};
