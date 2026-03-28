const Project = require('../models/Project.model');
const Task = require('../models/Task.model');
const Sprint = require('../models/Sprint.model');
const Epic = require('../models/Epic.model');

const hasProjectAccess = (project, userId) =>
  project.owner.toString() === userId.toString() ||
  project.members.some((member) => member.toString() === userId.toString());

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
        taskType: task.taskType,
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
        taskType: task.taskType,
      }))
    : [],
  createdAt: epic.createdAt,
  updatedAt: epic.updatedAt,
});

const createSprint = async (projectId, sprintData, userId) => {
  await ensureProjectAccess(projectId, userId);

  const sprint = await Sprint.create({
    ...sprintData,
    project: projectId,
    createdBy: userId,
  });

  return sprintResponse(sprint);
};

const getSprintsByProject = async (projectId, userId) => {
  await ensureProjectAccess(projectId, userId);

  const sprints = await Sprint.find({ project: projectId })
    .populate({
      path: 'tasks',
      select: 'title status priority taskType',
      populate: { path: 'taskType' },
    })
    .sort({ startDate: 1, createdAt: 1 });

  return sprints.map(sprintResponse);
};

const addTaskToSprint = async (projectId, sprintId, taskId, userId) => {
  await ensureProjectAccess(projectId, userId);

  const [sprint, task] = await Promise.all([
    Sprint.findById(sprintId),
    Task.findById(taskId),
  ]);

  if (!sprint) {
    throw new Error('Sprint không tồn tại');
  }

  if (sprint.status === 'COMPLETED') {
    throw new Error('Không thể thêm công việc vào Sprint đã hoàn thành');
  }

  if (!task) {
    throw new Error('Task không tồn tại');
  }

  if (sprint.project.toString() !== projectId.toString()) {
    throw new Error('Sprint không thuộc dự án này');
  }

  if (task.project.toString() !== projectId.toString()) {
    throw new Error('Task không thuộc dự án này');
  }

  if (task.sprint && task.sprint.toString() !== sprintId.toString()) {
    await Sprint.findByIdAndUpdate(task.sprint, {
      $pull: { tasks: task._id },
    });
  }

  task.sprint = sprint._id;
  await task.save();

  await Sprint.findByIdAndUpdate(sprint._id, {
    $addToSet: { tasks: task._id },
  });

  const updatedSprint = await Sprint.findById(sprint._id).populate({
    path: 'tasks',
    select: 'title status priority taskType',
    populate: { path: 'taskType' },
  });

  return {
    message: 'Thêm task vào sprint thành công',
    sprint: sprintResponse(updatedSprint),
  };
};

const createEpic = async (projectId, epicData, userId) => {
  await ensureProjectAccess(projectId, userId);

  const epic = await Epic.create({
    ...epicData,
    project: projectId,
    createdBy: userId,
  });

  return epicResponse(epic);
};

const linkTaskToEpic = async (projectId, epicId, taskId, userId) => {
  await ensureProjectAccess(projectId, userId);

  const [epic, task] = await Promise.all([
    Epic.findById(epicId),
    Task.findById(taskId),
  ]);

  if (!epic) {
    throw new Error('Epic không tồn tại');
  }

  if (!task) {
    throw new Error('Task không tồn tại');
  }

  if (epic.project.toString() !== projectId.toString()) {
    throw new Error('Epic không thuộc dự án này');
  }

  if (task.project.toString() !== projectId.toString()) {
    throw new Error('Task không thuộc dự án này');
  }

  if (task.epic && task.epic.toString() !== epicId.toString()) {
    await Epic.findByIdAndUpdate(task.epic, {
      $pull: { tasks: task._id },
    });
  }

  task.epic = epic._id;
  await task.save();

  await Epic.findByIdAndUpdate(epic._id, {
    $addToSet: { tasks: task._id },
  });

  const updatedEpic = await Epic.findById(epic._id).populate({
    path: 'tasks',
    select: 'title status priority taskType',
    populate: { path: 'taskType' },
  });

  return {
    message: 'Gắn task vào epic thành công',
    epic: epicResponse(updatedEpic),
  };
};

const updateEpic = async (projectId, epicId, updateData, userId) => {
  await ensureProjectAccess(projectId, userId);

  const epic = await Epic.findById(epicId);
  if (!epic) {
    throw new Error('Epic không tồn tại');
  }

  if (epic.project.toString() !== projectId.toString()) {
    throw new Error('Epic không thuộc dự án này');
  }

  Object.assign(epic, updateData);
  await epic.save();

  const updatedEpic = await Epic.findById(epic._id).populate({
    path: 'tasks',
    select: 'title status priority taskType',
    populate: { path: 'taskType' },
  });

  return epicResponse(updatedEpic);
};

const deleteEpic = async (projectId, epicId, userId) => {
  await ensureProjectAccess(projectId, userId);

  const epic = await Epic.findById(epicId);
  if (!epic) {
    throw new Error('Epic không tồn tại');
  }

  if (epic.project.toString() !== projectId.toString()) {
    throw new Error('Epic không thuộc dự án này');
  }

  // Detach all tasks from this epic
  await Task.updateMany({ epic: epic._id }, { $set: { epic: null } });

  await Epic.findByIdAndDelete(epicId);

  return { message: 'Xóa epic thành công' };
};

const updateSprint = async (projectId, sprintId, updateData, userId) => {
  await ensureProjectAccess(projectId, userId);

  const sprint = await Sprint.findById(sprintId);
  if (!sprint) {
    throw new Error('Sprint không tồn tại');
  }

  if (sprint.project.toString() !== projectId.toString()) {
    throw new Error('Sprint không thuộc dự án này');
  }

  const oldStatus = sprint.status;
  Object.assign(sprint, updateData);
  await sprint.save();

  if (oldStatus !== 'COMPLETED' && updateData.status === 'COMPLETED') {
    await Task.updateMany(
      { sprint: sprint._id, status: { $ne: 'DONE' } },
      { $set: { sprint: null } }
    );
  }

  const updatedSprint = await Sprint.findById(sprint._id).populate({
    path: 'tasks',
    select: 'title status priority taskType',
    populate: { path: 'taskType' },
  });

  return sprintResponse(updatedSprint);
};

const deleteSprint = async (projectId, sprintId, userId) => {
  await ensureProjectAccess(projectId, userId);

  const sprint = await Sprint.findById(sprintId);
  if (!sprint) {
    throw new Error('Sprint không tồn tại');
  }

  if (sprint.project.toString() !== projectId.toString()) {
    throw new Error('Sprint không thuộc dự án này');
  }

  await Task.updateMany({ sprint: sprint._id }, { $set: { sprint: null } });

  await Sprint.findByIdAndDelete(sprintId);

  return { message: 'Xóa sprint thành công' };
};

const getBacklogData = async (projectId, userId) => {
  await ensureProjectAccess(projectId, userId);

  const backlogTasks = await Task.find({
    project: projectId,
    sprint: null,
    isDeleted: false,
    isArchived: false,
  })
    .sort({ order: 1, createdAt: -1 })
    .select('title status priority storyPoint order assignee createdAt');

  const sprints = await Sprint.find({ project: projectId })
    .sort({ startDate: 1, createdAt: 1 })
    .lean();

  const sprintsWithTasks = await Promise.all(
    sprints.map(async (sprint) => {
      const tasks = await Task.find({
        sprint: sprint._id,
        isDeleted: false,
        isArchived: false,
      })
        .sort({ order: 1, createdAt: -1 })
        .select('title status priority storyPoint order assignee createdAt');

      return {
        ...sprint,
        id: sprint._id,
        tasks,
      };
    }),
  );

  return {
    backlogTasks,
    sprints: sprintsWithTasks,
  };
};

const updateTaskOrder = async (projectId, updates, userId) => {
  await ensureProjectAccess(projectId, userId);

  if (!Array.isArray(updates) || updates.length === 0) {
    throw new Error('Dữ liệu cập nhật không hợp lệ');
  }

  const bulkOps = updates.map((update) => ({
    updateOne: {
      filter: { _id: update.taskId, project: projectId },
      update: {
        $set: {
          order: update.order,
          sprint: update.sprintId || null,
        },
      },
    },
  }));

  await Task.bulkWrite(bulkOps);

  return { message: 'Cập nhật thứ tự task thành công' };
};

const startSprint = async (projectId, sprintId, userId) => {
  await ensureProjectAccess(projectId, userId);

  const sprint = await Sprint.findById(sprintId);
  if (!sprint) {
    throw new Error('Sprint không tồn tại');
  }

  if (sprint.project.toString() !== projectId.toString()) {
    throw new Error('Sprint không thuộc dự án này');
  }

  if (sprint.status !== 'PLANNED') {
    throw new Error(
      'Chỉ có thể khởi động Sprint đang ở trạng thái Cần thực hiện (PLANNED)',
    );
  }

  const activeSprint = await Sprint.findOne({
    project: projectId,
    status: 'ACTIVE',
  });

  if (activeSprint) {
    throw new Error(
      'Dự án đã có một Sprint đang chạy (ACTIVE). Vui lòng hoàn thành Sprint đó trước.',
    );
  }

  sprint.status = 'ACTIVE';
  sprint.startDate = new Date();
  await sprint.save();

  return sprintResponse(sprint);
};

module.exports = {
  createSprint,
  getSprintsByProject,
  addTaskToSprint,
  createEpic,
  linkTaskToEpic,
  updateEpic,
  deleteEpic,
  updateSprint,
  deleteSprint,
  getBacklogData,
  updateTaskOrder,
  startSprint,
};
