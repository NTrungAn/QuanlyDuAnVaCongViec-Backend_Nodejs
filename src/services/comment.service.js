const Comment = require("../models/Comment.model");
const Task = require("../models/Task.model");
const Project = require("../models/Project.model");
const notificationService = require("./notification.service");

const commentResponse = (comment) => ({
  id: comment._id,
  content: comment.content,
  task: comment.task,
  user: comment.user,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
});

const createComment = async (commentData, userId) => {
  const task = await Task.findById(commentData.task).populate("project");
  if (!task) {
    throw new Error("Công việc không tồn tại");
  }

  // Kiểm tra user có phải thành viên dự án không
  const project = task.project;
  const isMemberOrOwner = project.owner.toString() === userId.toString() || 
                          project.members.some(m => m.toString() === userId.toString());
  if (!isMemberOrOwner) {
    throw new Error("Bạn không có quyền bình luận trong dự án này");
  }

  const comment = await Comment.create({
    ...commentData,
    user: userId,
  });

  // Tăng số lượng bình luận trong task
  await Task.findByIdAndUpdate(commentData.task, { $inc: { commentsCount: 1 } });

  // Gửi thông báo cho chủ dự án, người tạo task và người được giao (nếu khác người bình luận)
  const recipients = new Set();
  if (project.owner.toString() !== userId.toString())
    recipients.add(project.owner.toString());
  if (task.creator.toString() !== userId.toString())
    recipients.add(task.creator.toString());
  if (task.assignee && task.assignee.toString() !== userId.toString())
    recipients.add(task.assignee.toString());

  for (const recipientId of recipients) {
    await notificationService.createNotification({
      recipient: recipientId,
      sender: userId,
      type: "COMMENT_ADDED",
      message: `Có bình luận mới trong công việc: ${task.title}`,
      link: `/tasks/${task._id}`,
    });
  }

  return commentResponse(comment);
};

const getCommentsByTask = async (taskId, userId) => {
  const task = await Task.findById(taskId).populate("project");
  if (!task) {
    throw new Error("Công việc không tồn tại");
  }

  const project = task.project;
  const isMemberOrOwner = project.owner.toString() === userId.toString() || 
                          project.members.some(m => m.toString() === userId.toString());
  if (!isMemberOrOwner) {
    throw new Error("Bạn không có quyền xem bình luận trong dự án này");
  }

  const comments = await Comment.find({ task: taskId })
    .populate("user", "fullName email avatarUrl")
    .sort({ createdAt: -1 });

  return comments.map(commentResponse);
};

const updateComment = async (commentId, content, userId) => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new Error("Bình luận không tồn tại");
  }

  if (comment.user.toString() !== userId.toString()) {
    throw new Error("Bạn không có quyền cập nhật bình luận này");
  }

  comment.content = content;
  await comment.save();
  return commentResponse(comment);
};

const deleteComment = async (commentId, userId) => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new Error("Bình luận không tồn tại");
  }

  if (comment.user.toString() !== userId.toString()) {
    throw new Error("Bạn không có quyền xóa bình luận này");
  }

  await Comment.findByIdAndDelete(commentId);
  
  // Giảm số lượng bình luận trong task
  await Task.findByIdAndUpdate(comment.task, { $inc: { commentsCount: -1 } });

  return { message: "Xóa bình luận thành công" };
};

module.exports = {
  createComment,
  getCommentsByTask,
  updateComment,
  deleteComment,
};
