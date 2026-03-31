const commentService = require('../services/comment.service');

const createComment = async (req, res) => {
  try {
    const comment = await commentService.createComment(req.body, req.user._id);
    return res.status(201).json(comment);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getCommentsByTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const comments = await commentService.getCommentsByTask(taskId, req.user._id);
    return res.status(200).json(comments);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const comment = await commentService.updateComment(commentId, content, req.user._id);
    return res.status(200).json(comment);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const result = await commentService.deleteComment(commentId, req.user._id);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createComment,
  getCommentsByTask,
  updateComment,
  deleteComment,
};
