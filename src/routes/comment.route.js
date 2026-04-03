const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const { protect, validate } = require('../middlewares/auth.middleware');
const { createCommentSchema, updateCommentSchema } = require('../validators/comment.validator');

router.use(protect);

router.post('/', validate(createCommentSchema), commentController.createComment);
router.get('/task/:taskId', commentController.getCommentsByTask);
router.put('/:commentId', validate(updateCommentSchema), commentController.updateComment);
router.delete('/:commentId', commentController.deleteComment);

module.exports = router;
