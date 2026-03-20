const Task = require("../models/Task.model");
const Project = require("../models/Project.model");
const notificationService = require("./notification.service");

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

const getTasksByProject = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Dự án không tồn tại");
  }

  if (!project.members.includes(userId)) {
    throw new Error("Bạn không có quyền xem công việc trong dự án này");
  }

  const tasks = await Task.find({ project: projectId })
    .populate("assignee", "fullName email avatarUrl")
    .populate("creator", "fullName email avatarUrl");
  return tasks.map(taskResponse);
};

const getTaskById = async (taskId, userId) => {
  const task = await Task.findById(taskId)
    .populate("project")
    .populate("assignee", "fullName email avatarUrl")
    .populate("creator", "fullName email avatarUrl");

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

  Object.assign(task, updateData);
  await task.save();

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

  await Task.findByIdAndDelete(taskId);
  return { message: "Xóa công việc thành công" };
};

module.exports = {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  deleteTask,
};
