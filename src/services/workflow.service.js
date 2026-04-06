const TaskStatus = require("../models/TaskStatus.model");
const Workflow = require("../models/Workflow.model");
const WorkflowStep = require("../models/WorkflowStep.model");

/**
 * Tạo Workflow và các trạng thái mặc định cho một dự án mới
 * @param {Object} project Đối tượng dự án đã tạo
 */
const createDefaultWorkflow = async (project) => {
  // 1. Tạo các trạng thái mặc định
  const defaultStatuses = [
    { name: "Cần làm", category: "TODO", color: "#F4F5F7", order: 0, isDefault: true },
    { name: "Đang làm", category: "IN_PROGRESS", color: "#EAE6FF", order: 1, isDefault: true },
    { name: "Chờ duyệt", category: "IN_PROGRESS", color: "#FFFAE6", order: 2, isDefault: true },
    { name: "Hoàn thành", category: "DONE", color: "#E3FCEF", order: 3, isDefault: true },
  ];

  const createdStatuses = await Promise.all(
    defaultStatuses.map((status) =>
      TaskStatus.create({ ...status, project: project._id })
    )
  );

  // 2. Tạo Workflow chính
  const workflow = await Workflow.create({
    name: `Workflow của ${project.name}`,
    project: project._id,
  });

  // 3. Tạo các bước chuyển đổi mặc định (Tuyến tính: 0 -> 1 -> 2 -> 3)
  // Và cho phép quay lại từ bất kỳ đâu về "Cần làm" hoặc "Đang làm" (tùy chọn đơn giản)
  const steps = [];
  

  // Chuyển tiếp: 0->1, 1->2, 2->3
  for (let i = 0; i < createdStatuses.length - 1; i++) {
    steps.push({
      workflow: workflow._id,
      fromStatus: createdStatuses[i]._id,
      toStatus: createdStatuses[i + 1]._id,
    });
  }

  // Cho phép quay lại trạng thái trước đó
  for (let i = 1; i < createdStatuses.length; i++) {
    steps.push({
      workflow: workflow._id,
      fromStatus: createdStatuses[i]._id,
      toStatus: createdStatuses[i - 1]._id,
    });
  }

  await WorkflowStep.insertMany(steps);

  return { workflow, statuses: createdStatuses };
};

/**
 * Kiểm tra xem một bước chuyển đổi có hợp lệ hay không
 */
const validateTransition = async (projectId, fromStatusName, toStatusName) => {
  const workflow = await Workflow.findOne({ project: projectId });
  if (!workflow) return true; // Nếu không có workflow thì cho phép tất cả (fallback)

  // Map các giá trị cũ sang giá trị mới nếu cần
  const legacyMap = {
    "TODO": "Cần làm",
    "IN_PROGRESS": "Đang làm",
    "REVIEW": "Chờ duyệt",
    "DONE": "Hoàn thành"
  };

  const getMappedName = (name) => legacyMap[name] || name;

  const normalizedFrom = getMappedName(fromStatusName).trim();
  const normalizedTo = getMappedName(toStatusName).trim();

  const fromStatus = await TaskStatus.findOne({ project: projectId, name: normalizedFrom });
  const toStatus = await TaskStatus.findOne({ project: projectId, name: normalizedTo });

  if (!fromStatus || !toStatus) return false;

  const step = await WorkflowStep.findOne({
    workflow: workflow._id,
    fromStatus: fromStatus._id,
    toStatus: toStatus._id,
  });

  return !!step;
};

module.exports = {
  createDefaultWorkflow,
  validateTransition,

  // Task Status CRUD
  getStatusesByProject: async (projectId) => {
    return TaskStatus.find({ project: projectId }).sort({ order: 1 });
  },

  createStatus: async (projectId, statusData) => {
    return TaskStatus.create({ ...statusData, project: projectId });
  },

  updateStatus: async (statusId, updateData) => {
    return TaskStatus.findByIdAndUpdate(statusId, updateData, { returnDocument: 'after' });
  },

  deleteStatus: async (statusId) => {
    // Cần kiểm tra xem có task nào đang dùng status này không? 
    // Tạm thời cho xóa, nhưng thực tế nên có bước migrate task.
    return TaskStatus.findByIdAndDelete(statusId);
  },

  // Workflow CRUD
  getWorkflowByProject: async (projectId) => {
    return Workflow.findOne({ project: projectId });
  },

  updateWorkflow: async (workflowId, name) => {
    return Workflow.findByIdAndUpdate(workflowId, { name }, { returnDocument: 'after' });
  },

  // Workflow Step CRUD
  getWorkflowSteps: async (workflowId) => {
    return WorkflowStep.find({ workflow: workflowId })
      .populate("fromStatus")
      .populate("toStatus");
  },

  createStep: async (stepData) => {
    return WorkflowStep.create(stepData);
  },

  deleteStep: async (stepId) => {
    return WorkflowStep.findByIdAndDelete(stepId);
  },

  setupDefaultWorkflow: async (projectId) => {
    const Project = require("../models/Project.model");
    const project = await Project.findById(projectId);
    if (!project) throw new Error("Dự án không tồn tại");

    // Xóa tất cả các trạng thái và workflow cũ của dự án này để làm sạch
    await Promise.all([
      TaskStatus.deleteMany({ project: projectId }),
      Workflow.deleteMany({ project: projectId }),
      WorkflowStep.deleteMany({ 
        workflow: { $in: await Workflow.find({ project: projectId }).distinct("_id") } 
      })
    ]);

    // Tạo lại từ đầu
    return createDefaultWorkflow(project);
  },
};
