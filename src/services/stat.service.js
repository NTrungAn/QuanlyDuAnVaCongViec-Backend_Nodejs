const Project = require('../models/Project.model');
const Task = require('../models/Task.model');

const getProjectStats = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error('Dự án không tồn tại');
  }

  if (!project.members.includes(userId)) {
    throw new Error('Bạn không có quyền xem thống kê dự án này');
  }

  const tasks = await Task.find({ project: projectId });
  
  const totalTasks = tasks.length;
  const statusCounts = {
    TODO: 0,
    IN_PROGRESS: 0,
    REVIEW: 0,
    DONE: 0,
  };

  const priorityCounts = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    URGENT: 0,
  };

  tasks.forEach(task => {
    if (statusCounts[task.status] !== undefined) statusCounts[task.status]++;
    if (priorityCounts[task.priority] !== undefined) priorityCounts[task.priority]++;
  });

  const completionPercentage = totalTasks > 0 
    ? Math.round((statusCounts.DONE / totalTasks) * 100) 
    : 0;

  return {
    projectName: project.name,
    totalTasks,
    statusCounts,
    priorityCounts,
    completionPercentage,
    memberCount: project.members.length,
  };
};

const getUserDashboardStats = async (userId) => {
  // Dự án người dùng tham gia
  const projects = await Project.find({ members: userId });
  const totalProjects = projects.length;

  // Công việc được giao cho người dùng
  const assignedTasks = await Task.find({ assignee: userId });
  const totalAssignedTasks = assignedTasks.length;

  const statusCounts = {
    TODO: 0,
    IN_PROGRESS: 0,
    REVIEW: 0,
    DONE: 0,
  };

  assignedTasks.forEach(task => {
    if (statusCounts[task.status] !== undefined) statusCounts[task.status]++;
  });

  // Lấy các dự án sắp kết thúc (trong 7 ngày tới)
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingDeadlines = await Project.find({
    members: userId,
    endDate: { $gte: now, $lte: nextWeek }
  }).select('name endDate');

  return {
    totalProjects,
    totalAssignedTasks,
    assignedTaskStatus: statusCounts,
    upcomingDeadlines,
  };
};

module.exports = {
  getProjectStats,
  getUserDashboardStats,
};
