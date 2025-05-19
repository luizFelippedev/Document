import Queue from 'bull';
import { clearExpiredNotifications } from '../websockets/notifications';
import logger from '../config/logger';

// Job Queues
let emailQueue: Queue.Queue;
let imageProcessingQueue: Queue.Queue;
let cleanupQueue: Queue.Queue;

/**
 * Initialize all job queues
 */
export const initializeJobs = (): void => {
  try {
    // Configure Redis connection for Bull
    const redisConfig = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    };
    
    // Create queues
    emailQueue = new Queue('email', redisConfig);
    imageProcessingQueue = new Queue('image-processing', redisConfig);
    cleanupQueue = new Queue('cleanup', redisConfig);
    
    // Process email queue
    emailQueue.process(async (job) => {
      try {
        const emailProcessor = require('./email.processor').default;
        return await emailProcessor.processJob(job);
      } catch (error) {
        logger.error(`Error processing email job: ${error}`);
        throw error;
      }
    });
    
    // Process image queue
    imageProcessingQueue.process(async (job) => {
      try {
        const imageProcessor = require('./image.processor').default;
        return await imageProcessor.processJob(job);
      } catch (error) {
        logger.error(`Error processing image job: ${error}`);
        throw error;
      }
    });
    
    // Process cleanup queue
    cleanupQueue.process(async (_job) => {
      try {
        await clearExpiredNotifications();
        
        // Additional cleanup tasks can be added here
        // For example:
        // - Delete temporary files
        // - Archive old data
        // - Update statistics
        
        return { success: true, timestamp: new Date() };
      } catch (error) {
        logger.error(`Error in cleanup job: ${error}`);
        throw error;
      }
    });
    
    // Schedule cleanup job to run every day at midnight
    cleanupQueue.add(
      {},
      {
        repeat: {
          cron: '0 0 * * *', // Every day at midnight
        },
      }
    );
    
    // Handle completed jobs
    emailQueue.on('completed', (job) => {
      logger.info(`Email job ${job.id} completed`);
    });
    
    imageProcessingQueue.on('completed', (job) => {
      logger.info(`Image processing job ${job.id} completed`);
    });
    
    cleanupQueue.on('completed', (job) => {
      logger.info(`Cleanup job ${job.id} completed`);
    });
    
    // Handle failed jobs
    emailQueue.on('failed', (job, error) => {
      logger.error(`Email job ${job?.id} failed: ${error}`);
    });
    
    imageProcessingQueue.on('failed', (job, error) => {
      logger.error(`Image processing job ${job?.id} failed: ${error}`);
    });
    
    cleanupQueue.on('failed', (job, error) => {
      logger.error(`Cleanup job ${job?.id} failed: ${error}`);
    });
    
    logger.info('Job queues initialized successfully');
  } catch (error) {
    logger.error(`Error initializing job queues: ${error}`);
    throw error;
  }
};

/**
 * Get the email queue
 * @returns Email queue
 */
export const getEmailQueue = (): Queue.Queue => {
  if (!emailQueue) {
    throw new Error('Email queue not initialized');
  }
  return emailQueue;
};

/**
 * Get the image processing queue
 * @returns Image processing queue
 */
export const getImageProcessingQueue = (): Queue.Queue => {
  if (!imageProcessingQueue) {
    throw new Error('Image processing queue not initialized');
  }
  return imageProcessingQueue;
};

/**
 * Get the cleanup queue
 * @returns Cleanup queue
 */
export const getCleanupQueue = (): Queue.Queue => {
  if (!cleanupQueue) {
    throw new Error('Cleanup queue not initialized');
  }
  return cleanupQueue;
};

export default {
  initializeJobs,
  getEmailQueue,
  getImageProcessingQueue,
  getCleanupQueue,
};