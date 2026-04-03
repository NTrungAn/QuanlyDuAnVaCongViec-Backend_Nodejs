const Joi = require('joi');

const createTaskTypeSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().trim().messages({
    'string.empty': 'Tên loại công việc không được để trống',
    'any.required': 'Tên loại công việc là bắt buộc'
  }),
  description: Joi.string().max(200).allow('', null).trim(),
  icon: Joi.string().max(100).allow('', null).trim(),
  color: Joi.string().regex(/^#[0-9A-Fa-f]{6}$/).allow('', null).messages({
    'string.pattern.base': 'Mã màu phải ở định dạng HEX (ví dụ: #FF0000)'
  })
});

const updateTaskTypeSchema = Joi.object({
  name: Joi.string().min(2).max(50).trim(),
  description: Joi.string().max(200).allow('', null).trim(),
  icon: Joi.string().max(100).allow('', null).trim(),
  color: Joi.string().regex(/^#[0-9A-Fa-f]{6}$/).allow('', null)
});

module.exports = {
  createTaskTypeSchema,
  updateTaskTypeSchema
};
