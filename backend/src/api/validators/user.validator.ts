import Joi from 'joi';
import { validate } from './auth.validator';

// Create/update user schema for admin
export const adminUserSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50)
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
    }),
  
  lastName: Joi.string().trim().min(2).max(50)
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
    }),
  
  email: Joi.string().email().trim().lowercase()
    .messages({
      'string.email': 'Please provide a valid email address',
    }),
  
  role: Joi.string().valid('admin', 'user', 'manager')
    .messages({
      'any.only': 'Role must be one of: admin, user, manager',
    }),
  
  active: Joi.boolean()
    .messages({
      'boolean.base': 'Active status must be a boolean',
    }),
  
  verified: Joi.boolean()
    .messages({
      'boolean.base': 'Verified status must be a boolean',
    }),
  
  company: Joi.string().trim().max(100).allow('', null),
  
  position: Joi.string().trim().max(100).allow('', null),
  
  bio: Joi.string().max(500).allow('', null),
  
  skills: Joi.array().items(Joi.string().trim()),
});

// Update user profile schema
export const updateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50)
    .messages({
      'string.empty': 'First name cannot be empty',
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
    }),
  
  lastName: Joi.string().trim().min(2).max(50)
    .messages({
      'string.empty': 'Last name cannot be empty',
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
    }),
  
  bio: Joi.string().max(500).allow('', null)
    .messages({
      'string.max': 'Bio cannot exceed 500 characters',
    }),
  
  company: Joi.string().trim().max(100).allow('', null)
    .messages({
      'string.max': 'Company name cannot exceed 100 characters',
    }),
  
  position: Joi.string().trim().max(100).allow('', null)
    .messages({
      'string.max': 'Position cannot exceed 100 characters',
    }),
  
  skills: Joi.array().items(Joi.string().trim())
    .messages({
      'array.base': 'Skills must be an array',
    }),
});

// Deactivate account schema
export const deactivateAccountSchema = Joi.object({
  password: Joi.string().required()
    .messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required',
    }),
  
  reason: Joi.string().max(500).allow('', null)
    .messages({
      'string.max': 'Reason cannot exceed 500 characters',
    }),
});

// Search users schema
export const searchUsersSchema = Joi.object({
  query: Joi.string().min(2)
    .messages({
      'string.min': 'Search query must be at least 2 characters long',
    }),
  
  skills: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim()),
    Joi.string().trim()
  ),
  
  page: Joi.number().integer().min(1).default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1',
    }),
  
  limit: Joi.number().integer().min(1).max(100).default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),
});

// Add skill schema
export const addSkillSchema = Joi.object({
  skill: Joi.string().trim().required()
    .messages({
      'string.empty': 'Skill is required',
      'any.required': 'Skill is required',
    }),
});

// Remove skill schema
export const removeSkillSchema = Joi.object({
  skill: Joi.string().trim().required()
    .messages({
      'string.empty': 'Skill is required',
      'any.required': 'Skill is required',
    }),
});

export default {
  adminUserSchema,
  updateProfileSchema,
  deactivateAccountSchema,
  searchUsersSchema,
  addSkillSchema,
  removeSkillSchema,
  validate,
};