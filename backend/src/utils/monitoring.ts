import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { cacheGet, cacheSet } from '../config/redis';

interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  errorCount: number;
  slowRequestCount: number;
  lastUpdated: Date;
}

interface RequestMetrics {
  path: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userAgent?: string;
  ip: string;
  userId?: string;
}

class MonitoringService {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private requests: RequestMetrics[] = [];
  private readonly maxRequests = 1000; // Manter últimas 1000 requisições
  
  // Middleware para capturar métricas
  captureMetrics = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    
    // Interceptar o final da resposta
    const originalSend = res.send;
    res.send = function(data) {
      const responseTime = Date.now() - startTime;
      
      // Capturar dados da requisição
      const metrics: RequestMetrics = {
        path: req.route?.path || req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTime,
        timestamp: new Date(),
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: (req as any).user?.id,
      };
      
      // Processar métricas
      this.processMetrics(metrics);
      
      return originalSend.call(this, data);
    }.bind(res);
    
    next();
  };

  private processMetrics(requestMetrics: RequestMetrics): void {
    // Adicionar à lista de requisições
    this.requests.push(requestMetrics);
    
    // Manter apenas as últimas N requisições
    if (this.requests.length > this.maxRequests) {
      this.requests.shift();
    }
    
    // Atualizar métricas agregadas
    const key = `${requestMetrics.method}:${requestMetrics.path}`;
    let metrics = this.metrics.get(key);
    
    if (!metrics) {
      metrics = {
        requestCount: 0,
        averageResponseTime: 0,
        errorCount: 0,
        slowRequestCount: 0,
        lastUpdated: new Date(),
      };
    }
    
    // Atualizar contadores
    metrics.requestCount++;
    metrics.averageResponseTime = (
      (metrics.averageResponseTime * (metrics.requestCount - 1) + requestMetrics.responseTime) /
      metrics.requestCount
    );
    
    if (requestMetrics.statusCode >= 400) {
      metrics.errorCount++;
    }
    
    if (requestMetrics.responseTime > 1000) { // Requisições lentas > 1s
      metrics.slowRequestCount++;
    }
    
    metrics.lastUpdated = new Date();
    this.metrics.set(key, metrics);
    
    // Log de requisições lentas
    if (requestMetrics.responseTime > 2000) {
      logger.warn(`Requisição lenta detectada: ${requestMetrics.method} ${requestMetrics.path} - ${requestMetrics.responseTime}ms`, {
        ip: requestMetrics.ip,
        userId: requestMetrics.userId,
        userAgent: requestMetrics.userAgent,
      });
    }
    
    // Log de erros
    if (requestMetrics.statusCode >= 500) {
      logger.error(`Erro do servidor: ${requestMetrics.method} ${requestMetrics.path} - ${requestMetrics.statusCode}`, {
        ip: requestMetrics.ip,
        userId: requestMetrics.userId,
        responseTime: requestMetrics.responseTime,
      });
    }
  }
  
  // Obter estatísticas gerais
  getStats(): any {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentRequests = this.requests.filter(req => req.timestamp >= oneHourAgo);
    
    const totalRequests = recentRequests.length;
    const errorRequests = recentRequests.filter(req => req.statusCode >= 400).length;
    const slowRequests = recentRequests.filter(req => req.responseTime > 1000).length;
    
    const averageResponseTime = totalRequests > 0
      ? recentRequests.reduce((sum, req) => sum + req.responseTime, 0) / totalRequests
      : 0;
    
    return {
      period: 'last_hour',
      totalRequests,
      errorRequests,
      slowRequests,
      errorRate: totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0,
      averageResponseTime: Math.round(averageResponseTime),
      topEndpoints: this.getTopEndpoints(recentRequests),
      statusCodes: this.getStatusCodeDistribution(recentRequests),
    };
  }
  
  private getTopEndpoints(requests: RequestMetrics[]): any[] {
    const endpointStats = new Map();
    
    requests.forEach(req => {
      const key = `${req.method} ${req.path}`;
      const stats = endpointStats.get(key) || { count: 0, totalTime: 0, errors: 0 };
      
      stats.count++;
      stats.totalTime += req.responseTime;
      if (req.statusCode >= 400) stats.errors++;
      
      endpointStats.set(key, stats);
    });
    
    return Array.from(endpointStats.entries())
      .map(([endpoint, stats]: [string, any]) => ({
        endpoint,
        count: stats.count,
        averageTime: Math.round(stats.totalTime / stats.count),
        errorRate: ((stats.errors / stats.count) * 100).toFixed(1),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
  
  private getStatusCodeDistribution(requests: RequestMetrics[]): any {
    const distribution: Record<string, number> = {};
    
    requests.forEach(req => {
      const statusRange = `${Math.floor(req.statusCode / 100)}xx`;
      distribution[statusRange] = (distribution[statusRange] || 0) + 1;
    });
    
    return distribution;
  }
  
  // Salvar métricas no Redis periodicamente
  async saveMetricsToRedis(): Promise<void> {
    try {
      const stats = this.getStats();
      await cacheSet('system:metrics', stats, 3600); // 1 hora
      
      // Salvar também no log para análise histórica
      logger.info('System metrics', stats);
    } catch (error) {
      logger.error(`Erro ao salvar métricas: ${error}`);
    }
  }
  
  // Inicializar monitoramento periódico
  startPeriodicMonitoring(): void {
    // Salvar métricas a cada 5 minutos
    setInterval(() => {
      this.saveMetricsToRedis();
    }, 5 * 60 * 1000);
    
    // Limpar métricas antigas a cada hora
    setInterval(() => {
      this.cleanOldMetrics();
    }, 60 * 60 * 1000);
  }
  
  private cleanOldMetrics(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    this.requests = this.requests.filter(req => req.timestamp >= oneHourAgo);
    
    // Limpar métricas de endpoints não utilizados recentemente
    for (const [key, metrics] of this.metrics.entries()) {
      if (metrics.lastUpdated < oneHourAgo) {
        this.metrics.delete(key);
      }
    }
  }
}

export const monitoringService = new MonitoringService();

// Middleware de health check avançado
export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        mongodb: 'unknown',
        redis: 'unknown',
      },
      metrics: monitoringService.getStats(),
      memory: process.memoryUsage(),
      pid: process.pid,
    };
    
    // Verificar MongoDB
    try {
      const { checkDBConnection } = require('../config/db');
      health.services.mongodb = checkDBConnection() ? 'connected' : 'disconnected';
    } catch (error) {
      health.services.mongodb = 'error';
    }
    
    // Verificar Redis
    try {
      const redisClient = require('../config/redis').default;
      health.services.redis = redisClient.isConnected ? 'connected' : 'disconnected';
    } catch (error) {
      health.services.redis = 'error';
    }
    
    // Determinar status geral
    const isHealthy = health.services.mongodb === 'connected' && 
                     health.services.redis === 'connected';
    
    if (!isHealthy) {
      health.status = 'degraded';
    }
    
    const statusCode = isHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error(`Health check error: ${error}`);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
};

export default monitoringService;