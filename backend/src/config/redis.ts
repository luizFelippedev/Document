// 4.1 - src/config/redis.ts - CORREÇÃO COMPLETA
import { createClient, RedisClientType } from 'redis';
import logger from './logger';

interface RedisWrapper {
  client: RedisClientType | null;
  isConnected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getClient(): RedisClientType;
}

const redisClient: RedisWrapper = {
  client: null,
  isConnected: false,

  async connect() {
    try {
      if (this.client && this.isConnected) {
        return;
      }

      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
          connectTimeout: 10000,
        },
      });

      this.client.on('error', (err) => {
        logger.error(`Redis error: ${err.message}`);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis connected');
        this.isConnected = true;
      });

      await this.client.connect();
      await this.client.ping();
      
      logger.info('Redis connection successful');
    } catch (error: any) {
      logger.error(`Failed to connect to Redis: ${error.message}`);
      this.isConnected = false;
    }
  },

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  },

  getClient() {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }
    return this.client;
  },
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    if (!redisClient.isConnected) return null;
    const data = await redisClient.getClient().get(key);
    return data ? JSON.parse(data) : null;
  } catch (error: any) {
    logger.error(`Cache get error: ${error.message}`);
    return null;
  }
};

export const cacheSet = async (key: string, value: any, ttl = 3600): Promise<boolean> => {
  try {
    if (!redisClient.isConnected) return false;
    await redisClient.getClient().setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error: any) {
    logger.error(`Cache set error: ${error.message}`);
    return false;
  }
};

export const cacheDelete = async (key: string): Promise<boolean> => {
  try {
    if (!redisClient.isConnected) return false;
    await redisClient.getClient().del(key);
    return true;
  } catch (error: any) {
    logger.error(`Cache delete error: ${error.message}`);
    return false;
  }
};

export default redisClient;