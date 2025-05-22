import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { ValidationError as JoiValidationError } from 'joi';

// Classes de erro customizadas
export class AppError extends Error {
  readonly status: string;
  readonly isOperational: boolean;
  readonly statusCode: number;
  
  constructor(
    message: string, 
    statusCode: number, 
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Fábrica de classes de erro
const createErrorClass = (defaultCode: number, defaultMessage: string) => 
  class extends AppError {
    constructor(message: string = defaultMessage, statusCode: number = defaultCode) {
      super(message, statusCode);
    }
  };

export const BadRequestError = createErrorClass(400, 'Requisição inválida');
export const UnauthorizedError = createErrorClass(401, 'Não autorizado');
export const ForbiddenError = createErrorClass(403, 'Acesso negado');
export const NotFoundError = createErrorClass(404, 'Recurso não encontrado');
export const ConflictError = createErrorClass(409, 'Conflito de recursos');
export const UnprocessableEntityError = createErrorClass(422, 'Entidade não processável');
export const TooManyRequestsError = createErrorClass(429, 'Muitas requisições');
export const InternalServerError = createErrorClass(500, 'Erro interno do servidor');

// Erro de validação especializado
export class ValidationError extends AppError {
  public errors: Record<string, string>;
  
  constructor(message: string = 'Erro de validação', errors: Record<string, string> = {}) {
    super(message, 422);
    this.errors = errors;
  }
}

// Handler central de erros
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = { ...err } as any;
  error.message = err.message;
  
  // Log do erro
  const logMessage = `${req.method} ${req.originalUrl} - ${err.message} - IP: ${req.ip} - User: ${(req as any).user?.email || 'anonymous'}`;
  
  if (err instanceof AppError && err.statusCode < 500) {
    logger.warn(logMessage);
  } else {
    logger.error(logMessage);
    logger.error(err.stack);
  }
  
  // Resposta de erro padronizada
  const errorResponse: {
    status: string;
    message: string;
    errors?: Record<string, string>;
    stack?: string;
    code?: string;
    timestamp: string;
    path: string;
  } = {
    status: 'error',
    message: 'Erro interno do servidor',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };
  
  let statusCode = 500;
  
  // Processar tipos específicos de erro
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorResponse.status = err.status;
    errorResponse.message = err.message;
    
    if (err instanceof ValidationError) {
      errorResponse.errors = err.errors;
    }
  } else if (err instanceof JoiValidationError) {
    statusCode = 422;
    errorResponse.status = 'fail';
    errorResponse.message = 'Dados de entrada inválidos';
    errorResponse.errors = {};
    
    err.details.forEach(detail => {
      const key = detail.path.join('.');
      errorResponse.errors![key] = detail.message;
    });
  } else if (err.name === 'CastError') {
    statusCode = 400;
    errorResponse.status = 'fail';
    errorResponse.message = 'Formato de dados inválido';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorResponse.status = 'fail';
    errorResponse.message = 'Token inválido';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorResponse.status = 'fail';
    errorResponse.message = 'Token expirado';
  } else if ((err as any).code === 11000) {
    statusCode = 409;
    errorResponse.status = 'fail';
    errorResponse.message = 'Dados duplicados';
    errorResponse.code = 'DUPLICATE_KEY';
  }
  
  // Não expor stack trace em produção
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }
  
  // Rate limiting específico para errors 500
  if (statusCode === 500) {
    // Implementar circuit breaker ou alertas aqui
  }
  
  res.status(statusCode).json(errorResponse);
};

// Async handler melhorado
export const asyncHandler = (fn: Function) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error: Error) => {
      // Adicionar contexto do request ao erro
      if (error instanceof AppError) {
        error.message = `${error.message} [${req.method} ${req.originalUrl}]`;
      }
      next(error);
    });
  };

// Handler para rotas não encontradas
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new NotFoundError(`Rota não encontrada: ${req.method} ${req.originalUrl}`));
};

// Handler para shutdown graceful
export const gracefulShutdownHandler = (server: any) => {
  const shutdown = (signal: string) => {
    logger.info(`Recebido ${signal}. Encerrando servidor graciosamente...`);
    
    server.close(() => {
      logger.info('Servidor HTTP encerrado');
      
      // Fechar conexões do banco de dados
      require('../config/db').getMongoose().connection.close(() => {
        logger.info('Conexão MongoDB encerrada');
        process.exit(0);
      });
    });
    
    // Forçar encerramento após 30 segundos
    setTimeout(() => {
      logger.error('Forçando encerramento...');
      process.exit(1);
    }, 30000);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

export default {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  TooManyRequestsError,
  InternalServerError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
  gracefulShutdownHandler,
};