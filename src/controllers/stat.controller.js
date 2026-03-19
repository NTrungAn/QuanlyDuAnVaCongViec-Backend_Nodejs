const statService = require('../services/stat.service');

const getProjectStats = async (req, res) => {
  try {
    const { projectId } = req.params;
    const stats = await statService.getProjectStats(projectId, req.user._id);
    return res.status(200).json(stats);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getUserDashboardStats = async (req, res) => {
  try {
    const stats = await statService.getUserDashboardStats(req.user._id);
    return res.status(200).json(stats);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProjectStats,
  getUserDashboardStats,
};
