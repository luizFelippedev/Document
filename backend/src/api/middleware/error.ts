import { Request, Response, NextFunction } from 'express';
import logger from '@/config/logger';

// Custom error class with status code
export class AppError extends Error {
  readonly status: string;
  
  constructor(
    readonly message: string, 
    readonly statusCode: number, 
    readonly isOperational: boolean = true
  ) {
    super(message);
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error factory for common error types
const createErrorClass = (defaultCode: number, defaultMessage: string) => 
  class extends AppError {
    constructor(message: string = defaultMessage) {
      super(message, defaultCode);
    }
  };

export const BadRequestError = createErrorClass(400, 'Bad request');
export const UnauthorizedError = createErrorClass(401, 'Unauthorized');
export const ForbiddenError = createErrorClass(403, 'Forbidden');
export const NotFoundError = createErrorClass(404, 'Resource not found');
export const ConflictError = createErrorClass(409, 'Resource already exists');
export const RateLimitError = createErrorClass(429, 'Too many requests');
export const ServerError = createErrorClass(500, 'Internal server error');

// Validation error needs special handling for errors object
export class ValidationError extends AppError {
  constructor(message: string = 'Validation error', readonly errors: Record<string, any> = {}) {
    super(message, 422);
  }
}

// Central error handler middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default error response with minimal information in production
  const errorResponse: {
    status: string;
    message: string;
    errors?: Record<string, any>;
    stack?: string;
    code?: string;
    details?: string;
  } = {
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred while processing your request.' 
      : 'Something went wrong'
  };
  
  let statusCode = 500;
  let logDetails = '';
  
  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorResponse.status = err.status;
    errorResponse.message = err.message;
    
    if (err instanceof ValidationError && Object.keys(err.errors).length) {
      errorResponse.errors = err.errors;
    }
    
    logDetails = err.message;
  } 
  // Handle specific error types
  else {
    const { name } = err;
    const errorObj = err as any;
    
    switch(true) {
      case name === 'ValidationError' && 'errors' in errorObj:
        statusCode = 422;
        errorResponse.status = 'fail';
        errorResponse.message = 'Validation error';
        errorResponse.errors = errorObj.errors;
        logDetails = JSON.stringify(errorObj.errors);
        break;
        
      case name === 'CastError':
        statusCode = 400;
        errorResponse.status = 'fail';
        errorResponse.message = 'Invalid data format';
        if (process.env.NODE_ENV !== 'production') {
          errorResponse.details = `Invalid ${errorObj.path}: ${errorObj.value}`;
        }
        logDetails = `Invalid ${errorObj.path}: ${errorObj.value}`;
        break;
        
      case name === 'JsonWebTokenError':
        statusCode = 401;
        errorResponse.status = 'fail';
        errorResponse.message = 'Authentication failed. Please log in again.';
        logDetails = 'JWT error: ' + err.message;
        break;
        
      case name === 'TokenExpiredError':
        statusCode = 401;
        errorResponse.status = 'fail';
        errorResponse.message = 'Your session has expired. Please log in again.';
        logDetails = 'Token expired';
        break;
        
      case errorObj.code === 11000:
        statusCode = 409;
        errorResponse.status = 'fail';
        errorResponse.message = 'This item already exists.';
        errorResponse.code = 'DUPLICATE_KEY';
        
        if (process.env.NODE_ENV !== 'production') {
          const field = Object.keys(errorObj.keyValue)[0];
          errorResponse.details = `${field} already exists`;
        }
        
        logDetails = `Duplicate key: ${JSON.stringify(errorObj.keyValue)}`;
        break;
      
      default:
        errorResponse.message = process.env.NODE_ENV === 'production' 
          ? 'An error occurred while processing your request.' 
          : err.message;
        logDetails = err.message;
    }
  }
  
  // Add stack trace in non-production
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }
  
  // Log the error with appropriate level based on status code
  const logMessage = `${statusCode} - ${logDetails || errorResponse.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`;
  if (statusCode >= 500) {
    logger.error(logMessage);
    logger.error(err.stack);
  } else {
    logger.warn(logMessage);
  }
  
  // Send response
  res.status(statusCode).json(errorResponse);
};

// Async handler to avoid try/catch repetition
export const asyncHandler = (fn: Function) => 
  (req: Request, res: Response, next: NextFunction) => 
    Promise.resolve(fn(req, res, next)).catch(next);

// Not found handler
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => 
  next(new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`));

export default {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  ServerError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
};