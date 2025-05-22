import { cacheGet, cacheSet, cacheDelete, cacheDeletePattern } from '../config/redis';
import logger from '../config/logger';
import crypto from 'crypto';

interface CacheOptions {
  ttl?: number;
  tags?: string[];
  serialize?: boolean;
  compress?: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

class CacheManager {
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0,
  };
  
  // Cache com opções avançadas
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const cacheKey = this.generateKey(key);
      const data = await cacheGet<T>(cacheKey);
      
      if (data !== null) {
        this.stats.hits++;
        logger.debug(`Cache hit: ${key}`);
        return data;
      } else {
        this.stats.misses++;
        logger.debug(`Cache miss: ${key}`);
        return null;
      }
    } catch (error) {
      logger.error(`Erro no cache get: ${error}`);
      this.stats.misses++;
      return null;
    } finally {
      this.updateHitRate();
    }
  }
  
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(key);
      const ttl = options.ttl || 3600; // 1 hora padrão
      
      // Serializar se necessário
      let finalValue = value;
      if (options.serialize && typeof value === 'object') {
        finalValue = JSON.stringify(value) as any;
      }
      
      // Comprimir se necessário (implementação simplificada)
      if (options.compress && typeof finalValue === 'string' && finalValue.length > 1000) {
        // Aqui você pode implementar compressão real
        logger.debug(`Comprimindo cache: ${key}`);
      }
      
      const success = await cacheSet(cacheKey, finalValue, ttl);
      
      if (success) {
        this.stats.sets++;
        
        // Adicionar tags se especificadas
        if (options.tags && options.tags.length > 0) {
          await this.addTags(cacheKey, options.tags);
        }
        
        logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
      }
      
      return success;
    } catch (error) {
      logger.error(`Erro no cache set: ${error}`);
      return false;
    }
  }
  
  async delete(key: string): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(key);
      const success = await cacheDelete(cacheKey);
      
      if (success) {
        this.stats.deletes++;
        logger.debug(`Cache delete: ${key}`);
      }
      
      return success;
    } catch (error) {
      logger.error(`Erro no cache delete: ${error}`);
      return false;
    }
  }
  
  // Cache com fallback para função
  async remember<T>(
    key: string,
    fallbackFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    try {
      // Tentar obter do cache
      let data = await this.get<T>(key, options);
      
      if (data !== null) {
        return data;
      }
      
      // Executar função fallback
      logger.debug(`Executando fallback para: ${key}`);
      data = await fallbackFn();
      
      // Salvar no cache
      await this.set(key, data, options);
      
      return data;
    } catch (error) {
      logger.error(`Erro no cache remember: ${error}`);
      throw error;
    }
  }
  
  // Invalidar cache por tags
  async invalidateByTag(tag: string): Promise<void> {
    try {
      const tagKey = `tag:${tag}`;
      const keys = await cacheGet<string[]>(tagKey);
      
      if (keys && keys.length > 0) {
        for (const key of keys) {
          await cacheDelete(key);
        }
        
        await cacheDelete(tagKey);
        logger.info(`Cache invalidado por tag: ${tag} (${keys.length} itens)`);
      }
    } catch (error) {
      logger.error(`Erro ao invalidar cache por tag: ${error}`);
    }
  }
  
  // Invalidar cache por padrão
  async invalidateByPattern(pattern: string): Promise<void> {
    try {
      await cacheDeletePattern(pattern);
      logger.info(`Cache invalidado por padrão: ${pattern}`);
    } catch (error) {
      logger.error(`Erro ao invalidar cache por padrão: ${error}`);
    }
  }
  
  // Pré-aquecer cache
  async warmup(keys: Array<{ key: string; fn: () => Promise<any>; options?: CacheOptions }>): Promise<void> {
    logger.info(`Pré-aquecendo cache para ${keys.length} itens...`);
    
    const promises = keys.map(async ({ key, fn, options }) => {
      try {
        const data = await fn();
        await this.set(key, data, options);
        logger.debug(`Cache pré-aquecido: ${key}`);
      } catch (error) {
        logger.error(`Erro ao pré-aquecer cache ${key}: ${error}`);
      }
    });
    
    await Promise.all(promises);
    logger.info('Pré-aquecimento do cache concluído');
  }
  
  // Estatísticas do cache
  getStats(): CacheStats {
    return { ...this.stats };
  }
  
  // Resetar estatísticas
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
    };
  }
  
  // Métodos privados
  private generateKey(key: string): string {
    // Adicionar prefixo e normalizar
    return `app:${key}`;
  }
  
  private async addTags(key: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const existingKeys = await cacheGet<string[]>(tagKey) || [];
      
      if (!existingKeys.includes(key)) {
        existingKeys.push(key);
        await cacheSet(tagKey, existingKeys, 24 * 3600); // 24 horas
      }
    }
  }
  
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }
}

// Instância global do cache manager
export const cacheManager = new CacheManager();

// Middleware de cache para rotas
export const cacheMiddleware = (
  keyGenerator: (req: any) => string,
  options: CacheOptions = {}
) => {
  return async (req: any, res: any, next: any) => {
    // Apenas cache para métodos GET
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = keyGenerator(req);
    
    try {
      const cachedData = await cacheManager.get(key, options);
      
      if (cachedData) {
        res.set('X-Cache-Status', 'HIT');
        return res.json(cachedData);
      }
      
      // Interceptar resposta para salvar no cache
      const originalSend = res.send;
      res.send = function(data: any) {
        if (res.statusCode === 200) {
          cacheManager.set(key, JSON.parse(data), options);
        }
        res.set('X-Cache-Status', 'MISS');
        return originalSend.call(this, data);
      };
      
      next();
    } catch (error) {
      logger.error(`Erro no middleware de cache: ${error}`);
      next();
    }
  };
};

export default cacheManager;