import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import hpp from 'hpp';
import { body, validationResult } from 'express-validator';
import xss from 'xss';
import { cacheGet, cacheSet } from '../../config/redis';
import logger from '../../config/logger';
import { TooManyRequestsError, ValidationError } from '../../core/error';

// Rate limiting principal
export const mainRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP por janela
  message: {
    status: 'error',
    message: 'Muitas requisições deste IP. Tente novamente em 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit excedido para IP: ${req.ip} - ${req.originalUrl}`);
    throw new TooManyRequestsError('Rate limit excedido');
  },
});

// Speed limiting para requisições pesadas
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutos
  delayAfter: 50, // após 50 requests
  delayMs: 500, // adicionar 500ms de delay
  maxDelayMs: 20000, // máximo 20 segundos de delay
});

// Rate limiting para APIs sensíveis
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    status: 'error',
    message: 'Muitas tentativas. Tente novamente mais tarde.',
  },
});

// Configuração do Helmet
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Proteção contra HTTP Parameter Pollution
export const hppProtection = hpp({
  whitelist: ['tags', 'technologies', 'skills', 'collaborators'],
});

// Sanitização XSS
export const xssProtection = (req: Request, res: Response, next: NextFunction): void => {
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return xss(obj, {
        whiteList: {}, // Não permitir tags HTML
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script'],
      });
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  };
  
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

// Validação de entrada para rotas críticas
export const validateInput = [
  body('*').customSanitizer((value) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  }),
  
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMap: Record<string, string> = {};
      errors.array().forEach(error => {
        if (error.type === 'field') {
          errorMap[error.path] = error.msg;
        }
      });
      throw new ValidationError('Dados de entrada inválidos', errorMap);
    }
    next();
  },
];

// Middleware para detectar tentativas de SQL injection
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction): void => {
  const suspiciousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(--|\;|\||\/\*|\*\/)/,
    /(\b(OR|AND)\s+\w+\s*=\s*\w+)/i,
  ];
  
  const checkValue = (value: any, path: string = ''): void => {
    if (typeof value === 'string') {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(value)) {
          logger.warn(`Possível SQL injection detectado: ${path} - ${req.ip} - ${value}`);
          throw new ValidationError('Entrada suspeita detectada');
        }
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => checkValue(item, `${path}[${index}]`));
    } else if (value && typeof value === 'object') {
      Object.keys(value).forEach(key => checkValue(value[key], `${path}.${key}`));
    }
  };
  
  try {
    checkValue(req.body, 'body');
    checkValue(req.query, 'query');
    checkValue(req.params, 'params');
  } catch (error) {
    return next(error);
  }
  
  next();
};

// Middleware para logging de segurança
export const securityLogger = (req: Request, res: Response, next: NextFunction): void => {
  const userAgent = req.get('User-Agent') || 'Unknown';
  const forwarded = req.get('X-Forwarded-For');
  const realIp = forwarded ? forwarded.split(',')[0] : req.ip;
  
  // Log de requisições suspeitas
  const suspiciousPatterns = [
    /bot|crawler|spider/i,
    /sqlmap|nmap|nikto/i,
    /script|javascript|vbscript/i,
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    logger.warn(`Requisição suspeita: ${req.method} ${req.originalUrl} - IP: ${realIp} - UA: ${userAgent}`);
  }
  
  next();
};

// Middleware para prevenção de CSRF
export const csrfProtection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Ignorar para métodos seguros
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  const token = req.headers['x-csrf-token'] as string;
  const sessionToken = req.session?.csrfToken;
  
  if (!token || !sessionToken || token !== sessionToken) {
    logger.warn(`CSRF token inválido: ${req.ip} - ${req.originalUrl}`);
    throw new ValidationError('Token CSRF inválido');
  }
  
  next();
};

// Middleware para detecção de brute force
export const bruteForcePrevention = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const key = `brute_force:${req.ip}:${req.originalUrl}`;
  const maxAttempts = 10;
  const windowMs = 15 * 60 * 1000; // 15 minutos
  
  try {
    const attempts = await cacheGet<number>(key) || 0;
    
    if (attempts >= maxAttempts) {
      logger.warn(`Brute force detectado: ${req.ip} - ${req.originalUrl}`);
      throw new TooManyRequestsError('Muitas tentativas. Tente novamente mais tarde.');
    }
    
    await cacheSet(key, attempts + 1, windowMs / 1000);
    next();
  } catch (error) {
    if (error instanceof TooManyRequestsError) {
      throw error;
    }
    // Se Redis falhar, continuar sem proteção
    next();
  }
};

export default {
  mainRateLimit,
  speedLimiter,
  strictRateLimit,
  helmetConfig,
  hppProtection,
  xssProtection,
  validateInput,
  sqlInjectionProtection,
  securityLogger,
  csrfProtection,
  bruteForcePrevention,
};