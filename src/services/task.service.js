const Task = require('../models/Task.model');
const Project = require('../models/Project.model');
const Sprint = require('../models/Sprint.model');
const Epic = require('../models/Epic.model');
const notificationService = require('./notification.service');
const { hasProjectAccess } = require('./project.service');

const normalizeId = (value) => String(value?._id || value?.id || value || '');

const taskResponse = (task) => ({
  id: task._id,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  dueDate: task.dueDate,
  project: task.project,
  assignee: task.assignee,
  creator: task.creator,
  sprint: task.sprint || null,
  epic: task.epic || null,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
});


const notifyProjectMembers = async (project, actorId, buildPayload) => {
  const actor = normalizeId(actorId);
  const recipients = Array.from(
    new Set((project.members || []).map((member) => normalizeId(member)).filter(Boolean))
  ).filter((memberId) => memberId !== actor);

  await Promise.all(
    recipients.map((recipient) =>
      notificationService.createNotification({
        recipient,
        sender: actorId,
        ...buildPayload(recipient),
      })
    )
  );
};

const ensureProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error('Dự án không tồn tại');
  }
  if (!hasProjectAccess(project, userId)) {
    throw new Error('Bạn không có quyền thao tác với dự án này');
  }
  return project;
};

const createTask = async (taskData, userId) => {
  const project = await ensureProjectAccess(taskData.project, userId);

  if (taskData.assignee && !project.members.some((m) => normalizeId(m) === normalizeId(taskData.assignee))) {
    throw new Error('Người được giao phải là thành viên của dự án');
  }

  if (taskData.sprint) {
    const sprint = await Sprint.findById(taskData.sprint);
    if (!sprint) {
      throw new Error('Sprint không tồn tại');
    }
    if (normalizeId(sprint.project) !== normalizeId(taskData.project)) {
      throw new Error('Sprint không thuộc dự án này');
    }
  }

  if (taskData.epic) {
    const epic = await Epic.findById(taskData.epic);
    if (!epic) {
      throw new Error('Epic không tồn tại');
    }
    if (normalizeId(epic.project) !== normalizeId(taskData.project)) {
      throw new Error('Epic không thuộc dự án này');
    }
  }

  const task = await Task.create({
    ...taskData,
    creator: userId,
    sprint: taskData.sprint || null,
    epic: taskData.epic || null,
  });

  if (task.sprint) {
    await Sprint.findByIdAndUpdate(task.sprint, { $addToSet: { tasks: task._id } });
  }

  if (task.epic) {
    await Epic.findByIdAndUpdate(task.epic, { $addToSet: { tasks: task._id } });
  }

  await notifyProjectMembers(project, userId, (recipient) => ({
    type: 'TASK_CREATED',
    message:
      task.assignee && normalizeId(task.assignee) === recipient
        ? `Bạn được giao công việc mới: ${task.title} trong dự án ${project.name}`
        : `Có công việc mới trong dự án ${project.name}: ${task.title}`,
    link: `/projects/${project._id}`,
  }));

  const populated = await Task.findById(task._id)
    .populate('assignee', 'fullName email avatarUrl')
    .populate('creator', 'fullName email avatarUrl')
    .populate('sprint', 'name')
    .populate('epic', 'name');
  return taskResponse(populated || task);
};

const getTasksByProject = async (projectId, userId) => {
  await ensureProjectAccess(projectId, userId);
  const tasks = await Task.find({ project: projectId })
    .populate('assignee', 'fullName email avatarUrl')
    .populate('creator', 'fullName email avatarUrl')
    .populate('sprint', 'name')
    .populate('epic', 'name')
    .sort({ createdAt: -1 });
  return tasks.map(taskResponse);
};

const getTaskById = async (taskId, userId) => {
  const task = await Task.findById(taskId)
    .populate('project')
    .populate('assignee', 'fullName email avatarUrl')
    .populate('creator', 'fullName email avatarUrl');

  if (!task) {
    throw new Error('Công việc không tồn tại');
  }
  if (!hasProjectAccess(task.project, userId)) {
    throw new Error('Bạn không có quyền xem công việc này');
  }
  return taskResponse(task);
};

const updateTask = async (taskId, updateData, userId) => {
  const task = await Task.findById(taskId).populate('project');
  if (!task) {
    throw new Error('Công việc không tồn tại');
  }

  const project = task.project;
  const isOwner = normalizeId(project.owner) === normalizeId(userId);
  const isCreator = normalizeId(task.creator) === normalizeId(userId);
  const isAssignee = task.assignee && normalizeId(task.assignee) === normalizeId(userId);

  if (!isOwner && !isCreator && !isAssignee) {
    throw new Error('Bạn không có quyền cập nhật công việc này');
  }

  if (updateData.assignee && !project.members.some((m) => normalizeId(m) === normalizeId(updateData.assignee))) {
    throw new Error('Người được giao phải là thành viên của dự án');
  }

  const previousAssignee = task.assignee ? normalizeId(task.assignee) : null;
  const previousStatus = task.status;
  const previousSprint = task.sprint ? normalizeId(task.sprint) : null;
  const previousEpic = task.epic ? normalizeId(task.epic) : null;

  if (Object.prototype.hasOwnProperty.call(updateData, 'sprint')) {
    if (updateData.sprint) {
      const sprint = await Sprint.findById(updateData.sprint);
      if (!sprint) {
        throw new Error('Sprint không tồn tại');
      }
      if (normalizeId(sprint.project) !== normalizeId(project._id)) {
        throw new Error('Sprint không thuộc dự án này');
      }
    } else {
      updateData.sprint = null;
    }
  }

  if (Object.prototype.hasOwnProperty.call(updateData, 'epic')) {
    if (updateData.epic) {
      const epic = await Epic.findById(updateData.epic);
      if (!epic) {
        throw new Error('Epic không tồn tại');
      }
      if (normalizeId(epic.project) !== normalizeId(project._id)) {
        throw new Error('Epic không thuộc dự án này');
      }
    } else {
      updateData.epic = null;
    }
  }

  Object.assign(task, updateData);
  await task.save();

  const newAssignee = task.assignee ? normalizeId(task.assignee) : null;
  const newSprint = task.sprint ? normalizeId(task.sprint) : null;
  const newEpic = task.epic ? normalizeId(task.epic) : null;

  if (previousSprint !== newSprint) {
    if (previousSprint) {
      await Sprint.findByIdAndUpdate(previousSprint, { $pull: { tasks: task._id } });
    }
    if (newSprint) {
      await Sprint.findByIdAndUpdate(newSprint, { $addToSet: { tasks: task._id } });
    }
  }

  if (previousEpic !== newEpic) {
    if (previousEpic) {
      await Epic.findByIdAndUpdate(previousEpic, { $pull: { tasks: task._id } });
    }
    if (newEpic) {
      await Epic.findByIdAndUpdate(newEpic, { $addToSet: { tasks: task._id } });
    }
  }

  if (newAssignee && newAssignee !== previousAssignee && newAssignee !== normalizeId(userId)) {
    await notificationService.createNotification({
      recipient: task.assignee,
      sender: userId,
      type: 'TASK_ASSIGNED',
      message: `Bạn được giao công việc: ${task.title} trong dự án ${project.name}`,
      link: `/projects/${project._id}`,
    });
  }

  if (updateData.status && updateData.status !== previousStatus && normalizeId(task.creator) !== normalizeId(userId)) {
    await notificationService.createNotification({
      recipient: task.creator,
      sender: userId,
      type: 'TASK_UPDATED',
      message: `Công việc ${task.title} đã được cập nhật sang trạng thái ${task.status}`,
      link: `/projects/${project._id}`,
    });
  }

  const populated = await Task.findById(task._id)
    .populate('assignee', 'fullName email avatarUrl')
    .populate('creator', 'fullName email avatarUrl')
    .populate('sprint', 'name')
    .populate('epic', 'name');
  return taskResponse(populated || task);
};

const deleteTask = async (taskId, userId) => {
  const task = await Task.findById(taskId).populate('project');
  if (!task) {
    throw new Error('Công việc không tồn tại');
  }

  const project = task.project;
  const isOwner = normalizeId(project.owner) === normalizeId(userId);
  const isCreator = normalizeId(task.creator) === normalizeId(userId);

  if (!isOwner && !isCreator) {
    throw new Error('Bạn không có quyền xóa công việc này');
  }

  if (task.sprint) {
    await Sprint.findByIdAndUpdate(task.sprint, { $pull: { tasks: task._id } });
  }

  if (task.epic) {
    await Epic.findByIdAndUpdate(task.epic, { $pull: { tasks: task._id } });
  }

  await Task.findByIdAndDelete(taskId);
  return { message: 'Xóa công việc thành công' };
};

module.exports = {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  deleteTask,
};
