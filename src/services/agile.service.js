const Project = require("../models/Project.model");
const Task = require("../models/Task.model");
const Sprint = require("../models/Sprint.model");
const Epic = require("../models/Epic.model");
const TaskStatus = require("../models/TaskStatus.model");

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hasProjectAccess = (project, userId) =>
  project.owner.toString() === userId.toString() ||
  project.members.some((member) => member.toString() === userId.toString());

const ensureProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Dự án không tồn tại");
  }

  if (!hasProjectAccess(project, userId)) {
    throw new Error("Bạn không có quyền thao tác với dự án này");
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
    .populate("tasks", "title status priority")
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
    throw new Error("Sprint không tồn tại");
  }

  if (!task) {
    throw new Error("Task không tồn tại");
  }

  if (sprint.project.toString() !== projectId.toString()) {
    throw new Error("Sprint không thuộc dự án này");
  }

  if (task.project.toString() !== projectId.toString()) {
    throw new Error("Task không thuộc dự án này");
  }

  task.sprint = sprint._id;
  await task.save();

  const updatedSprint = await Sprint.findById(sprint._id).populate(
    "tasks",
    "title status priority",
  );

  return {
    message: "Thêm task vào sprint thành công",
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
    throw new Error("Epic không tồn tại");
  }

  if (!task) {
    throw new Error("Task không tồn tại");
  }

  if (epic.project.toString() !== projectId.toString()) {
    throw new Error("Epic không thuộc dự án này");
  }

  if (task.project.toString() !== projectId.toString()) {
    throw new Error("Task không thuộc dự án này");
  }

  task.epic = epic._id;
  await task.save();

  const updatedEpic = await Epic.findById(epic._id).populate(
    "tasks",
    "title status priority",
  );

  return {
    message: "Gắn task vào epic thành công",
    epic: epicResponse(updatedEpic),
  };
};

const updateEpic = async (projectId, epicId, updateData, userId) => {
  await ensureProjectAccess(projectId, userId);

  const epic = await Epic.findById(epicId);
  if (!epic) {
    throw new Error("Epic không tồn tại");
  }

  if (epic.project.toString() !== projectId.toString()) {
    throw new Error("Epic không thuộc dự án này");
  }

  Object.assign(epic, updateData);
  await epic.save();

  const updatedEpic = await Epic.findById(epic._id).populate(
    "tasks",
    "title status priority",
  );

  return epicResponse(updatedEpic);
};

const deleteEpic = async (projectId, epicId, userId) => {
  await ensureProjectAccess(projectId, userId);

  const epic = await Epic.findById(epicId);
  if (!epic) {
    throw new Error("Epic không tồn tại");
  }

  if (epic.project.toString() !== projectId.toString()) {
    throw new Error("Epic không thuộc dự án này");
  }

  // Detach all tasks from this epic
  await Task.updateMany({ epic: epic._id }, { $set: { epic: null } });

  await Epic.findByIdAndDelete(epicId);

  return { message: "Xóa epic thành công" };
};

const updateSprint = async (projectId, sprintId, updateData, userId) => {
  await ensureProjectAccess(projectId, userId);

  const sprint = await Sprint.findById(sprintId);
  if (!sprint) {
    throw new Error("Sprint không tồn tại");
  }

  if (sprint.project.toString() !== projectId.toString()) {
    throw new Error("Sprint không thuộc dự án này");
  }

  const oldStatus = sprint.status;
  Object.assign(sprint, updateData);
  await sprint.save();

  if (oldStatus !== "COMPLETED" && updateData.status === "COMPLETED") {
    // Determine which status names count as "done" for this project.
    // Prefer statuses defined in TaskStatus with category 'DONE'.
    let doneStatuses = await TaskStatus.find({
      project: sprint.project,
      category: "DONE",
    }).lean();
    let doneNames = (doneStatuses || []).map((s) => s.name).filter(Boolean);

    // Fallback common tokens if no explicit DONE-category statuses exist.
    if (!doneNames.length) {
      doneNames = ["done", "completed", "hoàn thành", "hoan thanh"];
    }

    // Build $nor conditions to identify tasks whose status does NOT match any done-name (case-insensitive)
    const norConditions = doneNames.map((n) => ({
      status: { $regex: `^${escapeRegex(n)}$`, $options: "i" },
    }));

    // Update tasks: if task is in this sprint and its status does NOT match any done-names, detach it from sprint
    await Task.updateMany(
      { sprint: sprint._id, $nor: norConditions },
      { $set: { sprint: null } },
    );
  }

  const updatedSprint = await Sprint.findById(sprint._id).populate(
    "tasks",
    "title status priority",
  );

  return sprintResponse(updatedSprint);
};

const deleteSprint = async (projectId, sprintId, userId) => {
  await ensureProjectAccess(projectId, userId);

  const sprint = await Sprint.findById(sprintId);
  if (!sprint) {
    throw new Error("Sprint không tồn tại");
  }

  if (sprint.project.toString() !== projectId.toString()) {
    throw new Error("Sprint không thuộc dự án này");
  }

  await Task.updateMany({ sprint: sprint._id }, { $set: { sprint: null } });

  await Sprint.findByIdAndDelete(sprintId);

  return { message: "Xóa sprint thành công" };
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
};
