const taskService = require('../services/task.service');

const createTask = async (req, res) => {
  try {
    const task = await taskService.createTask(req.body, req.user._id);
    return res.status(201).json(task);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const tasks = await taskService.getTasksByProject(projectId, req.user._id, req.query);
    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await taskService.getTaskById(taskId, req.user._id);
    return res.status(200).json(task);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await taskService.updateTask(taskId, req.body, req.user._id);
    return res.status(200).json(task);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await taskService.deleteTask(taskId, req.user._id);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getBacklogTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const tasks = await taskService.getBacklogByProject(projectId, req.user._id, req.query);
    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const restoreTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await taskService.restoreTask(taskId, req.user._id);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const archiveTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await taskService.archiveTask(taskId, req.user._id);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getTaskActivities = async (req, res) => {
  try {
    const { taskId } = req.params;
    const activities = await taskService.getTaskActivities(taskId, req.user._id);
    return res.status(200).json(activities);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  deleteTask,
  getBacklogTasks,
  restoreTask,
  archiveTask,
  getTaskActivities,
};
