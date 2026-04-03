const Joi = require('joi');

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
  'string.pattern.base': 'ID không hợp lệ',
});

const createSprintSchema = Joi.object({
  name: Joi.string().min(3).max(100).trim().required().messages({
    'string.empty': 'Tên sprint không được để trống',
    'string.min': 'Tên sprint phải có ít nhất {#limit} ký tự',
    'any.required': 'Tên sprint là bắt buộc',
  }),
  goal: Joi.string().max(500).allow('', null).trim(),
  startDate: Joi.date().iso().required().messages({
    'any.required': 'Ngày bắt đầu sprint là bắt buộc',
  }),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required().messages({
    'date.min': 'Ngày kết thúc sprint phải sau hoặc bằng ngày bắt đầu',
    'any.required': 'Ngày kết thúc sprint là bắt buộc',
  }),
  status: Joi.string().valid('PLANNED', 'ACTIVE', 'COMPLETED').default('PLANNED'),
});

const createEpicSchema = Joi.object({
  name: Joi.string().min(3).max(120).trim().required().messages({
    'string.empty': 'Tên epic không được để trống',
    'string.min': 'Tên epic phải có ít nhất {#limit} ký tự',
    'any.required': 'Tên epic là bắt buộc',
  }),
  description: Joi.string().max(1000).allow('', null).trim(),
  status: Joi.string().valid('PLANNING', 'IN_PROGRESS', 'DONE').default('PLANNING'),
});

const updateEpicSchema = Joi.object({
  name: Joi.string().min(3).max(120).trim().messages({
    'string.empty': 'Tên epic không được để trống',
    'string.min': 'Tên epic phải có ít nhất {#limit} ký tự',
  }),
  description: Joi.string().max(1000).allow('', null).trim(),
  status: Joi.string().valid('PLANNING', 'IN_PROGRESS', 'DONE'),
});

const updateSprintSchema = Joi.object({
  name: Joi.string().min(3).max(100).trim().messages({
    'string.empty': 'Tên sprint không được để trống',
    'string.min': 'Tên sprint phải có ít nhất {#limit} ký tự',
  }),
  goal: Joi.string().max(500).allow('', null).trim(),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().messages({
    'date.min': 'Ngày kết thúc sprint phải sau hoặc bằng ngày bắt đầu',
  }),
  status: Joi.string().valid('PLANNED', 'ACTIVE', 'COMPLETED'),
});

const linkTaskSchema = Joi.object({
  taskId: objectId.required().messages({
    'any.required': 'taskId là bắt buộc',
  }),
});

module.exports = {
  createSprintSchema,
  createEpicSchema,
  linkTaskSchema,
  updateEpicSchema,
  updateSprintSchema,
};
