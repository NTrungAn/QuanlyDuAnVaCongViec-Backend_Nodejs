const Joi = require('joi');

const createCommentSchema = Joi.object({
  content: Joi.string()
    .min(1)
    .max(1000)
    .required()
    .trim()
    .messages({
      'string.empty': 'Nội dung bình luận không được để trống',
      'any.required': 'Nội dung bình luận là bắt buộc'
    }),
  task: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'ID công việc không hợp lệ',
      'any.required': 'Công việc là bắt buộc'
    })
});

const updateCommentSchema = Joi.object({
  content: Joi.string()
    .min(1)
    .max(1000)
    .required()
    .trim()
});

module.exports = {
  createCommentSchema,
  updateCommentSchema
};
