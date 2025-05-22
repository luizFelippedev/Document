import Queue from 'bull';
import { cacheGet, cacheSet } from '../config/redis';
import logger from '../config/logger';
import { sendEmail } from '../utils/email';

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
    this.setupRedisConnection();
  }
  
  private setupRedisConnection() {
    const redisConfig = {
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
    
    return redisConfig;
  }
  
  // Criar uma nova fila
  createQueue(name: string, options: any = {}): Queue.Queue {
    if (this.queues.has(name)) {
      return this.queues.get(name)!;
    }
    
    const queue = new Queue(name, {
      ...this.setupRedisConnection(),
      defaultJobOptions: {
        removeOnComplete: 50, // Manter últimos 50 jobs completos
        removeOnFail: 50, // Manter últimos 50 jobs falhados
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
    
    logger.info(`Fila criada: ${name}`);
    return queue;
  }
  
  // Configurar eventos da fila
  private setupQueueEvents(queue: Queue.Queue): void {
    queue.on('completed', (job, result) => {
      logger.info(`Job ${job.id} concluído na fila ${queue.name}`, {
        jobId: job.id,
        queue: queue.name,
        duration: Date.now() - job.timestamp,
      });
    });
    
    queue.on('failed', (job, err) => {
      logger.error(`Job ${job.id} falhado na fila ${queue.name}`, {
        jobId: job.id,
        queue: queue.name,
        error: err.message,
        attempts: job.attemptsMade,
      });
    });
    
    queue.on('stalled', (job) => {
      logger.warn(`Job ${job.id} travado na fila ${queue.name}`, {
        jobId: job.id,
        queue: queue.name,
      });
    });
    
    queue.on('error', (error) => {
      logger.error(`Erro na fila ${queue.name}`, { error: error.message });
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
        logger.debug(`Processando job ${job.id} na fila ${queueName}`);
        
        const result = await processor(job);
        const duration = Date.now() - startTime;
        
        const jobResult: JobResult = {
          success: true,
          result,
          duration,
          timestamp: new Date(),
        };
        
        return jobResult;
      } catch (error) {
        const duration = Date.now() - startTime;
        const jobResult: JobResult = {
          success: false,
          error: (error as Error).message,
          duration,
          timestamp: new Date(),
        };
        
        throw error;
      }
    });
    
    logger.info(`Processador registrado para fila ${queueName} com concorrência ${concurrency}`);
  }
  
  // Adicionar job à fila
  async addJob(queueName: string, data: any, options: any = {}): Promise<Queue.Job> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Fila ${queueName} não encontrada`);
    }
    
    const job = await queue.add(data, {
      priority: options.priority || 0,
      delay: options.delay || 0,
      repeat: options.repeat,
      ...options,
    });
    
    logger.debug(`Job ${job.id} adicionado à fila ${queueName}`);
    return job;
  }
  
  // Obter estatísticas de uma fila
  async getQueueStats(queueName: string): Promise<QueueStats | null> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return null;
    }
    
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
    
    await queue.clean(grace, type as any);
    logger.info(`Fila ${queueName} limpa (tipo: ${type}, grace: ${grace})`);
  }
  
  // Fechar todas as filas
  async closeAll(): Promise<void> {
    const promises = Array.from(this.queues.values()).map(queue => queue.close());
    await Promise.all(promises);
    
    this.queues.clear();
    this.processors.clear();
    
    logger.info('Todas as filas foram fechadas');
  }
  
  // Configurar jobs recorrentes
  async setupRecurringJobs(): Promise<void> {
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
  }
  
  // Monitoramento de saúde das filas
  async healthCheck(): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
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
    
    switch (type) {
      case 'resize':
        // Implementar redimensionamento
        break;
      case 'optimize':
        // Implementar otimização
        break;
      case 'thumbnail':
        // Implementar criação de thumbnail
        break;
      default:
        throw new Error(`Tipo de processamento não suportado: ${type}`);
    }
  }, 2); // 2 processamentos simultâneos
  
  queueManager.registerProcessor('backup', async (job) => {
    const { backupService } = require('../scripts/backup');
    return await backupService.performFullBackup();
  }, 1); // 1 backup por vez
  
  queueManager.registerProcessor('cleanup', async (job) => {
    const { type } = job.data;
    
    switch (type) {
      case 'cache':
        // Limpar cache expirado
        break;
      case 'logs':
        // Limpar logs antigos
        break;
      case 'files':
        // Limpar arquivos temporários
        break;
      default:
        throw new Error(`Tipo de limpeza não suportado: ${type}`);
    }
  }, 1);
  
  // Configurar jobs recorrentes
  await queueManager.setupRecurringJobs();
  
  logger.info('Filas configuradas com sucesso');
};

export default queueManager;