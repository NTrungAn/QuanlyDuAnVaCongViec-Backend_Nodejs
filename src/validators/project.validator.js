const Joi = require('joi');

const createProjectSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .required()
    .trim()
    .messages({
      'string.min': 'Tên dự án phải có ít nhất {#limit} ký tự',
      'string.max': 'Tên dự án không được quá {#limit} ký tự',
      'any.required': 'Tên dự án là bắt buộc',
      'string.empty': 'Tên dự án không được để trống'
    }),
  description: Joi.string()
    .max(500)
    .allow('', null)
    .trim(),
  startDate: Joi.date()
    .iso()
    .allow(null),
  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .allow(null)
    .messages({
      'date.min': 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu'
    }),
  status: Joi.string()
    .valid("PLANNING", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "CANCELLED")
    .default("PLANNING"),
  members: Joi.array()
    .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)) // Validate MongoDB ObjectId
    .messages({
      'string.pattern.base': 'ID thành viên không hợp lệ'
    })
});

const updateProjectSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .trim(),
  description: Joi.string()
    .max(500)
    .allow('', null)
    .trim(),
  startDate: Joi.date()
    .iso()
    .allow(null),
  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .allow(null)
    .messages({
      'date.min': 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu'
    }),
  status: Joi.string()
    .valid("PLANNING", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "CANCELLED"),
  members: Joi.array()
    .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
});

module.exports = {
  createProjectSchema,
  updateProjectSchema
};
