const Task = require('../models/Task.model');
const Project = require('../models/Project.model');
const Attachment = require('../models/Attachment.model');
const notificationService = require('./notification.service');
const { includesId, isSameId, normalizeId } = require('../utils/id.util');

const priorityWeight = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  LOWEST: 0,
};

const taskResponse = (task) => ({
  id: task._id,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  dueDate: task.dueDate,
  project: normalizeId(task.project),
  assignee: task.assignee || null,
  creator: task.creator || null,
  sprint: task.sprint
    ? typeof task.sprint === 'string'
      ? task.sprint
      : {
          _id: task.sprint._id || task.sprint.id,
          id: task.sprint._id || task.sprint.id,
          name: task.sprint.name,
          status: task.sprint.status,
          startDate: task.sprint.startDate,
          endDate: task.sprint.endDate,
        }
    : null,
  epic: task.epic
    ? typeof task.epic === 'string'
      ? task.epic
      : {
          _id: task.epic._id || task.epic.id,
          id: task.epic._id || task.epic.id,
          name: task.epic.name,
          status: task.epic.status,
        }
    : null,
  labels: task.labels || [],
  parentTask: task.parentTask || null,
  taskType: task.taskType || null,
  startDate: task.startDate,
  progress: task.progress,
  isDeleted: task.isDeleted,
  isArchived: task.isArchived,
  attachments: task.attachments,
  commentsCount: task.commentsCount || 0,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
});

const ensureProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error('Dự án không tồn tại');
  if (!includesId(project.members, userId) && !isSameId(project.owner, userId)) {
    throw new Error('Bạn không có quyền thao tác với dự án này');
  }
  return project;
};

const populateTaskById = async (taskId) =>
  Task.findById(taskId)
    .populate('assignee', 'fullName email avatarUrl')
    .populate('creator', 'fullName email avatarUrl')
    .populate('sprint', 'name status startDate endDate')
    .populate('epic', 'name status')
    .populate('labels', 'name color')
    .populate('taskType', 'name icon color');

const createTask = async (taskData, userId) => {
  const project = await ensureProjectAccess(taskData.project, userId);

  if (taskData.assignee && !includesId(project.members, taskData.assignee)) {
    throw new Error('Người được giao phải là thành viên của dự án');
  }

  const Sprint = require('../models/Sprint.model');
  const Epic = require('../models/Epic.model');

  if (taskData.sprint) {
    const targetSprint = await Sprint.findById(taskData.sprint);
    if (!targetSprint) throw new Error('Sprint không tồn tại');
    if (!isSameId(targetSprint.project, taskData.project)) {
      throw new Error('Sprint không thuộc dự án này');
    }
    if (targetSprint.status === 'COMPLETED') {
      throw new Error('Không thể tạo công việc trong Sprint đã hoàn thành');
    }
  }

  if (taskData.epic) {
    const targetEpic = await Epic.findById(taskData.epic);
    if (!targetEpic) throw new Error('Epic không tồn tại');
    if (!isSameId(targetEpic.project, taskData.project)) {
      throw new Error('Epic không thuộc dự án này');
    }
  }

  const task = await Task.create({
    ...taskData,
    creator: userId,
  });

  if (task.sprint) {
    await Sprint.findByIdAndUpdate(task.sprint, {
      $addToSet: { tasks: task._id },
    });
  }

  if (task.epic) {
    await Epic.findByIdAndUpdate(task.epic, {
      $addToSet: { tasks: task._id },
    });
  }

  if (task.assignee && !isSameId(task.assignee, userId)) {
    await notificationService.createNotification({
      recipient: task.assignee,
      sender: userId,
      type: 'TASK_ASSIGNED',
      message: `Bạn được giao công việc mới: ${task.title} trong dự án ${project.name}`,
      link: `/projects/${project._id}`,
    });
  }

  if (!isSameId(project.owner, userId)) {
    await notificationService.createNotification({
      recipient: project.owner,
      sender: userId,
      type: 'TASK_CREATED',
      message: `${task.title} vừa được tạo trong dự án ${project.name}`,
      link: `/projects/${project._id}`,
    });
  }

  const populated = await populateTaskById(task._id);
  return taskResponse(populated || task);
};

const getTasksByProject = async (projectId, userId, query = {}) => {
  await ensureProjectAccess(projectId, userId);

  let tasks = await Task.find({
    project: projectId,
    parentTask: null,
    isDeleted: { $ne: true },
  })
    .populate('assignee', 'fullName email avatarUrl')
    .populate('creator', 'fullName email avatarUrl')
    .populate('sprint', 'name status startDate endDate')
    .populate('epic', 'name status')
    .populate('labels', 'name color')
    .populate('taskType', 'name icon color');

  if (query.sortBy === 'priority') {
    tasks.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
  }

  return tasks.map(taskResponse);
};

const getTaskById = async (taskId, userId) => {
  const task = await Task.findById(taskId)
    .populate('project')
    .populate('assignee', 'fullName email avatarUrl')
    .populate('creator', 'fullName email avatarUrl')
    .populate('sprint', 'name status startDate endDate')
    .populate('epic', 'name status')
    .populate('labels', 'name color')
    .populate('taskType', 'name icon color');

  if (!task) throw new Error('Công việc không tồn tại');
  if (!includesId(task.project.members, userId) && !isSameId(task.project.owner, userId)) {
    throw new Error('Bạn không có quyền xem công việc này');
  }

  return taskResponse(task);
};

const updateTask = async (taskId, updateData, userId) => {
  const task = await Task.findById(taskId).populate('project');
  if (!task) throw new Error('Công việc không tồn tại');

  const project = task.project;
  const isOwner = isSameId(project.owner, userId);
  const isCreator = isSameId(task.creator, userId);
  const isAssignee = task.assignee && isSameId(task.assignee, userId);

  if (!isOwner && !isCreator && !isAssignee) {
    throw new Error('Bạn không có quyền cập nhật công việc này');
  }

  if (updateData.assignee && !includesId(project.members, updateData.assignee)) {
    throw new Error('Người được giao phải là thành viên của dự án');
  }

  const Sprint = require('../models/Sprint.model');
  const Epic = require('../models/Epic.model');

  const previousAssignee = task.assignee ? normalizeId(task.assignee) : null;
  const previousSprint = task.sprint ? normalizeId(task.sprint) : null;
  const previousEpic = task.epic ? normalizeId(task.epic) : null;

  if (Object.prototype.hasOwnProperty.call(updateData, 'sprint')) {
    const newSprint = updateData.sprint ? normalizeId(updateData.sprint) : null;
    if (newSprint !== previousSprint) {
      if (previousSprint) {
        const oldSprint = await Sprint.findById(previousSprint);
        if (oldSprint && oldSprint.status === 'COMPLETED') {
          throw new Error('Không thể kéo công việc ra khỏi Sprint đã hoàn thành');
        }
      }

      if (newSprint) {
        const targetSprint = await Sprint.findById(newSprint);
        if (!targetSprint) throw new Error('Sprint không tồn tại');
        if (!isSameId(targetSprint.project, project._id)) {
          throw new Error('Sprint không thuộc dự án này');
        }
        if (targetSprint.status === 'COMPLETED') {
          throw new Error('Không thể chuyển công việc vào Sprint đã hoàn thành');
        }
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(updateData, 'epic')) {
    const newEpic = updateData.epic ? normalizeId(updateData.epic) : null;
    if (newEpic) {
      const targetEpic = await Epic.findById(newEpic);
      if (!targetEpic) throw new Error('Epic không tồn tại');
      if (!isSameId(targetEpic.project, project._id)) {
        throw new Error('Epic không thuộc dự án này');
      }
    }
  }

  Object.assign(task, updateData);

  if (updateData.sprint === null) task.sprint = null;
  if (updateData.epic === null) task.epic = null;

  await task.save();

  const newSprint = task.sprint ? normalizeId(task.sprint) : null;
  if (newSprint !== previousSprint) {
    if (previousSprint) {
      await Sprint.findByIdAndUpdate(previousSprint, {
        $pull: { tasks: task._id },
      });
    }
    if (newSprint) {
      await Sprint.findByIdAndUpdate(newSprint, {
        $addToSet: { tasks: task._id },
      });
    }
  }

  const newEpic = task.epic ? normalizeId(task.epic) : null;
  if (newEpic !== previousEpic) {
    if (previousEpic) {
      await Epic.findByIdAndUpdate(previousEpic, {
        $pull: { tasks: task._id },
      });
    }
    if (newEpic) {
      await Epic.findByIdAndUpdate(newEpic, {
        $addToSet: { tasks: task._id },
      });
    }
  }

  const newAssignee = task.assignee ? normalizeId(task.assignee) : null;
  if (newAssignee && newAssignee !== previousAssignee && !isSameId(newAssignee, userId)) {
    await notificationService.createNotification({
      recipient: task.assignee,
      sender: userId,
      type: 'TASK_ASSIGNED',
      message: `Bạn được giao công việc: ${task.title} trong dự án ${project.name}`,
      link: `/projects/${project._id}`,
    });
  }

  const populated = await populateTaskById(task._id);
  return taskResponse(populated || task);
};

const deleteTask = async (taskId, userId) => {
  const task = await Task.findById(taskId).populate('project');
  if (!task) throw new Error('Công việc không tồn tại');

  const project = task.project;
  const isOwner = isSameId(project.owner, userId);
  const isCreator = isSameId(task.creator, userId);

  if (!isOwner && !isCreator) {
    throw new Error('Bạn không có quyền xóa công việc này');
  }

  if (task.sprint) {
    const Sprint = require('../models/Sprint.model');
    await Sprint.findByIdAndUpdate(task.sprint, { $pull: { tasks: task._id } });
  }

  if (task.epic) {
    const Epic = require('../models/Epic.model');
    await Epic.findByIdAndUpdate(task.epic, { $pull: { tasks: task._id } });
  }

  await Task.findByIdAndDelete(taskId);
  return { message: 'Xóa công việc thành công' };
};

const getBacklogByProject = async (projectId, userId, query = {}) => {
  await ensureProjectAccess(projectId, userId);

  let tasks = await Task.find({
    project: projectId,
    sprint: null,
    parentTask: null,
    isDeleted: false,
  })
    .populate('assignee', 'fullName email avatarUrl')
    .populate('creator', 'fullName email avatarUrl')
    .populate('epic', 'name status')
    .populate('labels', 'name color')
    .populate('taskType', 'name icon color')
    .sort({ order: 1, createdAt: 1 });

  if (query.sortBy === 'priority') {
    tasks.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
  }

  return tasks.map(taskResponse);
};

const getSubtasks = async (taskId, userId) => {
  const task = await Task.findById(taskId).populate('project');
  if (!task) throw new Error('Công việc không tồn tại');
  if (!includesId(task.project.members, userId) && !isSameId(task.project.owner, userId)) {
    throw new Error('Bạn không có quyền xem trong dự án này');
  }

  const subtasks = await Task.find({
    parentTask: taskId,
    isDeleted: { $ne: true },
  })
    .populate('assignee', 'fullName email avatarUrl')
    .populate('creator', 'fullName email avatarUrl')
    .populate('labels', 'name color')
    .sort({ createdAt: 1 });

  return subtasks.map(taskResponse);
};

const uploadAttachment = async (taskId, file, userId) => {
  const task = await Task.findById(taskId).populate('project');
  if (!task) throw new Error('Công việc không tồn tại');
  if (!includesId(task.project.members, userId) && !isSameId(task.project.owner, userId)) {
    throw new Error('Bạn không có quyền upload trong dự án này');
  }
  if (!file) throw new Error('Không có file nào được tải lên');

  const attachment = await Attachment.create({
    task: taskId,
    fileName: file.originalname,
    fileUrl: `/api/tasks/evidence/${file.filename}`,
    uploadedBy: userId,
  });

  return attachment;
};

const getAttachments = async (taskId, userId) => {
  const task = await Task.findById(taskId).populate('project');
  if (!task) throw new Error('Công việc không tồn tại');
  if (!includesId(task.project.members, userId) && !isSameId(task.project.owner, userId)) {
    throw new Error('Bạn không có quyền xem trong dự án này');
  }

  const attachments = await Attachment.find({ task: taskId })
    .populate('uploadedBy', 'fullName email avatarUrl')
    .sort({ createdAt: -1 });

  return attachments;
};

const deleteAttachment = async (attachmentId, userId, userRole) => {
  const attachment = await Attachment.findById(attachmentId).populate({
    path: 'task',
    populate: { path: 'project' },
  });

  if (!attachment) throw new Error('File không tồn tại');

  const isUploader = isSameId(attachment.uploadedBy, userId);
  const isAdmin = userRole === 'ADMIN';

  if (!isUploader && !isAdmin) {
    throw new Error('Bạn không có quyền xóa tệp này');
  }

  const path = require('path');
  const fs = require('fs');
  const fileName = attachment.fileUrl.split('/').pop();
  const filePath = path.resolve(__dirname, '..', 'images', 'evidence', fileName);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await Attachment.findByIdAndDelete(attachmentId);
  return { message: 'Xóa thành công' };
};

module.exports = {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  deleteTask,
  getBacklogByProject,
  getSubtasks,
  uploadAttachment,
  getAttachments,
  deleteAttachment,
};