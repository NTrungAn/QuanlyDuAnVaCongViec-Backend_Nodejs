const Label = require('../models/Label.model');
const Project = require('../models/Project.model');
const { includesId, isSameId } = require('../utils/id.util');

const ensureProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error('Dự án không tồn tại');
  }

  if (!includesId(project.members, userId)) {
    throw new Error('Bạn không có quyền thao tác trong dự án này');
  }

  return project;
};

const getLabelsByProject = async (projectId, userId) => {
  await ensureProjectAccess(projectId, userId);
  return Label.find({ project: projectId }).sort({ createdAt: 1 });
};

const createLabel = async (labelData, userId) => {
  const { project: projectId } = labelData;
  const project = await ensureProjectAccess(projectId, userId);

  // Chỉ cho phép owner tạo label (hoặc cho cả member? Tùy yêu cầu)
  // Trong Jira/Trello thường member cũng được tạo label.
  // Ở đây chúng ta cho phép các MEMBER của dự án tạo label.

  const label = await Label.create({
    ...labelData,
    creator: userId,
  });

  return label;
};

const updateLabel = async (labelId, updateData, userId) => {
  const label = await Label.findById(labelId);
  if (!label) {
    throw new Error('Nhãn không tồn tại');
  }

  await ensureProjectAccess(label.project, userId);

  Object.assign(label, updateData);
  await label.save();
  return label;
};

const deleteLabel = async (labelId, userId) => {
  const label = await Label.findById(labelId);
  if (!label) {
    throw new Error('Nhãn không tồn tại');
  }

  await ensureProjectAccess(label.project, userId);

  await Label.findByIdAndDelete(labelId);
  return { message: 'Xóa nhãn thành công' };
};

module.exports = {
  getLabelsByProject,
  createLabel,
  updateLabel,
  deleteLabel,
};
