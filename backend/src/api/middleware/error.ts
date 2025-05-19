import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../core/error';
import logger from '../../config/logger';

/**
 * Global error handler middleware
 * Processes all errors and returns appropriate responses
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction // Express requires this parameter for error handling middleware
) => {
  // Log the error
  logger.error(`${req.method} ${req.url} - ${err.message}`);
  
  // Check if it's an operational error (known application error)
  if (err instanceof AppError) {
    // Return structured response for known errors
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: (err as any).errors,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const message = 'Erro de validação';
    const errors = Object.values((err as any).errors).map((val: any) => val.message);
    
    return res.status(400).json({
      success: false,
      message,
      errors,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido. Por favor, faça login novamente.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado. Por favor, faça login novamente.',
    });
  }

  // MongoDB duplicate key error
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `O valor do campo ${field} já está em uso.`,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  // Cast error (e.g., invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Valor inválido para o campo ${(err as any).path}: ${(err as any).value}`,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  // Default: Internal server error
  return res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

/**
 * Middleware for handling 404 errors
 * This should be placed after all other routes
 */
export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  const error = new AppError(`Rota não encontrada - ${req.originalUrl}`, 404);
  next(error);
};

export default {
  errorHandler,
  notFound
};