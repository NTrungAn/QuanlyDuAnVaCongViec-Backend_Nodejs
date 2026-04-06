const Project = require("../models/Project.model");
const Task = require("../models/Task.model");
const TaskStatus = require("../models/TaskStatus.model");

const getProjectStats = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Dự án không tồn tại");
  }

  if (!project.members.includes(userId)) {
    throw new Error("Bạn không có quyền xem thống kê dự án này");
  }

  const [tasks, statuses] = await Promise.all([
    Task.find({ project: projectId }),
    TaskStatus.find({ project: projectId }).sort({ order: 1 })
  ]);

  const totalTasks = tasks.length;
  const statusCounts = {};
  const priorityCounts = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    URGENT: 0,
  };

  tasks.forEach((task) => {
    // Thống kê trạng thái động (theo tên)
    statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    
    // Thống kê ưu tiên cố định
    if (priorityCounts[task.priority] !== undefined)
      priorityCounts[task.priority]++;
  });

  // Tính phần trăm hoàn thành dựa trên danh mục "DONE" của trạng thái
  const doneStatusNames = statuses
    .filter(s => s.category === "DONE")
    .map(s => s.name);
    
  let doneCount = 0;
  doneStatusNames.forEach(name => {
    doneCount += (statusCounts[name] || 0);
  });

  const completionPercentage =
    totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  return {
    projectName: project.name,
    totalTasks,
    statusCounts,
    statuses, // Gửi kèm metadata trạng thái để frontend render màu sắc
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

  // Lấy tất cả TaskStatus của các dự án liên quan để phân loại
  const projectIds = projects.map(p => p._id);
  const allStatuses = await TaskStatus.find({ project: { $in: projectIds } });
  
  // Tạo bản đồ Name -> Category
  const statusToCategory = {};
  allStatuses.forEach(s => {
    statusToCategory[s.name] = s.category;
  });

  const categoryCounts = {
    TODO: 0,
    IN_PROGRESS: 0,
    REVIEW: 0, // REVIEW có thể map vào IN_PROGRESS hoặc category riêng nếu có
    DONE: 0,
  };

  assignedTasks.forEach((task) => {
    const category = statusToCategory[task.status] || "TODO";
    if (categoryCounts[category] !== undefined) {
      categoryCounts[category]++;
    } else if (category === "TODO" || category === "IN_PROGRESS" || category === "DONE") {
      categoryCounts[category]++;
    } else {
      // Fallback
      categoryCounts.TODO++;
    }
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
    assignedTaskStatus: categoryCounts,
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

  // Chỉ chủ sở hữu dự án mới xem được báo cáo hiệu suất chi tiết
  const isOwner = project.owner.toString() === userId.toString();
  if (!isOwner) {
    throw new Error("Bạn không có quyền xem báo cáo hiệu suất của dự án này");
  }

  const [tasks, statuses] = await Promise.all([
    Task.find({ project: projectId }),
    TaskStatus.find({ project: projectId })
  ]);

  const memberStats = project.members.map((member) => {
    const memberTasks = tasks.filter(
      (t) => t.assignee && t.assignee.toString() === member._id.toString(),
    );

    const statusCounts = {};

    memberTasks.forEach((task) => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    });

    // Tính tỷ lệ hoàn thành dựa trên các trạng thái thuộc category DONE
    const doneStatusNames = statuses
      .filter(s => s.category === "DONE")
      .map(s => s.name);
    
    let doneCount = 0;
    doneStatusNames.forEach(name => {
      doneCount += (statusCounts[name] || 0);
    });

    return {
      memberId: member._id,
      fullName: member.fullName,
      email: member.email,
      totalTasks: memberTasks.length,
      statusCounts,
      completionRate:
        memberTasks.length > 0
          ? Math.round((doneCount / memberTasks.length) * 100)
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
