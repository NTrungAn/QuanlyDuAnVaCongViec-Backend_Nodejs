const Joi = require('joi');

/**
 * Validator cho Đăng nhập (Tương đương LoginRequest DTO)
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Email không đúng định dạng',
      'any.required': 'Email là trường bắt buộc',
      'string.empty': 'Email không được để trống'
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Mật khẩu phải có ít nhất {#limit} ký tự',
      'any.required': 'Mật khẩu không được để trống',
      'string.empty': 'Mật khẩu không được để trống'
    })
});

/**
 * Validator cho Đăng ký (Tương đương RegisterRequest DTO)
 */
const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Email không đúng định dạng',
      'any.required': 'Email là bắt buộc'
    }),

  password: Joi.string()
    .min(6)
    .max(30)
    .required()
    .messages({
      'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
      'string.max': 'Mật khẩu không được quá 30 ký tự',
      'any.required': 'Mật khẩu là bắt buộc'
    }),

  fullName: Joi.string()
    .min(3)
    .max(50)
    .required()
    .trim()
    .messages({
      'string.min': 'Họ tên phải có ít nhất 3 ký tự',
      'any.required': 'Họ tên là bắt buộc',
      'string.empty': 'Họ tên không được để trống'
    })
});

// Xuất các schema ra để sử dụng trong Controller
module.exports = {
  loginSchema,
  registerSchema
};