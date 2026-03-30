const TaskType = require('../models/TaskType.model');
const Project = require('../models/Project.model');
const { includesId, isSameId } = require('../utils/id.util');

const ensureProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error('Dự án không tồn tại');
  if (!includesId(project.members, userId) && !isSameId(project.owner, userId)) {
    throw new Error('Bạn không có quyền thao tác với dữ liệu trong dự án này');
  }
  return project;
};

const getTaskTypesByProject = async (projectId, userId) => {
  await ensureProjectAccess(projectId, userId);
  return await TaskType.find({ project: projectId }).sort({ createdAt: 1 });
};

const createTaskType = async (projectId, data, userId) => {
  const project = await ensureProjectAccess(projectId, userId);
  if (!isSameId(project.owner, userId)) {
    throw new Error('Chỉ chủ dự án mới được tạo loại công việc mới');
  }
  return await TaskType.create({ ...data, project: projectId });
};

const updateTaskType = async (projectId, typeId, data, userId) => {
  const project = await ensureProjectAccess(projectId, userId);
  if (!isSameId(project.owner, userId)) {
    throw new Error('Chỉ chủ dự án mới được cập nhật loại công việc');
  }

  const taskType = await TaskType.findOne({ _id: typeId, project: projectId });
  if (!taskType) throw new Error('Loại công việc không tồn tại trong dự án này');

  Object.assign(taskType, data);
  await taskType.save();
  return taskType;
};

const deleteTaskType = async (projectId, typeId, userId) => {
  const project = await ensureProjectAccess(projectId, userId);
  if (!isSameId(project.owner, userId)) {
    throw new Error('Chỉ chủ dự án mới được xóa loại công việc');
  }

  const taskType = await TaskType.findOneAndDelete({ _id: typeId, project: projectId });
  if (!taskType) throw new Error('Loại công việc không tồn tại trong dự án này');
  return { message: 'Xóa loại công việc thành công' };
};

module.exports = {
  getTaskTypesByProject,
  createTaskType,
  updateTaskType,
  deleteTaskType,
};
