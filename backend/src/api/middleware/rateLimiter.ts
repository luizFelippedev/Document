import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Request } from 'express';
import redisClient from '../../config/redis';
import logger from '../../config/logger';

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
      store: new RedisStore({
        // @ts-ignore - Type issues with the library
        sendCommand: (...args: string[]) => redisClient.getClient().sendCommand(args),
        prefix: 'rate-limit:',
      }),
    });
    
    return limiter;
  } catch (error) {
    logger.error(`Error creating rate limiter: ${error}`);
    // Fallback to memory store if Redis fails
    return rateLimit({
      windowMs,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      message: { status: 'fail', message },
    });
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