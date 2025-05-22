// 4.2 - src/core/error.ts - CORREÇÃO COMPLETA
import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const BadRequestError = class extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
};

export const UnauthorizedError = class extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
};

export const ForbiddenError = class extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
};

export const NotFoundError = class extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
};

export const ConflictError = class extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
};

export const ValidationError = class extends AppError {
  public errors: Record<string, string>;
  
  constructor(message = 'Validation error', errors: Record<string, string> = {}) {
    super(message, 422);
    this.errors = errors;
  }
};

export const TooManyRequestsError = class extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
  }
};

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = { ...err } as any;
  error.message = err.message;

  // Log error
  if (err instanceof AppError && err.statusCode < 500) {
    logger.warn(`${req.method} ${req.originalUrl} - ${err.message}`);
  } else {
    logger.error(`${req.method} ${req.originalUrl} - ${err.message}`);
    if (err.stack) logger.error(err.stack);
  }

  // Default error response
  const errorResponse: any = {
    status: 'error',
    message: 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };

  let statusCode = 500;

  // Handle different error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorResponse.status = err.status;
    errorResponse.message = err.message;
    
    if (err instanceof ValidationError) {
      errorResponse.errors = err.errors;
    }
  } else if (err.name === 'CastError') {
    statusCode = 400;
    errorResponse.status = 'fail';
    errorResponse.message = 'Invalid data format';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorResponse.status = 'fail';
    errorResponse.message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorResponse.status = 'fail';
    errorResponse.message = 'Token expired';
  } else if ((err as any).code === 11000) {
    statusCode = 409;
    errorResponse.status = 'fail';
    errorResponse.message = 'Duplicate resource';
  }

  // Don't expose stack trace in production
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export const asyncHandler = (fn: Function) => 
  (req: Request, res: Response, next: NextFunction) => 
    Promise.resolve(fn(req, res, next)).catch(next);

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => 
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));

// 4.3 - src/api/middleware/rateLimiter.ts - CORREÇÃO COMPLETA
import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import redisClient from '../../config/redis';
import logger from '../../config/logger';

class RedisStore {
  prefix: string;
  windowMs: number;

  constructor(options: { prefix?: string; windowMs: number }) {
    this.prefix = options.prefix || 'rate-limit:';
    this.windowMs = options.windowMs;
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime?: Date }> {
    try {
      if (!redisClient.isConnected) {
        return { totalHits: 1 };
      }

      const client = redisClient.getClient();
      const redisKey = `${this.prefix}${key}`;
      
      const totalHits = await client.incr(redisKey);
      
      if (totalHits === 1) {
        await client.expire(redisKey, Math.ceil(this.windowMs / 1000));
      }
      
      const ttl = await client.ttl(redisKey);
      const resetTime = ttl > 0 ? new Date(Date.now() + ttl * 1000) : undefined;
      
      return { totalHits, resetTime };
    } catch (error: any) {
      logger.error(`Rate limiter error: ${error.message}`);
      return { totalHits: 1 };
    }
  }
}

export const createRateLimiter = (
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = 'Too many requests'
) => {
  const store = new RedisStore({ windowMs });

  return rateLimit({
    windowMs,
    max,
    message: { status: 'fail', message },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: Request) => {
      return process.env.NODE_ENV === 'development' && 
             (req.ip === '127.0.0.1' || req.ip === '::1');
    },
    store: {
      increment: (key: string) => store.increment(key),
    } as any,
  });
};

export const authRateLimiter = createRateLimiter(15 * 60 * 1000, 5, 'Too many login attempts');
export const apiRateLimiter = createRateLimiter();
