const Task = require("../models/Task.model");
const Project = require("../models/Project.model");
const notificationService = require("./notification.service");
const TaskActivity = require("../models/TaskActivity.model");

const priorityWeight = {
  "URGENT": 4,
  "HIGH": 3,
  "MEDIUM": 2,
  "LOW": 1,
  "LOWEST": 0
};

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
  sprint: task.sprint,
  epic: task.epic,
  taskType: task.taskType,
  startDate: task.startDate,
  progress: task.progress,
  isDeleted: task.isDeleted,
  isArchived: task.isArchived,
  attachments: task.attachments,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
});

const createTask = async (taskData, userId) => {
  const project = await Project.findById(taskData.project);
  if (!project) {
    throw new Error("Dự án không tồn tại");
  }

  // Kiểm tra xem user có phải là thành viên của dự án không
  if (!project.members.includes(userId)) {
    throw new Error("Bạn không có quyền tạo công việc trong dự án này");
  }

  const task = await Task.create({
    ...taskData,
    creator: userId,
  });

  await TaskActivity.create({
    task: task._id,
    user: userId,
    action: "CREATED",
    details: "Tạo mới công việc",
  });

  // Nếu có người được giao việc, gửi thông báo
  if (task.assignee && task.assignee.toString() !== userId.toString()) {
    await notificationService.createNotification({
      recipient: task.assignee,
      sender: userId,
      type: "TASK_ASSIGNED",
      message: `Bạn được giao công việc mới: ${task.title} trong dự án ${project.name}`,
      link: `/tasks/${task._id}`,
    });
  }

  return taskResponse(task);
};

const getTasksByProject = async (projectId, userId, query = {}) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Dự án không tồn tại");
  }

  if (!project.members.includes(userId)) {
    throw new Error("Bạn không có quyền xem công việc trong dự án này");
  }

  let tasks = await Task.find({ project: projectId, isDeleted: false })
    .populate("assignee", "fullName email avatarUrl")
    .populate("creator", "fullName email avatarUrl")
    .populate("sprint", "name status startDate endDate")
    .populate("epic", "name status")
    .populate("taskType", "name icon color");

  if (query.sortBy === 'priority') {
    tasks.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
  }

  return tasks.map(taskResponse);
};

const getTaskById = async (taskId, userId) => {
  const task = await Task.findById(taskId)
    .populate("project")
    .populate("assignee", "fullName email avatarUrl")
    .populate("creator", "fullName email avatarUrl")
    .populate("sprint", "name status startDate endDate")
    .populate("epic", "name status")
    .populate("taskType", "name icon color");

  if (!task) {
    throw new Error("Công việc không tồn tại");
  }

  // Kiểm tra quyền truy cập thông qua project members
  const project = task.project;
  if (!project.members.includes(userId)) {
    throw new Error("Bạn không có quyền xem công việc này");
  }

  return taskResponse(task);
};

const updateTask = async (taskId, updateData, userId) => {
  const task = await Task.findById(taskId).populate("project");
  if (!task) {
    throw new Error("Công việc không tồn tại");
  }

  const project = task.project;
  // Người có quyền update: Chủ sở hữu dự án, Người tạo task, hoặc Người được giao task
  const isOwner = project.owner.toString() === userId.toString();
  const isCreator = task.creator.toString() === userId.toString();
  const isAssignee =
    task.assignee && task.assignee.toString() === userId.toString();

  if (!isOwner && !isCreator && !isAssignee) {
    throw new Error("Bạn không có quyền cập nhật công việc này");
  }

  const previousAssignee = task.assignee ? task.assignee.toString() : null;

  const oldStatus = task.status;
  Object.assign(task, updateData);
  await task.save();

  let details = "Cập nhật thuộc tính công việc";
  if (updateData.status && updateData.status !== oldStatus) {
    details = `Chuyển trạng thái từ ${oldStatus} sang ${updateData.status}`;
  } else if (updateData.progress !== undefined) {
    details = `Cập nhật tiến độ: ${updateData.progress}%`;
  }

  await TaskActivity.create({
    task: task._id,
    user: userId,
    action: "UPDATED",
    details,
  });

  // Nếu người được giao thay đổi, gửi thông báo cho người mới
  const newAssignee = task.assignee ? task.assignee.toString() : null;
  if (
    newAssignee &&
    newAssignee !== previousAssignee &&
    newAssignee !== userId.toString()
  ) {
    await notificationService.createNotification({
      recipient: task.assignee,
      sender: userId,
      type: "TASK_ASSIGNED",
      message: `Bạn được giao công việc: ${task.title} trong dự án ${project.name}`,
      link: `/tasks/${task._id}`,
    });
  }

  return taskResponse(task);
};

const deleteTask = async (taskId, userId) => {
  const task = await Task.findById(taskId).populate("project");
  if (!task) {
    throw new Error("Công việc không tồn tại");
  }

  const project = task.project;
  // Người có quyền xóa: Chủ sở hữu dự án hoặc Người tạo task
  const isOwner = project.owner.toString() === userId.toString();
  const isCreator = task.creator.toString() === userId.toString();

  if (!isOwner && !isCreator) {
    throw new Error("Bạn không có quyền xóa công việc này");
  }

  task.isDeleted = true;
  await task.save();

  await TaskActivity.create({
    task: task._id,
    user: userId,
    action: "DELETED",
    details: "Đưa công việc vào thùng rác",
  });

  return { message: "Đưa công việc vào thùng rác thành công" };
};

const getBacklogByProject = async (projectId, userId, query = {}) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Dự án không tồn tại");
  }

  if (!project.members.includes(userId)) {
    throw new Error("Bạn không có quyền xem công việc trong dự án này");
  }

  let tasks = await Task.find({ project: projectId, sprint: null, isDeleted: false })
    .populate("assignee", "fullName email avatarUrl")
    .populate("creator", "fullName email avatarUrl")
    .populate("epic", "name status")
    .populate("taskType", "name icon color")
    .sort({ order: 1, createdAt: 1 });

  if (query.sortBy === 'priority') {
    tasks.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
  }

  return tasks.map(taskResponse);
};

const restoreTask = async (taskId, userId) => {
  const task = await Task.findById(taskId).populate("project");
  if (!task) throw new Error("Công việc không tồn tại");

  const project = task.project;
  const isOwner = project.owner.toString() === userId.toString();
  const isCreator = task.creator.toString() === userId.toString();
  if (!isOwner && !isCreator) throw new Error("Bạn không có quyền khôi phục công việc này");

  task.isDeleted = false;
  await task.save();

  await TaskActivity.create({
    task: task._id,
    user: userId,
    action: "RESTORED",
    details: "Khôi phục công việc từ thùng rác",
  });

  return { message: "Khôi phục công việc thành công" };
};

const archiveTask = async (taskId, userId) => {
  const task = await Task.findById(taskId).populate("project");
  if (!task) throw new Error("Công việc không tồn tại");

  const project = task.project;
  const isOwner = project.owner.toString() === userId.toString();
  if (!isOwner) throw new Error("Chỉ chủ dự án mới có quyền lưu trữ công việc");

  task.isArchived = true;
  await task.save();

  await TaskActivity.create({
    task: task._id,
    user: userId,
    action: "ARCHIVED",
    details: "Lưu trữ công việc",
  });

  return { message: "Lưu trữ công việc thành công" };
};

const getTaskActivities = async (taskId, userId) => {
  const task = await Task.findById(taskId).populate("project");
  if (!task) throw new Error("Công việc không tồn tại");
  
  if (!task.project.members.includes(userId) && task.project.owner.toString() !== userId.toString()) {
    throw new Error("Bạn không có quyền xem thông tin này");
  }

  const activities = await TaskActivity.find({ task: taskId })
    .populate("user", "fullName email avatarUrl")
    .sort({ createdAt: -1 });
  
  return activities;
};

module.exports = {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  deleteTask,
  getBacklogByProject,
  restoreTask,
  archiveTask,
  getTaskActivities,
};
