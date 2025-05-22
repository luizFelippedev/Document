// 4.4 - src/api/middleware/security.ts - CORREÇÃO COMPLETA
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import hpp from 'hpp';
import { body, validationResult } from 'express-validator';
import xss from 'xss';
import logger from '../../config/logger';
import { TooManyRequestsError, ValidationError } from '../../core/error';

export const mainRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { status: 'error', message: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: () => 500,
  maxDelayMs: 20000,
});

export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:", "ws:", "wss:"],
      fontSrc: ["'self'", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

export const hppProtection = hpp({
  whitelist: ['tags', 'skills', 'collaborators'],
});

export const xssProtection = (req: Request, res: Response, next: NextFunction): void => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return xss(obj, { whiteList: {}, stripIgnoreTag: true });
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

export const securityLogger = (req: Request, res: Response, next: NextFunction): void => {
  const userAgent = req.get('User-Agent') || 'Unknown';
  const suspiciousPatterns = [/bot|crawler|spider/i, /sqlmap|nmap/i];
  
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    logger.warn(`Suspicious request: ${req.method} ${req.originalUrl} - ${req.ip}`);
  }
  
  next();
};