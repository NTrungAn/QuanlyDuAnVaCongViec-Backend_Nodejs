const mongoose = require("mongoose");
const Label = require("../models/Label.model");
const Project = require("../models/Project.model");
const Task = require("../models/Task.model");

// GET /api/labels/project/:projectId
exports.getLabelsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Dự án không tồn tại" });
    }

    const labels = await Label.find({ project: projectId }).sort({ createdAt: -1 });
    res.json(labels);
  } catch (error) {
    console.error("Lỗi lấy danh sách Label:", error);
    res.status(500).json({ message: "Lỗi Server" });
  }
};

// POST /api/labels
exports.createLabel = async (req, res) => {
  try {
    const { name, color, project } = req.body;
    
    if (!name || !project) {
      return res.status(400).json({ message: "Vui lòng cung cấp tên và dự án cho nhãn" });
    }

    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return res.status(404).json({ message: "Dự án không tồn tại" });
    }

    // Kiểm tra tên nhãn trùng trong cùng dự án
    const existingLabel = await Label.findOne({ name: name.trim(), project });
    if (existingLabel) {
      return res.status(400).json({ message: "Tên nhãn này đã tồn tại trong dự án" });
    }

    const newLabel = new Label({
      name: name.trim(),
      color: color || "#e2e8f0",
      project,
      creator: req.user._id,
    });

    await newLabel.save();
    res.status(201).json(newLabel);
  } catch (error) {
    console.error("Lỗi tạo Label:", error);
    res.status(500).json({ message: "Lỗi Server" });
  }
};

// PUT /api/labels/:id
exports.updateLabel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    const label = await Label.findById(id);
    if (!label) {
      return res.status(404).json({ message: "Nhãn không tồn tại" });
    }

    if (name) {
      // KIểm tra trùng tên
      const existingLabel = await Label.findOne({ 
        name: name.trim(), 
        project: label.project, 
        _id: { $ne: id } 
      });
      if (existingLabel) {
        return res.status(400).json({ message: "Tên nhãn này đã tồn tại trong dự án" });
      }
      label.name = name.trim();
    }
    
    if (color) {
      label.color = color;
    }

    await label.save();
    res.json(label);
  } catch (error) {
    console.error("Lỗi cập nhật Label:", error);
    res.status(500).json({ message: "Lỗi Server" });
  }
};

// DELETE /api/labels/:id
exports.deleteLabel = async (req, res) => {
  try {
    const { id } = req.params;
    
    const label = await Label.findById(id);
    if (!label) {
      return res.status(404).json({ message: "Nhãn không tồn tại" });
    }

    // Cập nhật các Task đang sử dụng nhãn này: Xóa nhãn khỏi mảng labels của Task
    await Task.updateMany(
      { labels: id },
      { $pull: { labels: id } }
    );

    await Label.findByIdAndDelete(id);
    res.json({ message: "Xóa nhãn thành công" });
  } catch (error) {
    console.error("Lỗi xóa Label:", error);
    res.status(500).json({ message: "Lỗi Server" });
  }
};
