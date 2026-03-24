const Project = require('../models/Project.model');
const Task = require('../models/Task.model');
const Sprint = require('../models/Sprint.model');
const Epic = require('../models/Epic.model');
const notificationService = require('./notification.service');
const { hasProjectAccess } = require('./project.service');


const normalizeId = (value) => String(value?._id || value?.id || value || '');

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

const sprintResponse = (sprint) => ({
  id: sprint._id,
  name: sprint.name,
  goal: sprint.goal,
  startDate: sprint.startDate,
  endDate: sprint.endDate,
  status: sprint.status,
  project: sprint.project,
  createdBy: sprint.createdBy,
  tasks: Array.isArray(sprint.tasks)
    ? sprint.tasks.map((task) => ({
        id: task._id || task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
      }))
    : [],
  createdAt: sprint.createdAt,
  updatedAt: sprint.updatedAt,
});

const epicResponse = (epic) => ({
  id: epic._id,
  name: epic.name,
  description: epic.description,
  status: epic.status,
  project: epic.project,
  createdBy: epic.createdBy,
  tasks: Array.isArray(epic.tasks)
    ? epic.tasks.map((task) => ({
        id: task._id || task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
      }))
    : [],
  createdAt: epic.createdAt,
  updatedAt: epic.updatedAt,
});

const createSprint = async (projectId, sprintData, userId) => {
  const project = await ensureProjectAccess(projectId, userId);
  const sprint = await Sprint.create({ ...sprintData, project: projectId, createdBy: userId });

  await notifyProjectMembers(project, userId, () => ({
    type: 'SPRINT_CREATED',
    message: `Sprint mới đã được tạo trong dự án ${project.name}: ${sprint.name}`,
    link: `/projects/${projectId}`,
  }));

  return sprintResponse(sprint);
};

const getSprintsByProject = async (projectId, userId) => {
  await ensureProjectAccess(projectId, userId);
  const sprints = await Sprint.find({ project: projectId }).populate('tasks', 'title status priority').sort({ startDate: 1, createdAt: 1 });
  return sprints.map(sprintResponse);
};

const addTaskToSprint = async (projectId, sprintId, taskId, userId) => {
  const project = await ensureProjectAccess(projectId, userId);
  const [sprint, task] = await Promise.all([Sprint.findById(sprintId), Task.findById(taskId)]);
  if (!sprint) throw new Error('Sprint không tồn tại');
  if (!task) throw new Error('Task không tồn tại');
  if (String(sprint.project) !== String(projectId)) throw new Error('Sprint không thuộc dự án này');
  if (String(task.project) !== String(projectId)) throw new Error('Task không thuộc dự án này');

  if (task.sprint && String(task.sprint) !== String(sprintId)) {
    await Sprint.findByIdAndUpdate(task.sprint, { $pull: { tasks: task._id } });
  }
  task.sprint = sprint._id;
  await task.save();
  await Sprint.findByIdAndUpdate(sprint._id, { $addToSet: { tasks: task._id } });

  if (normalizeId(task.assignee) && normalizeId(task.assignee) !== normalizeId(userId)) {
    await notificationService.createNotification({
      recipient: task.assignee,
      sender: userId,
      type: 'TASK_UPDATED',
      message: `Công việc ${task.title} đã được thêm vào sprint ${sprint.name} trong dự án ${project.name}`,
      link: `/projects/${projectId}`,
    });
  }

  const updatedSprint = await Sprint.findById(sprint._id).populate('tasks', 'title status priority');
  return { message: 'Thêm task vào sprint thành công', sprint: sprintResponse(updatedSprint) };
};

const createEpic = async (projectId, epicData, userId) => {
  const project = await ensureProjectAccess(projectId, userId);
  const epic = await Epic.create({ ...epicData, project: projectId, createdBy: userId });

  await notifyProjectMembers(project, userId, () => ({
    type: 'EPIC_CREATED',
    message: `Epic mới đã được tạo trong dự án ${project.name}: ${epic.name}`,
    link: `/projects/${projectId}`,
  }));

  return epicResponse(epic);
};

const getEpicsByProject = async (projectId, userId) => {
  await ensureProjectAccess(projectId, userId);
  const epics = await Epic.find({ project: projectId }).populate('tasks', 'title status priority').sort({ createdAt: -1 });
  return epics.map(epicResponse);
};

const linkTaskToEpic = async (projectId, epicId, taskId, userId) => {
  const project = await ensureProjectAccess(projectId, userId);
  const [epic, task] = await Promise.all([Epic.findById(epicId), Task.findById(taskId)]);
  if (!epic) throw new Error('Epic không tồn tại');
  if (!task) throw new Error('Task không tồn tại');
  if (String(epic.project) !== String(projectId)) throw new Error('Epic không thuộc dự án này');
  if (String(task.project) !== String(projectId)) throw new Error('Task không thuộc dự án này');

  if (task.epic && String(task.epic) !== String(epicId)) {
    await Epic.findByIdAndUpdate(task.epic, { $pull: { tasks: task._id } });
  }
  task.epic = epic._id;
  await task.save();
  await Epic.findByIdAndUpdate(epic._id, { $addToSet: { tasks: task._id } });

  if (normalizeId(task.assignee) && normalizeId(task.assignee) !== normalizeId(userId)) {
    await notificationService.createNotification({
      recipient: task.assignee,
      sender: userId,
      type: 'TASK_UPDATED',
      message: `Công việc ${task.title} đã được gắn vào epic ${epic.name} trong dự án ${project.name}`,
      link: `/projects/${projectId}`,
    });
  }

  const updatedEpic = await Epic.findById(epic._id).populate('tasks', 'title status priority');
  return { message: 'Gắn task vào epic thành công', epic: epicResponse(updatedEpic) };
};

module.exports = {
  createSprint,
  getSprintsByProject,
  addTaskToSprint,
  createEpic,
  getEpicsByProject,
  linkTaskToEpic,
};
