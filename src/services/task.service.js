const Task = require("../models/Task.model");
const Project = require("../models/Project.model");
const notificationService = require("./notification.service");

const priorityWeight = {
  "URGENT": 4,
  "HIGH": 3,
  "MEDIUM": 2,
  "LOW": 1,
  "LOWEST": 0
};

const Attachment = require("../models/Attachment.model");

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
  labels: task.labels || [],
  parentTask: task.parentTask,
  taskType: task.taskType,
  startDate: task.startDate,
  progress: task.progress,
  isDeleted: task.isDeleted,
  isArchived: task.isArchived,
  attachments: task.attachments,
  commentsCount: task.commentsCount || 0,
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

  if (taskData.sprint) {
    const Sprint = require('../models/Sprint.model');
    const targetSprint = await Sprint.findById(taskData.sprint);
    if (targetSprint && targetSprint.status === 'COMPLETED') {
      throw new Error('Không thể tạo công việc trong Sprint đã hoàn thành');
    }
  }

  const task = await Task.create({
    ...taskData,
    creator: userId,
  });

  if (task.sprint) {
    const Sprint = require('../models/Sprint.model');
    await Sprint.findByIdAndUpdate(task.sprint, { $addToSet: { tasks: task._id } });
  }

  if (task.epic) {
    const Epic = require('../models/Epic.model');
    await Epic.findByIdAndUpdate(task.epic, { $addToSet: { tasks: task._id } });
  }

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


  let tasks = await Task.find({ project: projectId, parentTask: null, isDeleted: { $ne: true } })

    .populate("assignee", "fullName email avatarUrl")
    .populate("creator", "fullName email avatarUrl")
    .populate("sprint", "name status startDate endDate")
    .populate("epic", "name status")
    .populate("labels", "name color")
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
    .populate("labels", "name color")
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
  const previousSprint = task.sprint ? task.sprint.toString() : null;
  const previousEpic = task.epic ? task.epic.toString() : null;

  if (updateData.sprint !== undefined) {
    const newSprint = updateData.sprint ? updateData.sprint.toString() : null;
    if (newSprint !== previousSprint) {
      const Sprint = require('../models/Sprint.model');
      
      if (previousSprint) {
        const oldSprint = await Sprint.findById(previousSprint);
        if (oldSprint && oldSprint.status === 'COMPLETED') {
          throw new Error('Không thể kéo công việc ra khỏi Sprint đã hoàn thành');
        }
      }

      if (newSprint) {
        const targetSprint = await Sprint.findById(newSprint);
        if (targetSprint && targetSprint.status === 'COMPLETED') {
          throw new Error('Không thể chuyển công việc vào Sprint đã hoàn thành');
        }
      }
    }
  }

  Object.assign(task, updateData);
  if (updateData.sprint === null) {
      task.sprint = null;
  }
  if (updateData.epic === null) {
      task.epic = null;
  }
  await task.save();

  // Handle sprint sync
  if (updateData.sprint !== undefined) {
    const newSprint = updateData.sprint ? updateData.sprint.toString() : null;
    if (newSprint !== previousSprint) {
      const Sprint = require('../models/Sprint.model');
      if (previousSprint) {
        await Sprint.findByIdAndUpdate(previousSprint, { $pull: { tasks: task._id } });
      }
      if (newSprint) {
        await Sprint.findByIdAndUpdate(newSprint, { $addToSet: { tasks: task._id } });
      }
    }
  }

  // Handle epic sync
  if (updateData.epic !== undefined) {
    const newEpic = updateData.epic ? updateData.epic.toString() : null;
    if (newEpic !== previousEpic) {
      const Epic = require('../models/Epic.model');
      if (previousEpic) {
        await Epic.findByIdAndUpdate(previousEpic, { $pull: { tasks: task._id } });
      }
      if (newEpic) {
        await Epic.findByIdAndUpdate(newEpic, { $addToSet: { tasks: task._id } });
      }
    }
  }

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

const getBacklogByProject = async (projectId, userId, query = {}) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Dự án không tồn tại");
  }

  if (!project.members.includes(userId)) {
    throw new Error("Bạn không có quyền xem công việc trong dự án này");
  }


  let tasks = await Task.find({ project: projectId, sprint: null, parentTask: null, isDeleted: false })

    .populate("assignee", "fullName email avatarUrl")
    .populate("creator", "fullName email avatarUrl")
    .populate("epic", "name status")
    .populate("labels", "name color")
    .populate("taskType", "name icon color")
    .sort({ order: 1, createdAt: 1 });

  if (query.sortBy === 'priority') {
    tasks.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
  }

  return tasks.map(taskResponse);
};

const getSubtasks = async (taskId, userId) => {
  const task = await Task.findById(taskId).populate("project");
  if (!task) throw new Error("Công việc không tồn tại");
  if (!task.project.members.includes(userId)) throw new Error("Bạn không có quyền xem trong dự án này");

  const subtasks = await Task.find({ parentTask: taskId, isDeleted: { $ne: true } })
    .populate("assignee", "fullName email avatarUrl")
    .populate("creator", "fullName email avatarUrl")
    .populate("labels", "name color")
    .sort({ createdAt: 1 });
  return subtasks.map(taskResponse);
};

const uploadAttachment = async (taskId, file, userId) => {
  const task = await Task.findById(taskId).populate("project");
  if (!task) throw new Error("Công việc không tồn tại");
  if (!task.project.members.includes(userId)) throw new Error("Bạn không có quyền upload trong dự án này");
  if (!file) throw new Error("Không có file nào được tải lên");

  const attachment = await Attachment.create({
    task: taskId,
    fileName: file.originalname,
    fileUrl: `/api/tasks/evidence/${file.filename}`,
    uploadedBy: userId
  });

  return attachment;
};

const getAttachments = async (taskId, userId) => {
  const task = await Task.findById(taskId).populate("project");
  if (!task) throw new Error("Công việc không tồn tại");
  if (!task.project.members.includes(userId)) throw new Error("Bạn không có quyền xem trong dự án này");

  const attachments = await Attachment.find({ task: taskId })
    .populate("uploadedBy", "fullName email avatarUrl")
    .sort({ createdAt: -1 });
  return attachments;
};

const deleteAttachment = async (attachmentId, userId, userRole) => {
  const attachment = await Attachment.findById(attachmentId).populate({ path: 'task', populate: { path: 'project' } });
  if (!attachment) throw new Error("File không tồn tại");
  
  const isUploader = attachment.uploadedBy.toString() === userId.toString();
  const isAdmin = userRole === 'ADMIN';

  if (!isUploader && !isAdmin) {
    throw new Error("Bạn không có quyền xóa tệp này");
  }

  const path = require('path');
  const fs = require('fs');
  const fileName = attachment.fileUrl.split('/').pop();
  const filePath = path.resolve(__dirname, '..', 'images', 'evidence', fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await Attachment.findByIdAndDelete(attachmentId);
  return { message: "Xóa thành công" };
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
  deleteAttachment
};
