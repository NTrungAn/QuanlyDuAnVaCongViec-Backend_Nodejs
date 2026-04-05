const Joi = require('joi');

const createTaskSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(200)
    .required()
    .trim()
    .messages({
      'string.min': 'Tiêu đề công việc phải có ít nhất {#limit} ký tự',
      'string.max': 'Tiêu đề công việc không được quá {#limit} ký tự',
      'any.required': 'Tiêu đề công việc là bắt buộc',
      'string.empty': 'Tiêu đề công việc không được để trống'
    }),
  description: Joi.string()
    .max(1000)
    .allow('', null)
    .trim(),
  status: Joi.string()
    .allow('', null),
  priority: Joi.string()
    .valid("LOW", "MEDIUM", "HIGH", "URGENT")
    .default("MEDIUM"),
  dueDate: Joi.date()
    .iso()
    .allow(null),
  project: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'ID dự án không hợp lệ',
      'any.required': 'Dự án là bắt buộc'
    }),
  assignee: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .allow(null, "")
    .messages({
      'string.pattern.base': 'ID người thực hiện không hợp lệ'
    }),
  sprint: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .allow(null, ""),
  epic: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .allow(null, ""),
  taskType: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .allow(null, ""),
  labels: Joi.array().items(
    Joi.string().regex(/^[0-9a-fA-F]{24}$/)
  ).default([]),
  parentTask: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .allow(null, ""),
});

const updateTaskSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(200)
    .trim(),
  description: Joi.string()
    .max(1000)
    .allow('', null)
    .trim(),
  status: Joi.string()
    .allow('', null),
  priority: Joi.string()
    .valid("LOW", "MEDIUM", "HIGH", "URGENT"),
  dueDate: Joi.date()
    .iso()
    .allow(null, ""),
  assignee: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .allow(null, ""),
  sprint: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .allow(null, ""),
  epic: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .allow(null, ""),
  taskType: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .allow(null, ""),
  labels: Joi.array().items(
    Joi.string().regex(/^[0-9a-fA-F]{24}$/)
  ),
  parentTask: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .allow(null, ""),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema
};