import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

interface RedisClientWrapper {
  client: RedisClientType | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getClient: () => RedisClientType;
}

const redisClient: RedisClientWrapper = {
  client: null,
  isConnected: false,

  connect: async function (): Promise<void> {
    try {
      if (this.client && this.isConnected) {
        logger.info('🔁 Redis is already connected.');
        return;
      }

      // Build Redis URL or use individual config
      let redisUrl = process.env.REDIS_URL;
      
      if (!redisUrl) {
        const host = process.env.REDIS_HOST || 'localhost';
        const port = process.env.REDIS_PORT || '6379';
        const password = process.env.REDIS_PASSWORD;
        const username = process.env.REDIS_USERNAME;
        
        // Build URL from components
        if (password) {
          redisUrl = `redis://${username ? `${username}:` : ''}${password}@${host}:${port}`;
        } else {
          redisUrl = `redis://${host}:${port}`;
        }
      }

      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            const delay = Math.min(retries * 100, 3000);
            logger.warn(`⚠️ Redis reconnecting in ${delay}ms (attempt ${retries})`);
            return delay;
          },
          connectTimeout: 5000,
          lazyConnect: true,
        },
        // Retry configuration
        commandTimeout: 5000,
        lazyConnect: true,
      });

      // Set up event listeners
      this.client.on('error', (err) => {
        logger.error(`❌ Redis error: ${err.message}`);
        this.isConnected = false;
      });

      this.client.on('ready', () => {
        logger.info('✅ Redis client is ready');
        this.isConnected = true;
      });

      this.client.on('connect', () => {
        logger.info('🔌 Redis connected');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        logger.warn('⚠️ Redis reconnecting...');
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.info('🔌 Redis disconnected');
        this.isConnected = false;
      });

      // Connect to Redis
      await this.client.connect();
      
      // Test the connection
      await this.client.ping();
      
      logger.info('🚀 Redis connected successfully');

      // Handle graceful shutdown
      const gracefulShutdown = async (signal: string) => {
        logger.info(`📶 Received ${signal}, closing Redis connection...`);
        await this.disconnect();
        process.exit(0);
      };

      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    } catch (error: any) {
      logger.error(`❌ Failed to connect to Redis: ${error.message}`);
      this.isConnected = false;
      
      // Don't exit the process in development, just log the error
      if (process.env.NODE_ENV === 'production') {
        throw error;
      } else {
        logger.warn('⚠️ Continuing without Redis in development mode');
      }
    }
  },

  disconnect: async function (): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.quit();
      logger.info('🛑 Redis disconnected successfully');
      this.isConnected = false;
      this.client = null;
    } catch (error: any) {
      logger.error(`❌ Error disconnecting from Redis: ${error.message}`);
      // Force disconnect
      if (this.client) {
        this.client.disconnect();
        this.client = null;
        this.isConnected = false;
      }
    }
  },

  getClient: function (): RedisClientType {
    if (!this.client || !this.isConnected) {
      throw new Error('❌ Redis client is not initialized or disconnected');
    }
    return this.client;
  },
};

// Utility functions for cache operations

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    if (!redisClient.isConnected) {
      logger.warn(`⚠️ Redis not connected, skipping get for key: ${key}`);
      return null;
    }
    
    const client = redisClient.getClient();
    const data = await client.get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch (error: any) {
    logger.error(`❌ Error getting key ${key}: ${error.message}`);
    return null;
  }
};

export const cacheSet = async (
  key: string,
  value: unknown,
  ttlSeconds = 3600
): Promise<boolean> => {
  try {
    if (!redisClient.isConnected) {
      logger.warn(`⚠️ Redis not connected, skipping set for key: ${key}`);
      return false;
    }
    
    const client = redisClient.getClient();
    const serializedValue = JSON.stringify(value);
    
    if (ttlSeconds > 0) {
      await client.setEx(key, ttlSeconds, serializedValue);
    } else {
      await client.set(key, serializedValue);
    }
    
    return true;
  } catch (error: any) {
    logger.error(`❌ Error setting key ${key}: ${error.message}`);
    return false;
  }
};

export const cacheDelete = async (key: string): Promise<boolean> => {
  try {
    if (!redisClient.isConnected) {
      logger.warn(`⚠️ Redis not connected, skipping delete for key: ${key}`);
      return false;
    }
    
    const client = redisClient.getClient();
    const result = await client.del(key);
    return result > 0;
  } catch (error: any) {
    logger.error(`❌ Error deleting key ${key}: ${error.message}`);
    return false;
  }
};

export const cacheDeletePattern = async (pattern: string): Promise<boolean> => {
  try {
    if (!redisClient.isConnected) {
      logger.warn(`⚠️ Redis not connected, skipping pattern delete: ${pattern}`);
      return false;
    }
    
    const client = redisClient.getClient();
    
    // Use SCAN instead of KEYS for better performance in production
    const keys: string[] = [];
    let cursor = 0;
    
    do {
      const result = await client.scan(cursor, {
        MATCH: pattern,
        COUNT: 100
      });
      
      cursor = result.cursor;
      keys.push(...result.keys);
    } while (cursor !== 0);
    
    if (keys.length > 0) {
      await client.del(keys);
      logger.info(`🗑️ Deleted ${keys.length} keys matching pattern: ${pattern}`);
    }
    
    return true;
  } catch (error: any) {
    logger.error(`❌ Error deleting pattern ${pattern}: ${error.message}`);
    return false;
  }
};

export const cacheExists = async (key: string): Promise<boolean> => {
  try {
    if (!redisClient.isConnected) {
      return false;
    }
    
    const client = redisClient.getClient();
    const result = await client.exists(key);
    return result > 0;
  } catch (error: any) {
    logger.error(`❌ Error checking existence of key ${key}: ${error.message}`);
    return false;
  }
};

export const cacheExpire = async (key: string, ttlSeconds: number): Promise<boolean> => {
  try {
    if (!redisClient.isConnected) {
      return false;
    }
    
    const client = redisClient.getClient();
    const result = await client.expire(key, ttlSeconds);
    return result;
  } catch (error: any) {
    logger.error(`❌ Error setting expiry for key ${key}: ${error.message}`);
    return false;
  }
};

export const cacheGetTTL = async (key: string): Promise<number> => {
  try {
    if (!redisClient.isConnected) {
      return -1;
    }
    
    const client = redisClient.getClient();
    return await client.ttl(key);
  } catch (error: any) {
    logger.error(`❌ Error getting TTL for key ${key}: ${error.message}`);
    return -1;
  }
};

export const cacheHealth = (): boolean => redisClient.isConnected;

export const cacheFlush = async (): Promise<boolean> => {
  try {
    if (!redisClient.isConnected) {
      return false;
    }
    
    const client = redisClient.getClient();
    await client.flushDb();
    logger.info('🗑️ Redis cache flushed');
    return true;
  } catch (error: any) {
    logger.error(`❌ Error flushing cache: ${error.message}`);
    return false;
  }
};

export default redisClient;