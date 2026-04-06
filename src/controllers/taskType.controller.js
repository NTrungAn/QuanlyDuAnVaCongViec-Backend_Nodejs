const taskTypeService = require('../services/taskType.service');

const getTaskTypesByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const taskTypes = await taskTypeService.getTaskTypesByProject(projectId, req.user._id);
    return res.status(200).json(taskTypes);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const createTaskType = async (req, res) => {
  try {
    const { projectId } = req.params;
    const taskType = await taskTypeService.createTaskType(projectId, req.body, req.user._id);
    return res.status(201).json(taskType);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateTaskType = async (req, res) => {
  try {
    const { projectId, typeId } = req.params;
    const taskType = await taskTypeService.updateTaskType(projectId, typeId, req.body, req.user._id);
    return res.status(200).json(taskType);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteTaskType = async (req, res) => {
  try {
    const { projectId, typeId } = req.params;
    const result = await taskTypeService.deleteTaskType(projectId, typeId, req.user._id);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getTaskTypesByProject,
  createTaskType,
  updateTaskType,
  deleteTaskType
};
