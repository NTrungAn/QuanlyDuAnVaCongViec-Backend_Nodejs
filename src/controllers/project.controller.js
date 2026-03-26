const projectService = require('../services/project.service');

const createProject = async (req, res) => {
  try {
    const project = await projectService.createProject(req.body, req.user._id);
    return res.status(201).json(project);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getAllProjects = async (req, res) => {
  try {
    const projects = await projectService.getAllProjects();
    return res.status(200).json(projects);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await projectService.getProjectById(req.params.projectId);
    return res.status(200).json(project);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await projectService.updateProject(req.params.projectId, req.body, req.user._id);
    return res.status(200).json(project);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const result = await projectService.deleteProject(req.params.projectId, req.user._id);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const addMember = async (req, res) => {
  try {
    const { memberId } = req.body;
    const project = await projectService.addMember(req.params.projectId, memberId, req.user._id);
    return res.status(200).json(project);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const removeMember = async (req, res) => {
  try {
    const { memberId } = req.body;
    const project = await projectService.removeMember(req.params.projectId, memberId, req.user._id);
    return res.status(200).json(project);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
