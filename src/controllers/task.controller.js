const taskService = require("../services/task.service");

const createTask = async (req, res) => {
  try {
    console.log(
      "[task.controller] createTask request user:",
      req.user?._id,
      "body:",
      {
        title: req.body?.title,
        project: req.body?.project,
        status: req.body?.status,
      },
    );
    const task = await taskService.createTask(req.body, req.user._id);
    return res.status(201).json(task);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const tasks = await taskService.getTasksByProject(projectId, req.user._id);
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
    const tasks = await taskService.getBacklogByProject(
      projectId,
      req.user._id,
    );
    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// --- Subtasks ---
const createSubtask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const subtask = await taskService.createSubtask(
      taskId,
      req.body,
      req.user._id,
    );
    return res.status(201).json(subtask);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getSubtasks = async (req, res) => {
  try {
    const { taskId } = req.params;
    const subtasks = await taskService.getSubtasks(taskId, req.user._id);
    return res.status(200).json(subtasks);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// --- Attachments ---
const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn file để upload" });
    }
    const { taskId } = req.params;
    const attachment = await taskService.uploadAttachment(
      taskId,
      req.file,
      req.user._id,
    );
    return res.status(201).json(attachment);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getAttachments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const attachments = await taskService.getAttachments(taskId, req.user._id);
    return res.status(200).json(attachments);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteAttachment = async (req, res) => {
  try {
    const { taskId, attachmentId } = req.params;
    const result = await taskService.deleteAttachment(
      taskId,
      attachmentId,
      req.user._id,
    );
    return res.status(200).json(result);
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
  createSubtask,
  getSubtasks,
  uploadAttachment,
  getAttachments,
  deleteAttachment,
};
