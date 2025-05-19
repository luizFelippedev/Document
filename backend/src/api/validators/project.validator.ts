import Joi from 'joi';
import { validate } from './auth.validator';

// Create project schema
export const createProjectSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required()
    .messages({
      'string.empty': 'Project name is required',
      'string.min': 'Project name must be at least 3 characters long',
      'string.max': 'Project name cannot exceed 100 characters',
      'any.required': 'Project name is required',
    }),
  
  description: Joi.string().min(10).max(5000).required()
    .messages({
      'string.empty': 'Project description is required',
      'string.min': 'Project description must be at least 10 characters long',
      'string.max': 'Project description cannot exceed 5000 characters',
      'any.required': 'Project description is required',
    }),
  
  category: Joi.string().required()
    .messages({
      'string.empty': 'Project category is required',
      'any.required': 'Project category is required',
    }),
  
  tags: Joi.array().items(Joi.string().trim()).optional(),
  
  visibility: Joi.string().valid('public', 'private', 'team').default('private'),
  
  collaborators: Joi.array().items(Joi.string().trim()).optional(),
  
  startDate: Joi.date().iso().optional().allow(null),
  
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).optional().allow(null)
    .messages({
      'date.greater': 'End date must be after start date',
    }),
    
  aiGenerated: Joi.boolean().default(false),
  
  aiPrompt: Joi.string().max(1000).optional().allow('', null),
});

// Update project schema
export const updateProjectSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).optional()
    .messages({
      'string.min': 'Project name must be at least 3 characters long',
      'string.max': 'Project name cannot exceed 100 characters',
    }),
  
  description: Joi.string().min(10).max(5000).optional()
    .messages({
      'string.min': 'Project description must be at least 10 characters long',
      'string.max': 'Project description cannot exceed 5000 characters',
    }),
  
  category: Joi.string().optional(),
  
  tags: Joi.array().items(Joi.string().trim()).optional(),
  
  visibility: Joi.string().valid('public', 'private', 'team').optional(),
  
  status: Joi.string().valid('draft', 'in-progress', 'review', 'completed', 'archived').optional(),
  
  startDate: Joi.date().iso().optional().allow(null),
  
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).optional().allow(null)
    .messages({
      'date.greater': 'End date must be after start date',
    }),
    
  aiPrompt: Joi.string().max(1000).optional().allow('', null),
});

// Add collaborators schema
export const addCollaboratorsSchema = Joi.object({
  collaborators: Joi.array().items(Joi.string().trim()).min(1).required()
    .messages({
      'array.min': 'At least one collaborator is required',
      'any.required': 'Collaborators are required',
    }),
});

// Remove collaborator schema
export const removeCollaboratorSchema = Joi.object({
  collaboratorId: Joi.string().required()
    .messages({
      'string.empty': 'Collaborator ID is required',
      'any.required': 'Collaborator ID is required',
    }),
});

// Project search schema
export const searchProjectsSchema = Joi.object({
  query: Joi.string().min(2).optional()
    .messages({
      'string.min': 'Search query must be at least 2 characters long',
    }),
  
  category: Joi.string().optional(),
  
  tags: Joi.array().items(Joi.string().trim()).optional(),
  
  status: Joi.string().valid('draft', 'in-progress', 'review', 'completed', 'archived').optional(),
  
  visibility: Joi.string().valid('public', 'private', 'team').optional(),
  
  owner: Joi.string().optional(),
  
  collaborator: Joi.string().optional(),
  
  aiGenerated: Joi.boolean().optional(),
  
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'status').default('createdAt'),
  
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  
  page: Joi.number().integer().min(1).default(1),
  
  limit: Joi.number().integer().min(1).max(100).default(10),
  
  startDate: Joi.date().iso().optional(),
  
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).optional()
    .messages({
      'date.greater': 'End date must be after start date',
    }),
});

// Add project file schema
export const addProjectFileSchema = Joi.object({
  name: Joi.string().trim().required()
    .messages({
      'string.empty': 'File name is required',
      'any.required': 'File name is required',
    }),
});

// Remove project file schema
export const removeProjectFileSchema = Joi.object({
  fileId: Joi.string().required()
    .messages({
      'string.empty': 'File ID is required',
      'any.required': 'File ID is required',
    }),
});

// Set project thumbnail schema
export const setProjectThumbnailSchema = Joi.object({
  fileId: Joi.string().optional(),
  generateFromAi: Joi.boolean().default(false),
  aiPrompt: Joi.string().max(1000).optional(),
})
  .xor('fileId', 'generateFromAi')
  .messages({
    'object.xor': 'Either provide a file ID or set generateFromAi to true',
  });

export default {
  createProjectSchema,
  updateProjectSchema,
  addCollaboratorsSchema,
  removeCollaboratorSchema,
  searchProjectsSchema,
  addProjectFileSchema,
  removeProjectFileSchema,
  setProjectThumbnailSchema,
  validate,
};