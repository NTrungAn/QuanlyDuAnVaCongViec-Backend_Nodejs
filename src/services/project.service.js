const Project = require('../models/Project.model');
const User = require('../models/User.model');
const notificationService = require('./notification.service');
const { includesId, isSameId } = require('../utils/id.util');

const userResponse = (user) => {
  if (!user) return null;
  return {
    id: user._id || user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl || null,
  };
};

const projectResponse = (project) => ({
  id: project._id,
  name: project.name,
  description: project.description,
  startDate: project.startDate,
  endDate: project.endDate,
  status: project.status,
  owner: userResponse(project.owner),
  members: Array.isArray(project.members)
    ? project.members.map(userResponse)
    : [],
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
});

const hasProjectAccess = (project, userId) =>
  isSameId(project.owner, userId) ||
  includesId(project.members, userId);

const createProject = async (projectData, userId) => {
  const project = await Project.create({
    ...projectData,
    owner: userId,
    members: [userId],
  });

  const populated = await Project.findById(project._id)
    .populate('owner', 'fullName email avatarUrl')
    .populate('members', 'fullName email avatarUrl');

  return projectResponse(populated || project);
};

const getAllProjects = async (userId, query = {}) => {
  const dbQuery = {
    ...query,
    $or: [{ owner: userId }, { members: userId }],
  };

  const projects = await Project.find(dbQuery)
    .populate('owner', 'fullName email avatarUrl')
    .populate('members', 'fullName email avatarUrl')
    .sort({ updatedAt: -1, createdAt: -1 });

  return projects.map(projectResponse);
};

const getProjectById = async (projectId, userId) => {
  const project = await Project.findById(projectId)
    .populate('owner', 'fullName email avatarUrl')
    .populate('members', 'fullName email avatarUrl');

  if (!project) {
    throw new Error('Dự án không tồn tại');
  }

  if (!hasProjectAccess(project, userId)) {
    throw new Error('Bạn không có quyền truy cập dự án này');
  }

  return projectResponse(project);
};

const updateProject = async (projectId, updateData, userId) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new Error('Dự án không tồn tại');
  }

  if (!isSameId(project.owner, userId)) {
    throw new Error('Bạn không có quyền cập nhật dự án này');
  }

  Object.assign(project, updateData);
  await project.save();

  const populated = await Project.findById(project._id)
    .populate('owner', 'fullName email avatarUrl')
    .populate('members', 'fullName email avatarUrl');

  return projectResponse(populated || project);
};

const deleteProject = async (projectId, userId) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new Error('Dự án không tồn tại');
  }

  if (!isSameId(project.owner, userId)) {
    throw new Error('Bạn không có quyền xóa dự án này');
  }

  await Project.findByIdAndDelete(projectId);
  return { message: 'Xóa dự án thành công' };
};

const addMember = async (projectId, memberId, ownerId) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new Error('Dự án không tồn tại');
  }

  if (!isSameId(project.owner, ownerId)) {
    throw new Error('Chỉ chủ sở hữu mới có quyền thêm thành viên');
  }

  const user = await User.findById(memberId);
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }

  if (includesId(project.members, memberId)) {
    throw new Error('Người dùng đã là thành viên của dự án');
  }

  project.members.push(memberId);
  await project.save();

  await notificationService.createNotification({
    recipient: memberId,
    sender: ownerId,
    type: 'PROJECT_INVITATION',
    message: `Bạn đã được thêm vào dự án: ${project.name}`,
    link: `/projects/${projectId}`,
  });

  const populated = await Project.findById(project._id)
    .populate('owner', 'fullName email avatarUrl')
    .populate('members', 'fullName email avatarUrl');

  return projectResponse(populated || project);
};

const removeMember = async (projectId, memberId, ownerId) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new Error('Dự án không tồn tại');
  }

  if (!isSameId(project.owner, ownerId)) {
    throw new Error('Chỉ chủ sở hữu mới có quyền xóa thành viên');
  }

  if (isSameId(memberId, project.owner)) {
    throw new Error('Không thể xóa chủ sở hữu khỏi dự án');
  }

  project.members = project.members.filter(
    (m) => !isSameId(m, memberId)
  );

  await project.save();

  const populated = await Project.findById(project._id)
    .populate('owner', 'fullName email avatarUrl')
    .populate('members', 'fullName email avatarUrl');

  return projectResponse(populated || project);
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  hasProjectAccess,
};