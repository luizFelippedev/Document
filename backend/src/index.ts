import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import RedisStore from 'connect-redis';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

// Load environment variables
dotenv.config();

// Import custom modules
import { connectDB } from './config/db';
import redisClient from './config/redis';
import logger, { stream } from './config/logger';
import { errorHandler, notFoundHandler } from './core/error';
import { initializeWebSockets } from './websockets';
import { initializeJobs } from './jobs';

// Import routes
import authRoutes from './api/routes/auth.routes';
import projectRoutes from './api/routes/project.routes';
import certificateRoutes from './api/routes/certificate.routes';
import userRoutes from './api/routes/user.routes';
import adminRoutes from './api/routes/admin.routes';
import aiRoutes from './api/routes/ai.routes';

// Initialize express app
const app: Application = express();

// Set trusted proxies (for production behind load balancer)
app.set('trust proxy', 1);

// Configure basic middleware that doesn't depend on external services
app.use(helmet()); // Set security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(compression()); // Compress responses
app.use(morgan('combined', { stream })); // HTTP request logging
app.use(express.json({ limit: '10mb' })); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded request bodies
app.use(cookieParser(process.env.COOKIE_SECRET || 'your-secret-key')); // Parse cookies

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Function to initialize the application
async function initializeApp() {
  try {
    // Step 1: Connect to Redis
    logger.info('Conectando ao Redis...');
    await redisClient.connect();
    logger.info('Redis conectado com sucesso');

    // Step 2: Connect to MongoDB
    logger.info('Conectando ao MongoDB...');
    await connectDB();
    logger.info('MongoDB conectado com sucesso');

    // Step 3: Configure Redis-dependent services
    // Configure Redis session store after Redis is connected
    const redisSessionStore = new RedisStore({
      client: redisClient.getClient(),
      prefix: 'session:',
    });

    // Configure sessions
    app.use(session({
      store: redisSessionStore,
      secret: process.env.SESSION_SECRET || 'your-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      },
      name: 'sid', // Custom session ID cookie name
    }));

    // Step 4: Load Swagger documentation
    try {
      const swaggerDocument = YAML.load(path.join(__dirname, 'docs/swagger.yaml'));
      app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    } catch (error) {
      logger.warn(`Could not load Swagger documentation: ${error}`);
    }

    // Step 5: Set up routes
    // Health check endpoint
    app.get('/health', (_req: Request, res: Response) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        mongodb: 'connected',
        redis: redisClient.isConnected ? 'connected' : 'disconnected',
      });
    });

    // API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/projects', projectRoutes);
    app.use('/api/certificates', certificateRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/ai', aiRoutes);

    // 404 handler
    app.use(notFoundHandler);

    // Error handler
    app.use(errorHandler);

    // Step 6: Start server
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    // Step 7: Initialize WebSockets after server is created
    initializeWebSockets(server);

    // Step 8: Initialize background jobs
    initializeJobs();

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    return server;
  } catch (error: any) {
    logger.error(`Error initializing application: ${error.message}`);
    logger.error(error.stack || '');
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  logger.error(err.stack || '');
  // Keep the server running even if there's an unhandled rejection
});

// Start the application
const server = initializeApp();

export default server;