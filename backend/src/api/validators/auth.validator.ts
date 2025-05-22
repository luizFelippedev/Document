import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Validation error class
export class ValidationError extends Error {
  public errors: Record<string, string>;
  
  constructor(message: string, errors: Record<string, string>) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

// Password pattern: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special char
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Register schema
export const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required()
    .messages({
      'string.empty': 'First name is required',
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required',
    }),
  
  lastName: Joi.string().trim().min(2).max(50).required()
    .messages({
      'string.empty': 'Last name is required',
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required',
    }),
  
  email: Joi.string().email().trim().lowercase().required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required',
    }),
  
  password: Joi.string().min(8).pattern(passwordPattern).required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required',
    }),
  
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    .messages({
      'string.empty': 'Please confirm your password',
      'any.only': 'Passwords do not match',
      'any.required': 'Please confirm your password',
    }),
    
  company: Joi.string().trim().max(100).allow('', null).optional(),
  
  position: Joi.string().trim().max(100).allow('', null).optional(),
  
  bio: Joi.string().max(500).allow('', null).optional(),
  
  skills: Joi.array().items(Joi.string().trim()).optional(),
  
  termsAccepted: Joi.boolean().valid(true).required()
    .messages({
      'boolean.base': 'Terms acceptance must be a boolean',
      'any.only': 'You must accept the terms and conditions',
      'any.required': 'You must accept the terms and conditions',
    }),
});

// Login schema
export const loginSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required',
    }),
  
  password: Joi.string().required()
    .messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required',
    }),
    
  remember: Joi.boolean().optional(),
});

// Reset password request schema
export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required',
    }),
});

// Reset password schema
export const resetPasswordSchema = Joi.object({
  token: Joi.string().required()
    .messages({
      'string.empty': 'Token is required',
      'any.required': 'Token is required',
    }),
  
  password: Joi.string().min(8).pattern(passwordPattern).required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required',
    }),
  
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    .messages({
      'string.empty': 'Please confirm your password',
      'any.only': 'Passwords do not match',
      'any.required': 'Please confirm your password',
    }),
});

// Email verification schema
export const verifyEmailSchema = Joi.object({
  token: Joi.string().required()
    .messages({
      'string.empty': 'Verification token is required',
      'any.required': 'Verification token is required',
    }),
});

// Password change schema
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required()
    .messages({
      'string.empty': 'Current password is required',
      'any.required': 'Current password is required',
    }),
  
  newPassword: Joi.string().min(8).pattern(passwordPattern).required()
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'New password is required',
    }),
  
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    .messages({
      'string.empty': 'Please confirm your new password',
      'any.only': 'New passwords do not match',
      'any.required': 'Please confirm your new password',
    }),
});

// TOTP setup schema
export const setupTotpSchema = Joi.object({
  token: Joi.string().length(6).pattern(/^\d{6}$/).required()
    .messages({
      'string.empty': 'TOTP token is required',
      'string.length': 'TOTP token must be 6 digits',
      'string.pattern.base': 'TOTP token must contain only digits',
      'any.required': 'TOTP token is required',
    }),
});

// TOTP verification schema
export const verifyTotpSchema = Joi.object({
  token: Joi.string().length(6).pattern(/^\d{6}$/).required()
    .messages({
      'string.empty': 'TOTP token is required',
      'string.length': 'TOTP token must be 6 digits',
      'string.pattern.base': 'TOTP token must contain only digits',
      'any.required': 'TOTP token is required',
    }),
});

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false,
    });
    
    if (error) {
      const errors: Record<string, string> = {};
      
      error.details.forEach((detail) => {
        const key = detail.path.join('.');
        errors[key] = detail.message;
      });
      
      throw new ValidationError('Validation failed', errors);
    }
    
    // Set the validated (and potentially transformed) data back to req.body
    req.body = value;
    
    next();
  };
};

export default {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  changePasswordSchema,
  setupTotpSchema,
  verifyTotpSchema,
  validate,
  ValidationError,
};