// backend/src/api/middleware/rateLimiter.ts - CORRIGIDO
import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import redisClient from '../../config/redis';
import logger from '../../config/logger';

// ✅ Rate limiter store simples usando Redis (sem rate-limit-redis)
class SimpleRedisStore {
  prefix: string;
  windowMs: number;

  constructor(options: { prefix?: string; windowMs: number }) {
    this.prefix = options.prefix || 'rate-limit:';
    this.windowMs = options.windowMs;
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime?: Date }> {
    try {
      if (!redisClient.isConnected) {
        // Fallback: permitir requisição se Redis não estiver disponível
        return { totalHits: 1 };
      }

      const client = redisClient.getClient();
      const redisKey = `${this.prefix}${key}`;
      
      // Incrementar contador
      const totalHits = await client.incr(redisKey);
      
      // Se é a primeira requisição, definir TTL
      if (totalHits === 1) {
        await client.expire(redisKey, Math.ceil(this.windowMs / 1000));
      }
      
      // Calcular tempo de reset
      const ttl = await client.ttl(redisKey);
      const resetTime = ttl > 0 ? new Date(Date.now() + ttl * 1000) : undefined;
      
      return { totalHits, resetTime };
    } catch (error) {
      logger.error(`Error in rate limiter store: ${error}`);
      // Fallback: permitir requisição em caso de erro
      return { totalHits: 1 };
    }
  }

  async decrement(key: string): Promise<void> {
    try {
      if (!redisClient.isConnected) return;
      
      const client = redisClient.getClient();
      const redisKey = `${this.prefix}${key}`;
      await client.decr(redisKey);
    } catch (error) {
      logger.error(`Error decrementing rate limit: ${error}`);
    }
  }

  async resetKey(key: string): Promise<void> {
    try {
      if (!redisClient.isConnected) return;
      
      const client = redisClient.getClient();
      const redisKey = `${this.prefix}${key}`;
      await client.del(redisKey);
    } catch (error) {
      logger.error(`Error resetting rate limit key: ${error}`);
    }
  }
}

/**
 * Create rate limiter middleware factory
 * @param windowMs Time window in ms
 * @param max Maximum number of requests per windowMs
 * @param message Error message when limit is reached
 * @returns Rate limiter middleware
 */
export const createRateLimiter = (
  windowMs: number = 15 * 60 * 1000, // 15 minutes by default
  max: number = 100, // 100 requests per windowMs by default
  message: string = 'Too many requests, please try again later.'
) => {
  try {
    const store = new SimpleRedisStore({ 
      prefix: 'rate-limit:', 
      windowMs 
    });

    const limiter = rateLimit({
      windowMs,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      message: { status: 'fail', message },
      skip: (req: Request) => {
        // Skip rate limiting for trusted IPs or in development
        return process.env.NODE_ENV === 'development' && 
               (req.ip === '127.0.0.1' || req.ip === '::1');
      },
      // ✅ Usar nossa store customizada
      store: {
        increment: (key: string) => store.increment(key),
        decrement: (key: string) => store.decrement(key),
        resetKey: (key: string) => store.resetKey(key),
      } as any,
    });
    
    return limiter;
  } catch (error) {
    logger.error(`Error creating rate limiter: ${error}`);
    // Fallback: retornar middleware que não faz nada
    return (req: any, res: any, next: any) => next();
  }
};

/**
 * Authentication routes specific rate limiter
 * Limits login attempts to 5 per 15 minutes
 */
export const authRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 requests per 15 minutes
  'Too many login attempts, please try again later.'
);

/**
 * Password reset rate limiter
 * Limits password reset requests to 3 per hour
 */
export const passwordResetRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  3, // 3 requests per hour
  'Too many password reset attempts, please try again later.'
);

/**
 * Registration rate limiter
 * Limits registration to 5 per hour from same IP
 */
export const registrationRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  5, // 5 registrations per hour
  'Too many registration attempts, please try again later.'
);

/**
 * General API rate limiter
 * Limits to 100 requests per 15 minutes
 */
export const apiRateLimiter = createRateLimiter();

export default {
  createRateLimiter,
  authRateLimiter,
  passwordResetRateLimiter,
  registrationRateLimiter,
  apiRateLimiter
};