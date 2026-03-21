const Epic = require('../models/epic.model');

exports.getEpicsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const epics = await Epic.find({ project: projectId });

    res.status(200).json({
      success: true,
      data: epics,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};