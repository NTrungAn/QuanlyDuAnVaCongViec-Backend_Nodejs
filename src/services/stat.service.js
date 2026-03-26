const Project = require("../models/Project.model");
const Task = require("../models/Task.model");

const getProjectStats = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Dự án không tồn tại");
  }

  if (!project.members.includes(userId)) {
    throw new Error("Bạn không có quyền xem thống kê dự án này");
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

  tasks.forEach((task) => {
    if (statusCounts[task.status] !== undefined) statusCounts[task.status]++;
    if (priorityCounts[task.priority] !== undefined)
      priorityCounts[task.priority]++;
  });

  const completionPercentage =
    totalTasks > 0 ? Math.round((statusCounts.DONE / totalTasks) * 100) : 0;

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

  assignedTasks.forEach((task) => {
    if (statusCounts[task.status] !== undefined) statusCounts[task.status]++;
  });

  // Lấy các dự án sắp kết thúc (trong 7 ngày tới)
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingDeadlines = await Project.find({
    members: userId,
    endDate: { $gte: now, $lte: nextWeek },
  }).select("name endDate");

  return {
    totalProjects,
    totalAssignedTasks,
    assignedTaskStatus: statusCounts,
    upcomingDeadlines,
  };
};

const getMemberPerformanceReport = async (projectId, userId) => {
  const project = await Project.findById(projectId).populate(
    "members",
    "fullName email avatarUrl",
  );
  if (!project) {
    throw new Error("Dự án không tồn tại");
  }

  // Chỉ chủ sở hữu dự án hoặc người quản lý mới xem được báo cáo hiệu suất chi tiết
  if (project.owner.toString() !== userId.toString()) {
    throw new Error("Bạn không có quyền xem báo cáo hiệu suất của dự án này");
  }

  const tasks = await Task.find({ project: projectId });

  const memberStats = project.members.map((member) => {
    const memberTasks = tasks.filter(
      (t) => t.assignee && t.assignee.toString() === member._id.toString(),
    );

    const statusCounts = {
      TODO: 0,
      IN_PROGRESS: 0,
      REVIEW: 0,
      DONE: 0,
    };

    memberTasks.forEach((task) => {
      if (statusCounts[task.status] !== undefined) statusCounts[task.status]++;
    });

    return {
      memberId: member._id,
      fullName: member.fullName,
      email: member.email,
      totalTasks: memberTasks.length,
      statusCounts,
      completionRate:
        memberTasks.length > 0
          ? Math.round((statusCounts.DONE / memberTasks.length) * 100)
          : 0,
    };
  });

  return {
    projectName: project.name,
    memberStats,
  };
};

const getProjectTimelineReport = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Dự án không tồn tại");
  }

  if (!project.members.includes(userId)) {
    throw new Error("Bạn không có quyền xem báo cáo này");
  }

  // Thống kê số lượng công việc được tạo theo ngày trong 30 ngày qua
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const timelineStats = await Task.aggregate([
    {
      $match: {
        project: project._id,
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    projectName: project.name,
    startDate: project.startDate,
    endDate: project.endDate,
    timelineStats,
  };
};

module.exports = {
  getProjectStats,
  getUserDashboardStats,
  getMemberPerformanceReport,
  getProjectTimelineReport,
};
