const Comment = require('../models/Comment.model');
const Task = require('../models/Task.model');
const Project = require('../models/Project.model');

const commentResponse = (comment) => ({
  id: comment._id,
  content: comment.content,
  task: comment.task,
  user: comment.user,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
});

const createComment = async (commentData, userId) => {
  const task = await Task.findById(commentData.task).populate('project');
  if (!task) {
    throw new Error('Công việc không tồn tại');
  }

  // Kiểm tra user có phải thành viên dự án không
  const project = task.project;
  if (!project.members.includes(userId)) {
    throw new Error('Bạn không có quyền bình luận trong dự án này');
  }

  const comment = await Comment.create({
    ...commentData,
    user: userId,
  });

  return commentResponse(comment);
};

const getCommentsByTask = async (taskId, userId) => {
  const task = await Task.findById(taskId).populate('project');
  if (!task) {
    throw new Error('Công việc không tồn tại');
  }

  const project = task.project;
  if (!project.members.includes(userId)) {
    throw new Error('Bạn không có quyền xem bình luận trong dự án này');
  }

  const comments = await Comment.find({ task: taskId })
    .populate('user', 'fullName email avatarUrl')
    .sort({ createdAt: -1 });
  
  return comments.map(commentResponse);
};

const updateComment = async (commentId, content, userId) => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new Error('Bình luận không tồn tại');
  }

  if (comment.user.toString() !== userId.toString()) {
    throw new Error('Bạn không có quyền cập nhật bình luận này');
  }

  comment.content = content;
  await comment.save();
  return commentResponse(comment);
};

const deleteComment = async (commentId, userId) => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new Error('Bình luận không tồn tại');
  }

  if (comment.user.toString() !== userId.toString()) {
    throw new Error('Bạn không có quyền xóa bình luận này');
  }

  await Comment.findByIdAndDelete(commentId);
  return { message: 'Xóa bình luận thành công' };
};

module.exports = {
  createComment,
  getCommentsByTask,
  updateComment,
  deleteComment,
};
