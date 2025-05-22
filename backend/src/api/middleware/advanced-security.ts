import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { cacheGet, cacheSet, cacheDelete } from '../../config/redis';
import logger from '../../config/logger';
import { TooManyRequestsError, UnauthorizedError } from '../../core/error';

// Interface para contexto de segurança
interface SecurityContext {
  userId: string;
  sessionId: string;
  deviceFingerprint: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// Detecção de anomalias
class AnomalyDetector {
  // Detectar login de localização suspeita
  async detectSuspiciousLocation(userId: string, ipAddress: string): Promise<boolean> {
    try {
      const cacheKey = `user:${userId}:recent-ips`;
      const recentIPs = await cacheGet<string[]>(cacheKey) || [];
      
      // Se é um IP novo
      if (!recentIPs.includes(ipAddress)) {
        // Adicionar à lista de IPs recentes
        recentIPs.push(ipAddress);
        
        // Manter apenas os últimos 5 IPs
        if (recentIPs.length > 5) {
          recentIPs.shift();
        }
        
        await cacheSet(cacheKey, recentIPs, 7 * 24 * 3600); // 7 dias
        
        // Se é o primeiro IP ou tem mais de 3 IPs diferentes, é suspeito
        return recentIPs.length > 3;
      }
      
      return false;
    } catch (error) {
      logger.error(`Erro na detecção de localização suspeita: ${error}`);
      return false;
    }
  }
  
  // Detectar velocidade de requisições anômala
  async detectAnomalousRequestRate(userId: string): Promise<boolean> {
    try {
      const cacheKey = `user:${userId}:request-rate`;
      const requests = await cacheGet<number[]>(cacheKey) || [];
      const now = Date.now();
      
      // Adicionar timestamp atual
      requests.push(now);
      
      // Remover requests mais antigos que 1 minuto
      const oneMinuteAgo = now - 60 * 1000;
      const recentRequests = requests.filter(timestamp => timestamp > oneMinuteAgo);
      
      await cacheSet(cacheKey, recentRequests, 60);
      
      // Se mais de 100 requests em 1 minuto, é anômalo
      return recentRequests.length > 100;
    } catch (error) {
      logger.error(`Erro na detecção de taxa de requisições: ${error}`);
      return false;
    }
  }
  
  // Detectar padrões de bot
  async detectBotBehavior(req: Request): Promise<boolean> {
    const userAgent = req.get('User-Agent') || '';
    const patterns = [
      /bot|crawler|spider|scraper/i,
      /curl|wget|python|java|php/i,
      /postman|insomnia|httpie/i,
    ];
    
    // Verificar User-Agent suspeito
    if (patterns.some(pattern => pattern.test(userAgent))) {
      return true;
    }
    
    // Verificar headers suspeitos
    const suspiciousHeaders = [
      'x-requested-with',
      'x-forwarded-for',
      'x-real-ip',
    ];
    
    let suspiciousHeaderCount = 0;
    for (const header of suspiciousHeaders) {
      if (req.get(header)) {
        suspiciousHeaderCount++;
      }
    }
    
    return suspiciousHeaderCount >= 2;
  }
}

// Gerador de fingerprint do dispositivo
class DeviceFingerprinting {
  generateFingerprint(req: Request): string {
    const components = [
      req.get('User-Agent') || '',
      req.get('Accept-Language') || '',
      req.get('Accept-Encoding') || '',
      req.get('Accept') || '',
      req.connection.remoteAddress || req.ip || '',
    ];
    
    const fingerprint = crypto
      .createHash('sha256')
      .update(components.join('|'))
      .digest('hex');
    
    return fingerprint;
  }
  
  async isDeviceKnown(userId: string, fingerprint: string): Promise<boolean> {
    try {
      const cacheKey = `user:${userId}:known-devices`;
      const knownDevices = await cacheGet<string[]>(cacheKey) || [];
      
      return knownDevices.includes(fingerprint);
    } catch (error) {
      logger.error(`Erro ao verificar dispositivo conhecido: ${error}`);
      return false;
    }
  }
  
  async addKnownDevice(userId: string, fingerprint: string): Promise<void> {
    try {
      const cacheKey = `user:${userId}:known-devices`;
      const knownDevices = await cacheGet<string[]>(cacheKey) || [];
      
      if (!knownDevices.includes(fingerprint)) {
        knownDevices.push(fingerprint);
        
        // Manter apenas os últimos 10 dispositivos
        if (knownDevices.length > 10) {
          knownDevices.shift();
        }
        
        await cacheSet(cacheKey, knownDevices, 30 * 24 * 3600); // 30 dias
      }
    } catch (error) {
      logger.error(`Erro ao adicionar dispositivo conhecido: ${error}`);
    }
  }
}

// Sistema de sessões seguras
class SecureSessionManager {
  async createSession(userId: string, deviceFingerprint: string, ipAddress: string): Promise<string> {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessionData = {
      userId,
      deviceFingerprint,
      ipAddress,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
    };
    
    await cacheSet(`session:${sessionId}`, sessionData, 24 * 3600); // 24 horas
    
    // Adicionar à lista de sessões do usuário
    const userSessionsKey = `user:${userId}:sessions`;
    const userSessions = await cacheGet<string[]>(userSessionsKey) || [];
    userSessions.push(sessionId);
    
    // Limitar a 5 sessões simultâneas
    if (userSessions.length > 5) {
      const oldestSession = userSessions.shift();
      if (oldestSession) {
        await cacheDelete(`session:${oldestSession}`);
      }
    }
    
    await cacheSet(userSessionsKey, userSessions, 24 * 3600);
    
    return sessionId;
  }
  
  async validateSession(sessionId: string, ipAddress: string, deviceFingerprint: string): Promise<boolean> {
    try {
      const sessionData = await cacheGet(`session:${sessionId}`);
      
      if (!sessionData || !sessionData.isActive) {
        return false;
      }
      
      // Verificar consistência de IP e dispositivo
      if (sessionData.ipAddress !== ipAddress || sessionData.deviceFingerprint !== deviceFingerprint) {
        logger.warn(`Sessão inconsistente detectada: ${sessionId}`);
        await this.invalidateSession(sessionId);
        return false;
      }
      
      // Atualizar última atividade
      sessionData.lastActivity = new Date();
      await cacheSet(`session:${sessionId}`, sessionData, 24 * 3600);
      
      return true;
    } catch (error) {
      logger.error(`Erro na validação de sessão: ${error}`);
      return false;
    }
  }
  
  async invalidateSession(sessionId: string): Promise<void> {
    await cacheDelete(`session:${sessionId}`);
  }
  
  async invalidateAllUserSessions(userId: string): Promise<void> {
    try {
      const userSessionsKey = `user:${userId}:sessions`;
      const userSessions = await cacheGet<string[]>(userSessionsKey) || [];
      
      for (const sessionId of userSessions) {
        await cacheDelete(`session:${sessionId}`);
      }
      
      await cacheDelete(userSessionsKey);
    } catch (error) {
      logger.error(`Erro ao invalidar sessões do usuário: ${error}`);
    }
  }
}

// Instâncias dos serviços
const anomalyDetector = new AnomalyDetector();
const deviceFingerprinting = new DeviceFingerprinting();
const sessionManager = new SecureSessionManager();

// Middleware de segurança avançada
export const advancedSecurityMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const ipAddress = req.ip;
    const deviceFingerprint = deviceFingerprinting.generateFingerprint(req);
    
    // Verificar se é comportamento de bot
    const isBotBehavior = await anomalyDetector.detectBotBehavior(req);
    if (isBotBehavior) {
      logger.warn(`Comportamento de bot detectado: ${ipAddress}`);
      throw new TooManyRequestsError('Comportamento suspeito detectado');
    }
    
    // Se usuário está autenticado, executar verificações adicionais
    if (userId) {
      // Detectar localização suspeita
      const isSuspiciousLocation = await anomalyDetector.detectSuspiciousLocation(userId, ipAddress);
      if (isSuspiciousLocation) {
        logger.warn(`Login de localização suspeita: ${userId} - ${ipAddress}`);
        // Aqui você pode implementar notificação por email ou SMS
      }
      
      // Detectar taxa de requisições anômala
      const isAnomalousRate = await anomalyDetector.detectAnomalousRequestRate(userId);
      if (isAnomalousRate) {
        logger.warn(`Taxa de requisições anômala: ${userId}`);
        throw new TooManyRequestsError('Taxa de requisições muito alta');
      }
      
      // Verificar dispositivo conhecido
      const isKnownDevice = await deviceFingerprinting.isDeviceKnown(userId, deviceFingerprint);
      if (!isKnownDevice) {
        logger.info(`Novo dispositivo detectado: ${userId}`);
        await deviceFingerprinting.addKnownDevice(userId, deviceFingerprint);
        // Aqui você pode implementar notificação de novo dispositivo
      }
    }
    
    // Adicionar contexto de segurança ao request
    (req as any).securityContext = {
      deviceFingerprint,
      ipAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date(),
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware para validação de sessão
export const validateSecureSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    const userId = (req as any).user?.id;
    
    if (!sessionId || !userId) {
      return next();
    }
    
    const ipAddress = req.ip;
    const deviceFingerprint = deviceFingerprinting.generateFingerprint(req);
    
    const isValidSession = await sessionManager.validateSession(sessionId, ipAddress, deviceFingerprint);
    
    if (!isValidSession) {
      logger.warn(`Sessão inválida detectada: ${userId} - ${sessionId}`);
      throw new UnauthorizedError('Sessão inválida');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware para logging de segurança
export const securityAuditLogger = (req: Request, res: Response, next: NextFunction): void => {
  const userId = (req as any).user?.id;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');
  const method = req.method;
  const url = req.originalUrl;
  
  // Log de ações sensíveis
  const sensitiveActions = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/users/deactivate',
    '/api/admin/',
  ];
  
  const isSensitiveAction = sensitiveActions.some(action => url.startsWith(action));
  
  if (isSensitiveAction) {
    logger.info('Security audit', {
      userId,
      ipAddress,
      userAgent,
      method,
      url,
      timestamp: new Date().toISOString(),
    });
  }
  
  next();
};

export {
  anomalyDetector,
  deviceFingerprinting,
  sessionManager,
};