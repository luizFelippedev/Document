// 4.7 - src/index.ts - CORREÇÃO PRINCIPAL
import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import morgan from 'morgan';

dotenv.config();

import { connectDB } from './config/db';
import redisClient from './config/redis';
import logger, { stream } from './config/logger';
import { errorHandler, notFoundHandler } from './core/error';
import { initializeWebSockets } from './websockets';
import { createInitialAdmin } from './utils/createInitialAdmin';

// Security middleware
import { 
  helmetConfig, 
  mainRateLimit, 
  speedLimiter, 
  xssProtection, 
  securityLogger, 
  hppProtection 
} from './api/middleware/security';

// Routes
import authRoutes from './api/routes/auth.routes';
import projectRoutes from './api/routes/project.routes';
import certificateRoutes from './api/routes/certificate.routes';
import userRoutes from './api/routes/user.routes';
import adminRoutes from './api/routes/admin.routes';
import aiRoutes from './api/routes/ai.routes';

async function startServer() {
  const app: Application = express();
  
  // Trust proxy
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  
  // Security middleware
  app.use(helmetConfig);
  app.use(securityLogger);
  app.use(hppProtection);
  
  // CORS
  app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  }));
  
  // Basic middleware
  app.use(compression());
  app.use(mainRateLimit);
  app.use(speedLimiter);
  
  // Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  
  // Security
  app.use(xssProtection);
  
  // Logging
  app.use(morgan('combined', { stream }));
  
  // Static files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  
  try {
    // Initialize services
    logger.info('🚀 Starting server...');
    
    // Connect to MongoDB
    await connectDB();
    
    // Connect to Redis
    try {
      await redisClient.connect();
      logger.info('✅ Redis connected');
    } catch (error) {
      logger.warn('⚠️ Redis unavailable, continuing without cache');
    }
    
    // Create initial admin
    await createInitialAdmin();
    
    // Health check
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          mongodb: 'connected',
          redis: redisClient.isConnected ? 'connected' : 'disconnected',
        },
      });
    });
    
    // API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/projects', projectRoutes);
    app.use('/api/certificates', certificateRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/ai', aiRoutes);
    
    // Error handling
    app.use(notFoundHandler);
    app.use(errorHandler);
    
    // Start server
    const PORT = process.env.PORT || 5001;
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });
    
    // Initialize WebSockets
    initializeWebSockets(server);
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });
    
    return server;
  } catch (error: any) {
    logger.error(`❌ Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

startServer().then(() => {
  logger.info('✅ Application started successfully');
}).catch((error) => {
  logger.error(`❌ Failed to start application: ${error}`);
  process.exit(1);
});