import { createClient, RedisClientType as RedisType } from 'redis';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

interface RedisClientWrapper {
  client: RedisType | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getClient: () => RedisType;
}

const redisClient: RedisClientWrapper = {
  client: null,
  isConnected: false,

  connect: async function (): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) {
        throw new Error('REDIS_URL não definido no .env');
      }

      if (this.client && this.isConnected) {
        logger.info('🔁 Redis já está conectado.');
        return;
      }

      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
        },
      });

      this.client.on('error', (err) => {
        logger.error(`❌ Redis error: ${err.message}`);
        this.isConnected = false;
      });

      this.client.on('ready', () => {
        logger.info('✅ Redis client está pronto');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        logger.warn('⚠️ Redis tentando reconectar...');
      });

      this.client.on('end', () => {
        logger.info('🔌 Redis desconectado');
        this.isConnected = false;
      });

      await this.client.connect();

      logger.info('🚀 Redis conectado com sucesso');

      // Trata encerramento do processo para desconectar Redis com limpeza
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

    } catch (error: any) {
      logger.error(`❌ Erro ao conectar no Redis: ${error.message}`);
      this.isConnected = false;
      throw error;
    }
  },

  disconnect: async function (): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.quit();
      logger.info('🛑 Redis desconectado com sucesso');
      this.isConnected = false;
    } catch (error: any) {
      logger.error(`❌ Erro ao desconectar do Redis: ${error.message}`);
      throw error;
    }
  },

  getClient: function (): RedisType {
    if (!this.client || !this.isConnected) {
      throw new Error('❌ Redis client não inicializado ou desconectado.');
    }
    return this.client;
  },
};

// Funções utilitárias para cache

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    const client = redisClient.getClient();
    const data = await client.get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch (error: any) {
    logger.error(`❌ Erro ao obter chave ${key}: ${error.message}`);
    return null;
  }
};

export const cacheSet = async (
  key: string,
  value: unknown,
  ttlSeconds = 3600
): Promise<boolean> => {
  try {
    const client = redisClient.getClient();
    await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
    return true;
  } catch (error: any) {
    logger.error(`❌ Erro ao definir chave ${key}: ${error.message}`);
    return false;
  }
};

export const cacheDelete = async (key: string): Promise<boolean> => {
  try {
    const client = redisClient.getClient();
    await client.del(key);
    return true;
  } catch (error: any) {
    logger.error(`❌ Erro ao deletar chave ${key}: ${error.message}`);
    return false;
  }
};

export const cacheDeletePattern = async (pattern: string): Promise<boolean> => {
  try {
    const client = redisClient.getClient();
    // Atenção: usar KEYS em produção pode ser custoso, prefira SCAN para grandes bases
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
    return true;
  } catch (error: any) {
    logger.error(`❌ Erro ao deletar padrão ${pattern}: ${error.message}`);
    return false;
  }
};

export const cacheHealth = (): boolean => redisClient.isConnected;

export default redisClient;