const labelService = require('../services/label.service');

const getLabelsByProject = async (req, res) => {
  try {
    const labels = await labelService.getLabelsByProject(
      req.params.projectId,
      req.user._id
    );
    return res.status(200).json(labels);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const createLabel = async (req, res) => {
  try {
    const label = await labelService.createLabel(req.body, req.user._id);
    return res.status(201).json(label);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateLabel = async (req, res) => {
  try {
    const label = await labelService.updateLabel(
      req.params.labelId,
      req.body,
      req.user._id
    );
    return res.status(200).json(label);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteLabel = async (req, res) => {
  try {
    const result = await labelService.deleteLabel(
      req.params.labelId,
      req.user._id
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getLabelsByProject,
  createLabel,
  updateLabel,
  deleteLabel,
};