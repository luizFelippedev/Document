// backend/src/jobs/queue-manager.ts - VERSÃO CORRIGIDA
import Queue from 'bull';
import { cacheGet, cacheSet } from '../config/redis';
import logger from '../config/logger';
import { sendEmail } from '../utils/email';
import redisClient from '../config/redis';

interface JobResult {
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
  timestamp: Date;
}

interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

class QueueManager {
  private queues: Map<string, Queue.Queue> = new Map();
  private processors: Map<string, Function> = new Map();
  
  constructor() {
    // Não inicializar conexão Redis aqui - será feito quando necessário
  }
  
  private getRedisConfig() {
    // Verificar se Redis está disponível
    if (!redisClient.isConnected) {
      throw new Error('Redis não está conectado');
    }
    
    return {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        lazyConnect: true,
      },
    };
  }
  
  // Criar uma nova fila
  createQueue(name: string, options: any = {}): Queue.Queue {
    if (this.queues.has(name)) {
      return this.queues.get(name)!;
    }
    
    try {
      const queue = new Queue(name, {
        ...this.getRedisConfig(),
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          ...options.defaultJobOptions,
        },
        ...options,
      });
      
      this.setupQueueEvents(queue);
      this.queues.set(name, queue);
      
      logger.info(`Fila criada com sucesso: ${name}`);
      return queue;
    } catch (error) {
      logger.error(`Erro ao criar fila ${name}: ${error}`);
      throw error;
    }
  }
  
  // Configurar eventos da fila
  private setupQueueEvents(queue: Queue.Queue): void {
    queue.on('completed', (job, result) => {
      logger.info(`Job ${job.id} concluído na fila ${queue.name}`, {
        jobId: job.id,
        queue: queue.name,
        duration: Date.now() - job.timestamp,
        result: result?.success ? 'success' : 'partial',
      });
    });
    
    queue.on('failed', (job, err) => {
      logger.error(`Job ${job.id} falhado na fila ${queue.name}`, {
        jobId: job.id,
        queue: queue.name,
        error: err.message,
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts,
      });
    });
    
    queue.on('stalled', (job) => {
      logger.warn(`Job ${job.id} travado na fila ${queue.name}`, {
        jobId: job.id,
        queue: queue.name,
        stalledCount: 1,
      });
    });
    
    queue.on('error', (error) => {
      logger.error(`Erro na fila ${queue.name}: ${error.message}`, {
        queue: queue.name,
        error: error.message,
      });
    });
    
    queue.on('waiting', (jobId) => {
      logger.debug(`Job ${jobId} aguardando na fila ${queue.name}`);
    });
    
    queue.on('active', (job) => {
      logger.debug(`Job ${job.id} iniciado na fila ${queue.name}`);
    });
  }
  
  // Registrar processador para uma fila
  registerProcessor(queueName: string, processor: Function, concurrency: number = 1): void {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Fila ${queueName} não encontrada`);
    }
    
    this.processors.set(queueName, processor);
    
    queue.process(concurrency, async (job) => {
      const startTime = Date.now();
      
      try {
        logger.debug(`Processando job ${job.id} na fila ${queueName}`, {
          jobId: job.id,
          queue: queueName,
          data: job.data,
        });
        
        const result = await processor(job);
        const duration = Date.now() - startTime;
        
        const jobResult: JobResult = {
          success: true,
          result,
          duration,
          timestamp: new Date(),
        };
        
        logger.info(`Job ${job.id} processado com sucesso`, {
          jobId: job.id,
          queue: queueName,
          duration,
        });
        
        return jobResult;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        logger.error(`Erro ao processar job ${job.id}`, {
          jobId: job.id,
          queue: queueName,
          error: (error as Error).message,
          duration,
        });
        
        throw error;
      }
    });
    
    logger.info(`Processador registrado para fila ${queueName} com concorrência ${concurrency}`);
  }
  
  // Adicionar job à fila
  async addJob(queueName: string, data: any, options: any = {}): Promise<Queue.Job | null> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Fila ${queueName} não encontrada`);
    }
    
    try {
      const job = await queue.add(data, {
        priority: options.priority || 0,
        delay: options.delay || 0,
        repeat: options.repeat,
        attempts: options.attempts || 3,
        backoff: options.backoff || { type: 'exponential', delay: 2000 },
        removeOnComplete: options.removeOnComplete || 50,
        removeOnFail: options.removeOnFail || 50,
        ...options,
      });
      
      logger.debug(`Job ${job.id} adicionado à fila ${queueName}`, {
        jobId: job.id,
        queue: queueName,
        priority: options.priority || 0,
      });
      
      return job;
    } catch (error) {
      logger.error(`Erro ao adicionar job à fila ${queueName}: ${error}`);
      return null;
    }
  }
  
  // Obter estatísticas de uma fila
  async getQueueStats(queueName: string): Promise<QueueStats | null> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return null;
    }
    
    try {
      const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
        queue.isPaused(),
      ]);
      
      return {
        name: queueName,
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        paused,
      };
    } catch (error) {
      logger.error(`Erro ao obter estatísticas da fila ${queueName}: ${error}`);
      return null;
    }
  }
  
  // Obter estatísticas de todas as filas
  async getAllQueueStats(): Promise<QueueStats[]> {
    const stats: QueueStats[] = [];
    
    for (const queueName of this.queues.keys()) {
      const queueStats = await this.getQueueStats(queueName);
      if (queueStats) {
        stats.push(queueStats);
      }
    }
    
    return stats;
  }
  
  // Pausar uma fila
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Fila ${queueName} não encontrada`);
    }
    
    await queue.pause();
    logger.info(`Fila ${queueName} pausada`);
  }
  
  // Retomar uma fila
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Fila ${queueName} não encontrada`);
    }
    
    await queue.resume();
    logger.info(`Fila ${queueName} retomada`);
  }
  
  // Limpar jobs de uma fila
  async cleanQueue(queueName: string, grace: number = 0, type: string = 'completed'): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Fila ${queueName} não encontrada`);
    }
    
    try {
      await queue.clean(grace, type as any);
      logger.info(`Fila ${queueName} limpa (tipo: ${type}, grace: ${grace})`);
    } catch (error) {
      logger.error(`Erro ao limpar fila ${queueName}: ${error}`);
      throw error;
    }
  }
  
  // Fechar todas as filas
  async closeAll(): Promise<void> {
    try {
      const promises = Array.from(this.queues.values()).map(queue => queue.close());
      await Promise.all(promises);
      
      this.queues.clear();
      this.processors.clear();
      
      logger.info('Todas as filas foram fechadas');
    } catch (error) {
      logger.error(`Erro ao fechar filas: ${error}`);
      throw error;
    }
  }
  
  // Configurar jobs recorrentes
  async setupRecurringJobs(): Promise<void> {
    try {
      // Backup diário
      await this.addJob('backup', {}, {
        repeat: { cron: '0 2 * * *' }, // Todo dia às 2:00
        removeOnComplete: 5,
        removeOnFail: 5,
      });
      
      // Limpeza de cache
      await this.addJob('cache-cleanup', {}, {
        repeat: { cron: '0 */6 * * *' }, // A cada 6 horas
        removeOnComplete: 5,
        removeOnFail: 5,
      });
      
      // Limpeza de logs
      await this.addJob('log-cleanup', {}, {
        repeat: { cron: '0 1 * * 0' }, // Todo domingo às 1:00
        removeOnComplete: 5,
        removeOnFail: 5,
      });
      
      // Estatísticas de sistema
      await this.addJob('system-stats', {}, {
        repeat: { cron: '*/15 * * * *' }, // A cada 15 minutos
        removeOnComplete: 10,
        removeOnFail: 5,
      });
      
      logger.info('Jobs recorrentes configurados');
    } catch (error) {
      logger.error(`Erro ao configurar jobs recorrentes: ${error}`);
      throw error;
    }
  }
  
  // Monitoramento de saúde das filas
  async healthCheck(): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      // Verificar se Redis está conectado
      if (!redisClient.isConnected) {
        issues.push('Redis não está conectado');
        return { healthy: false, issues };
      }
      
      const stats = await this.getAllQueueStats();
      
      for (const stat of stats) {
        // Verificar se há muitos jobs falhados
        if (stat.failed > 100) {
          issues.push(`Fila ${stat.name} tem ${stat.failed} jobs falhados`);
        }
        
        // Verificar se há jobs travados
        if (stat.active > 0 && stat.delayed > stat.active * 2) {
          issues.push(`Fila ${stat.name} pode ter jobs travados`);
        }
        
        // Verificar se fila está pausada inesperadamente
        if (stat.paused && stat.waiting > 0) {
          issues.push(`Fila ${stat.name} está pausada com jobs aguardando`);
        }
      }
      
      return {
        healthy: issues.length === 0,
        issues,
      };
    } catch (error) {
      return {
        healthy: false,
        issues: [`Erro no health check: ${(error as Error).message}`],
      };
    }
  }
}

// Instância global do gerenciador de filas
export const queueManager = new QueueManager();

// Configurar filas padrão
export const setupQueues = async (): Promise<void> => {
  try {
    // Verificar se Redis está disponível
    if (!redisClient.isConnected) {
      logger.warn('Redis não conectado, pulando configuração de filas');
      return;
    }
    
    logger.info('Configurando filas de background jobs...');
    
    // Fila de email
    const emailQueue = queueManager.createQueue('email', {
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });
    
    // Fila de processamento de imagem
    const imageQueue = queueManager.createQueue('image-processing', {
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 25,
        attempts: 3,
        timeout: 60000, // 1 minuto
      },
    });
    
    // Fila de backup
    const backupQueue = queueManager.createQueue('backup', {
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 10,
        attempts: 2,
        timeout: 300000, // 5 minutos
      },
    });
    
    // Fila de limpeza
    const cleanupQueue = queueManager.createQueue('cleanup', {
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 2,
      },
    });
    
    // Registrar processadores
    queueManager.registerProcessor('email', async (job) => {
      const { to, subject, template, data } = job.data;
      return await sendEmail({ to, subject, template, data });
    }, 5); // 5 emails simultâneos
    
    queueManager.registerProcessor('image-processing', async (job) => {
      const { type, inputPath, outputPath, options } = job.data;
      
      // Implementar processamento de imagem baseado no tipo
      switch (type) {
        case 'resize':
          // Implementar redimensionamento
          return { success: true, outputPath, type: 'resize' };
        case 'optimize':
          // Implementar otimização
          return { success: true, outputPath, type: 'optimize' };
        case 'thumbnail':
          // Implementar criação de thumbnail
          return { success: true, outputPath, type: 'thumbnail' };
        default:
          throw new Error(`Tipo de processamento não suportado: ${type}`);
      }
    }, 2); // 2 processamentos simultâneos
    
    queueManager.registerProcessor('backup', async (job) => {
      // Implementar backup
      logger.info('Executando backup do sistema...');
      return { success: true, timestamp: new Date() };
    }, 1); // 1 backup por vez
    
    queueManager.registerProcessor('cleanup', async (job) => {
      const { type } = job.data;
      
      switch (type) {
        case 'cache':
          logger.info('Limpando cache expirado...');
          return { success: true, type: 'cache' };
        case 'logs':
          logger.info('Limpando logs antigos...');
          return { success: true, type: 'logs' };
        case 'files':
          logger.info('Limpando arquivos temporários...');
          return { success: true, type: 'files' };
        default:
          throw new Error(`Tipo de limpeza não suportado: ${type}`);
      }
    }, 1);
    
    // Configurar jobs recorrentes
    await queueManager.setupRecurringJobs();
    
    logger.info('✅ Filas configuradas com sucesso');
  } catch (error) {
    logger.error(`❌ Erro ao configurar filas: ${error}`);
    throw error;
  }
};

export default queueManager;