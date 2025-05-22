import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import RedisStore from 'connect-redis';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import cluster from 'cluster';
import os from 'os';

// Carregar variáveis de ambiente primeiro
dotenv.config();

// Módulos customizados
import { connectDB, createIndexes } from './config/db';
import redisClient from './config/redis';
import logger, { stream } from './config/logger';
import { errorHandler, notFoundHandler, gracefulShutdownHandler } from './core/error';
import { initializeWebSockets } from './websockets';
import { initializeJobs } from './jobs';
import securityMiddleware from './api/middleware/security';

// Rotas
import authRoutes from './api/routes/auth.routes';
import projectRoutes from './api/routes/project.routes';
import certificateRoutes from './api/routes/certificate.routes';
import userRoutes from './api/routes/user.routes';
import adminRoutes from './api/routes/admin.routes';
import aiRoutes from './api/routes/ai.routes';

// Configuração do cluster em produção
if (process.env.NODE_ENV === 'production' && cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  
  logger.info(`Iniciando ${numCPUs} workers`);
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    logger.error(`Worker ${worker.process.pid} morreu`);
    cluster.fork();
  });
} else {
  // Worker process
  startServer();
}

async function startServer() {
  const app: Application = express();
  
  // Configurações básicas
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  
  // Middleware de segurança (aplicar primeiro)
  app.use(securityMiddleware.helmetConfig);
  app.use(securityMiddleware.securityLogger);
  app.use(securityMiddleware.hppProtection);
  
  // CORS configurado
  app.use(cors({
    origin: function (origin, callback) {
      const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Não permitido pelo CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-New-Token'],
  }));
  
  // Middleware básico
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  }));
  
  // Rate limiting
  app.use(securityMiddleware.mainRateLimit);
  app.use(securityMiddleware.speedLimiter);
  
  // Parsing
  app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
      // Verificar se JSON é válido
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        throw new Error('JSON inválido');
      }
    }
  }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(process.env.COOKIE_SECRET));
  
  // Proteção XSS e SQL Injection
  app.use(securityMiddleware.xssProtection);
  app.use(securityMiddleware.sqlInjectionProtection);
  
  // Logging HTTP
  app.use(require('morgan')('combined', { stream }));
  
  // Servir arquivos estáticos com cache
  app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
    maxAge: '1d',
    etag: true,
    lastModified: true,
  }));
  
  try {
    // Inicializar serviços
    logger.info('Inicializando serviços...');
    
    // 1. Conectar Redis
    await redisClient.connect();
    
    // 2. Conectar MongoDB
    await connectDB();
    
    // 3. Criar índices em produção
    if (process.env.NODE_ENV === 'production') {
      await createIndexes();
    }
    
    // 4. Configurar sessões com Redis
    const redisStore = new RedisStore({
      client: redisClient.getClient(),
      prefix: 'sess:',
    });
    
    app.use(session({
      store: redisStore,
      secret: process.env.SESSION_SECRET || 'default-session-secret',
      name: 'sessionId',
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      },
    }));
    
    // 5. Documentação API
    try {
      const swaggerDocument = YAML.load(path.join(__dirname, 'docs/swagger.yaml'));
      app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Portfolio API Documentation',
      }));
    } catch (error) {
      logger.warn(`Não foi possível carregar documentação Swagger: ${error}`);
    }
    
    // 6. Health check
    app.get('/health', async (req: Request, res: Response) => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        services: {
          mongodb: 'connected',
          redis: redisClient.isConnected ? 'connected' : 'disconnected',
        },
        memory: process.memoryUsage(),
        pid: process.pid,
      };
      
      res.status(200).json(health);
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
    
    // 7. Iniciar servidor
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Servidor rodando na porta ${PORT} - Processo ${process.pid}`);
      logger.info(`📖 Documentação disponível em http://localhost:${PORT}/api-docs`);
    });
    
    // 8. Configurar timeouts
    server.timeout = 30000; // 30 segundos
    server.keepAliveTimeout = 65000; // 65 segundos
    server.headersTimeout = 66000; // 66 segundos
    
    // 9. WebSockets
    initializeWebSockets(server);
    
    // 10. Background jobs
    initializeJobs();
    
    // 11. Graceful shutdown
    gracefulShutdownHandler(server);
    
    // Monitoramento de performance
    if (process.env.NODE_ENV === 'production') {
      setInterval(() => {
        const used = process.memoryUsage();
        logger.info('Uso de memória:', {
          rss: Math.round(used.rss / 1024 / 1024 * 100) / 100 + ' MB',
          heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100 + ' MB',
          heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100 + ' MB',
          external: Math.round(used.external / 1024 / 1024 * 100) / 100 + ' MB',
        });
      }, 60000); // A cada minuto
    }
    
    return server;
  } catch (error: any) {
    logger.error(`❌ Erro ao inicializar aplicação: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

// Handlers de erro não capturado
process.on('unhandledRejection', (err: Error) => {
  logger.error(`Rejeição não tratada: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

process.on('uncaughtException', (err: Error) => {
  logger.error(`Exceção não capturada: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});