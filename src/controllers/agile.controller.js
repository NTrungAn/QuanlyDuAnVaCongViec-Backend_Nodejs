const agileService = require('../services/agile.service');

const createSprint = async (req, res) => {
  try {
    const sprint = await agileService.createSprint(
      req.params.projectId,
      req.body,
      req.user._id,
    );
    return res.status(201).json(sprint);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getSprintsByProject = async (req, res) => {
  try {
    const sprints = await agileService.getSprintsByProject(
      req.params.projectId,
      req.user._id,
    );
    return res.status(200).json(sprints);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const addTaskToSprint = async (req, res) => {
  try {
    const result = await agileService.addTaskToSprint(
      req.params.projectId,
      req.params.sprintId,
      req.body.taskId,
      req.user._id,
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const createEpic = async (req, res) => {
  try {
    const epic = await agileService.createEpic(
      req.params.projectId,
      req.body,
      req.user._id,
    );
    return res.status(201).json(epic);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const linkTaskToEpic = async (req, res) => {
  try {
    const result = await agileService.linkTaskToEpic(
      req.params.projectId,
      req.params.epicId,
      req.body.taskId,
      req.user._id,
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateEpic = async (req, res) => {
  try {
    const epic = await agileService.updateEpic(
      req.params.projectId,
      req.params.epicId,
      req.body,
      req.user._id,
    );
    return res.status(200).json(epic);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteEpic = async (req, res) => {
  try {
    const result = await agileService.deleteEpic(
      req.params.projectId,
      req.params.epicId,
      req.user._id,
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateSprint = async (req, res) => {
  try {
    const sprint = await agileService.updateSprint(
      req.params.projectId,
      req.params.sprintId,
      req.body,
      req.user._id,
    );
    return res.status(200).json(sprint);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteSprint = async (req, res) => {
  try {
    const result = await agileService.deleteSprint(
      req.params.projectId,
      req.params.sprintId,
      req.user._id,
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getBacklogData = async (req, res) => {
  try {
    const data = await agileService.getBacklogData(
      req.params.projectId,
      req.user._id,
    );
    return res.status(200).json(data);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateTaskOrder = async (req, res) => {
  try {
    const result = await agileService.updateTaskOrder(
      req.params.projectId,
      req.body.updates,
      req.user._id,
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const startSprint = async (req, res) => {
  try {
    const result = await agileService.startSprint(
      req.params.projectId,
      req.params.sprintId,
      req.user._id,
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createSprint,
  getSprintsByProject,
  addTaskToSprint,
  createEpic,
  linkTaskToEpic,
  updateEpic,
  deleteEpic,
  updateSprint,
  deleteSprint,
  getBacklogData,
  updateTaskOrder,
  startSprint,
};
