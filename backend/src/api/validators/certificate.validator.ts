import Joi from 'joi';
import { validate } from './auth.validator';

// Create certificate schema
export const createCertificateSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required()
    .messages({
      'string.empty': 'Certificate title is required',
      'string.min': 'Certificate title must be at least 3 characters long',
      'string.max': 'Certificate title cannot exceed 200 characters',
      'any.required': 'Certificate title is required',
    }),
  
  description: Joi.string().min(10).max(1000).required()
    .messages({
      'string.empty': 'Certificate description is required',
      'string.min': 'Certificate description must be at least 10 characters long',
      'string.max': 'Certificate description cannot exceed 1000 characters',
      'any.required': 'Certificate description is required',
    }),
  
  recipientId: Joi.string().required()
    .messages({
      'string.empty': 'Recipient ID is required',
      'any.required': 'Recipient ID is required',
    }),
  
  projectId: Joi.string().allow('', null),
  
  expiryDate: Joi.date().iso().min('now').allow('', null)
    .messages({
      'date.base': 'Expiry date must be a valid date',
      'date.min': 'Expiry date must be in the future',
    }),
  
  skillsValidated: Joi.array().items(Joi.string().trim()),
  
  templateId: Joi.string().allow('', null),
  
  metadata: Joi.object().allow(null),
});

// Update certificate schema
export const updateCertificateSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200)
    .messages({
      'string.min': 'Certificate title must be at least 3 characters long',
      'string.max': 'Certificate title cannot exceed 200 characters',
    }),
  
  description: Joi.string().min(10).max(1000)
    .messages({
      'string.min': 'Certificate description must be at least 10 characters long',
      'string.max': 'Certificate description cannot exceed 1000 characters',
    }),
  
  expiryDate: Joi.date().iso().min('now').allow('', null)
    .messages({
      'date.base': 'Expiry date must be a valid date',
      'date.min': 'Expiry date must be in the future',
    }),
  
  skillsValidated: Joi.array().items(Joi.string().trim()),
  
  status: Joi.string().valid('draft', 'issued', 'revoked', 'expired')
    .messages({
      'any.only': 'Status must be one of: draft, issued, revoked, expired',
    }),
  
  metadata: Joi.object().allow(null),
});

// Verify certificate schema
export const verifyCertificateSchema = Joi.object({
  code: Joi.string().required()
    .messages({
      'string.empty': 'Verification code is required',
      'any.required': 'Verification code is required',
    }),
});

// Bulk issue certificates schema
export const bulkIssueCertificatesSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required()
    .messages({
      'string.empty': 'Certificate title is required',
      'string.min': 'Certificate title must be at least 3 characters long',
      'string.max': 'Certificate title cannot exceed 200 characters',
      'any.required': 'Certificate title is required',
    }),
  
  description: Joi.string().min(10).max(1000).required()
    .messages({
      'string.empty': 'Certificate description is required',
      'string.min': 'Certificate description must be at least 10 characters long',
      'string.max': 'Certificate description cannot exceed 1000 characters',
      'any.required': 'Certificate description is required',
    }),
  
  recipients: Joi.array().items(Joi.string()).min(1).required()
    .messages({
      'array.min': 'At least one recipient is required',
      'any.required': 'Recipients are required',
    }),
  
  projectId: Joi.string().allow('', null),
  
  expiryDate: Joi.date().iso().min('now').allow('', null)
    .messages({
      'date.base': 'Expiry date must be a valid date',
      'date.min': 'Expiry date must be in the future',
    }),
  
  skillsValidated: Joi.array().items(Joi.string().trim()),
  
  templateId: Joi.string().allow('', null),
});

// Search certificates schema
export const searchCertificatesSchema = Joi.object({
  status: Joi.string().valid('draft', 'issued', 'revoked', 'expired'),
  
  recipient: Joi.string(),
  
  project: Joi.string(),
  
  search: Joi.string().min(2)
    .messages({
      'string.min': 'Search query must be at least 2 characters long',
    }),
  
  sortBy: Joi.string().valid('issueDate', 'createdAt', 'title').default('issueDate'),
  
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  
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

export default {
  createCertificateSchema,
  updateCertificateSchema,
  verifyCertificateSchema,
  bulkIssueCertificatesSchema,
  searchCertificatesSchema,
  validate,
};