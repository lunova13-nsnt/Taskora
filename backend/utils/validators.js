const Joi = require('joi');

exports.registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('user', 'admin').optional(),
  otp: Joi.string().optional().allow(''),
  otpExpiry: Joi.date().optional().allow(null, ''),
});

exports.loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

exports.taskSchema = Joi.object({
  title: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional().allow(''),
  status: Joi.string().valid('pending', 'in-progress', 'done').optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  dueDate: Joi.date().optional().allow(null, ''),
  tag: Joi.string().max(30).optional().allow(''),
  notes: Joi.string().max(1000).optional().allow(''),
});