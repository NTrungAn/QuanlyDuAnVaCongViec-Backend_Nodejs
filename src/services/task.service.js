const Task = require("../models/Task.model");
const Project = require("../models/Project.model");
const Attachment = require("../models/Attachment.model");
const notificationService = require("./notification.service");
const workflowService = require("./workflow.service");
const { includesId, isSameId } = require("../utils/id.util");

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
  labels: task.labels,
  parentTask: task.parentTask,
  storyPoint: task.storyPoint,
  order: task.order,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
});

const createTask = async (taskData, userId) => {
  console.log("[createTask] payload:", {
    title: taskData.title,
    project: taskData.project,
    status: taskData.status,
    sprint: taskData.sprint,
    epic: taskData.epic,
    assignee: taskData.assignee,
  });
  const project = await Project.findById(taskData.project);
  if (!project) {
    throw new Error("Dự án không tồn tại");
  }

  // Kiểm tra xem user có phải là thành viên của dự án không
  if (!includesId(project.members, userId)) {
    throw new Error("Bạn không có quyền tạo công việc trong dự án này");
  }

  console.log(
    "[createTask] project members:",
    (project.members || []).map((m) => m.toString()),
  );
  // Lấy danh sách trạng thái 1 lần để kiểm tra/thiết lập mặc định và debug
  const statuses = await workflowService.getStatusesByProject(taskData.project);
  try {
    console.log(
      "[createTask] statuses:",
      (statuses || []).map((s) => s.name),
    );
  } catch (e) {
    console.log("[createTask] statuses: (unable to map names)", statuses);
  }

  if (taskData.status) {
    const isValidStatus = statuses.some((s) => s.name === taskData.status);
    if (!isValidStatus) {
      throw new Error(
        `Trạng thái "${taskData.status}" không hợp lệ cho dự án này.`,
      );
    }
  } else {
    if (statuses.length > 0) {
      taskData.status = statuses[0].name;
    } else {
      taskData.status = "Cần làm";
      console.warn(
        "[createTask] No statuses defined for project, fallback to 'Cần làm'",
      );
    }
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

  if (!includesId(project.members, userId)) {
    throw new Error("Bạn không có quyền xem công việc trong dự án này");
  }

  const tasks = await Task.find({ project: projectId, parentTask: null })
    .populate("assignee", "fullName email avatarUrl")
    .populate("creator", "fullName email avatarUrl")
    .populate("sprint", "name status startDate endDate")
    .populate("epic", "name status")
    .populate("taskType", "name icon color")
    .populate("labels", "name color");
  return tasks.map(taskResponse);
};

const getTaskById = async (taskId, userId) => {
  const task = await Task.findById(taskId)
    .populate("project")
    .populate("assignee", "fullName email avatarUrl")
    .populate("creator", "fullName email avatarUrl")
    .populate("sprint", "name status startDate endDate")
    .populate("epic", "name status")
    .populate("taskType", "name icon color")
    .populate("labels", "name color")
    .populate("parentTask", "title status");

  if (!task) {
    throw new Error("Công việc không tồn tại");
  }

  // Kiểm tra quyền truy cập thông qua project members
  const project = task.project;
  if (!includesId(project.members, userId)) {
    throw new Error("Bạn không có quyền xem công việc này");
  }

  return taskResponse(task);
};

const updateTask = async (taskId, updateData, userId) => {
  const task = await Task.findById(taskId)
    .populate("project")
    .populate("sprint", "status");
  if (!task) {
    throw new Error("Công việc không tồn tại");
  }

  const project = task.project;
  // Người có quyền update: Chủ sở hữu dự án, Người tạo task, hoặc Người được giao task
  const isOwner = isSameId(project.owner, userId);
  const isCreator = isSameId(task.creator, userId);
  const isAssignee = isSameId(task.assignee, userId);
  console.log("[updateTask] permission check", {
    userId: userId?.toString ? userId.toString() : userId,
    taskId: taskId,
    projectId: project._id?.toString ? project._id.toString() : project._id,
    isOwner,
    isCreator,
    isAssignee,
  });

  const isMember = includesId(project.members, userId);
  console.log("[updateTask] membership check", { isMember });

  if (!isOwner && !isCreator && !isAssignee && !isMember) {
    throw new Error("Bạn không có quyền cập nhật công việc này");
  }

  // If the user is a project member but not owner/creator/assignee,
  // allow only limited updates (status changes). This prevents members
  // from changing sensitive fields while letting them update status in Backlog.
  if (!isOwner && !isCreator && !isAssignee && isMember) {
    const allowedForMembers = ["status"];
    const forbidden = Object.keys(updateData || {}).filter(
      (k) => !allowedForMembers.includes(k),
    );
    if (forbidden.length) {
      throw new Error(
        `Bạn không có quyền cập nhật các trường: ${forbidden.join(", ")}`,
      );
    }
  }

  // Kiểm tra Workflow nếu có thay đổi trạng thái
  if (updateData.status && updateData.status !== task.status) {
    console.log("[updateTask] status change attempt", {
      userId: userId?.toString ? userId.toString() : userId,
      taskId,
      from: task.status,
      to: updateData.status,
      projectId: project._id?.toString ? project._id.toString() : project._id,
      sprint: task.sprint ? task.sprint.status : null,
    });

    // If the task is in Backlog (no sprint) or the sprint is not ACTIVE,
    // allow status changes without enforcing workflow transitions.
    const inActiveSprint = task.sprint && task.sprint.status === "ACTIVE";
    if (!inActiveSprint) {
      console.log(
        "[updateTask] skipping workflow validation (backlog or non-active sprint)",
      );
    } else {
      let isValidTransition = false;
      try {
        isValidTransition = await workflowService.validateTransition(
          project._id,
          task.status,
          updateData.status,
        );
        console.log("[updateTask] validateTransition result", {
          isValidTransition,
        });
      } catch (err) {
        console.error("[updateTask] validateTransition error", err);
      }

      if (!isValidTransition) {
        throw new Error(
          `Không được phép chuyển từ "${task.status}" sang "${updateData.status}" theo quy trình của dự án.`,
        );
      }
    }
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
  const isOwner = isSameId(project.owner, userId);
  const isCreator = isSameId(task.creator, userId);

  if (!isOwner && !isCreator) {
    throw new Error("Bạn không có quyền xóa công việc này");
  }

  await Task.findByIdAndDelete(taskId);
  return { message: "Xóa công việc thành công" };
};

const getBacklogByProject = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Dự án không tồn tại");
  }

  if (!includesId(project.members, userId)) {
    throw new Error("Bạn không có quyền xem công việc trong dự án này");
  }

  const tasks = await Task.find({
    project: projectId,
    sprint: null,
    parentTask: null,
  })
    .populate("assignee", "fullName email avatarUrl")
    .populate("creator", "fullName email avatarUrl")
    .populate("epic", "name status")
    .populate("taskType", "name icon color")
    .populate("labels", "name color")
    .sort({ order: 1, createdAt: 1 });

  return tasks.map(taskResponse);
};

// --- Subtasks ---
const createSubtask = async (parentTaskId, taskData, userId) => {
  const parentTask = await Task.findById(parentTaskId);
  if (!parentTask) {
    throw new Error("Công việc cha không tồn tại");
  }

  const project = await Project.findById(parentTask.project);
  if (!includesId(project.members, userId)) {
    throw new Error("Bạn không có quyền tạo công việc con trong dự án này");
  }

  // Lấy trạng thái mặc định cho subtask nếu không gửi lên
  let finalStatus = taskData.status || "Cần làm";
  if (!taskData.status) {
    const statuses = await workflowService.getStatusesByProject(
      parentTask.project,
    );
    if (statuses.length > 0) {
      finalStatus = statuses[0].name;
    }
  }

  const subtask = await Task.create({
    ...taskData,
    status: finalStatus,
    project: parentTask.project,
    parentTask: parentTaskId,
    creator: userId,
  });

  return taskResponse(subtask);
};

const getSubtasks = async (parentTaskId, userId) => {
  const parentTask = await Task.findById(parentTaskId).populate("project");
  if (!parentTask) {
    throw new Error("Công việc không tồn tại");
  }

  if (!includesId(parentTask.project.members, userId)) {
    throw new Error("Bạn không có quyền xem công việc con của task này");
  }

  const subtasks = await Task.find({ parentTask: parentTaskId })
    .populate("assignee", "fullName email avatarUrl")
    .populate("taskType", "name icon color")
    .populate("labels", "name color");

  return subtasks.map(taskResponse);
};

// --- Attachments ---
const uploadAttachment = async (taskId, fileData, userId) => {
  const task = await Task.findById(taskId).populate("project");
  if (!task) {
    throw new Error("Công việc không tồn tại");
  }

  if (!includesId(task.project.members, userId)) {
    throw new Error("Bạn không có quyền upload tài liệu cho công việc này");
  }

  const attachment = await Attachment.create({
    task: taskId,
    fileName: fileData.originalname,
    fileUrl: `/uploads/attachments/${fileData.filename}`,
    uploadedBy: userId,
  });

  return attachment;
};

const getAttachments = async (taskId, userId) => {
  const task = await Task.findById(taskId).populate("project");
  if (!task) {
    throw new Error("Công việc không tồn tại");
  }

  if (!includesId(task.project.members, userId)) {
    throw new Error("Bạn không có quyền xem tài liệu của công việc này");
  }

  return Attachment.find({ task: taskId }).populate(
    "uploadedBy",
    "fullName email",
  );
};

const deleteAttachment = async (taskId, attachmentId, userId) => {
  const attachment = await Attachment.findById(attachmentId);
  if (!attachment) {
    throw new Error("Tài liệu không tồn tại");
  }

  const task = await Task.findById(taskId).populate("project");
  if (!includesId(task.project.members, userId)) {
    throw new Error("Bạn không có quyền xóa tài liệu của công việc này");
  }

  await Attachment.findByIdAndDelete(attachmentId);
  // Lưu ý: Trong thực tế nên xóa cả file vật lý trong thư mục uploads
  return { message: "Xóa tài liệu thành công" };
};

module.exports = {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  deleteTask,
  getBacklogByProject,
  createSubtask,
  getSubtasks,
  uploadAttachment,
  getAttachments,
  deleteAttachment,
};
