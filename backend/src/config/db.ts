import mongoose, { ConnectOptions } from 'mongoose';
import logger from './logger';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio';

let isConnectedBefore = false;
let connectionAttempts = 0;
const maxConnectionAttempts = 5;

const connectDB = async (): Promise<typeof mongoose | null> => {
  try {
    if (mongoose.connection.readyState === 1) {
      logger.info('MongoDB já está conectado');
      return mongoose;
    }

    // Configurações otimizadas
    const options: ConnectOptions = {
      // Performance
      maxPoolSize: 10, // Manter até 10 conexões no pool
      minPoolSize: 2, // Manter pelo menos 2 conexões
      maxIdleTimeMS: 30000, // Fechar conexões após 30s de inatividade
      
      // Timeouts
      serverSelectionTimeoutMS: 5000, // 5s para selecionar servidor
      socketTimeoutMS: 45000, // 45s para operações
      connectTimeoutMS: 10000, // 10s para conectar
      
      // Configurações de rede
      family: 4, // Usar IPv4
      keepAlive: true,
      keepAliveInitialDelay: 300000,
      
      // Buffer
      bufferMaxEntries: 0, // Desabilitar buffering
      
      // Monitoramento
      heartbeatFrequencyMS: 10000, // 10s entre heartbeats
      
      // Compressão
      compressors: ['snappy', 'zlib'],
      
      // Leitura/Escrita
      readPreference: 'primary',
      readConcern: { level: 'local' },
      writeConcern: { w: 'majority', wtimeout: 5000 },
    };

    // Tentar conexão
    connectionAttempts++;
    logger.info(`Tentativa de conexão MongoDB ${connectionAttempts}/${maxConnectionAttempts}`);
    
    const conn = await mongoose.connect(MONGO_URI, options);

    logger.info(`✅ MongoDB conectado: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    isConnectedBefore = true;
    connectionAttempts = 0;

    // Event listeners otimizados
    mongoose.connection.on('error', (err) => {
      logger.error(`❌ Erro MongoDB: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB desconectado');
      isConnectedBefore = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('✅ MongoDB reconectado');
      isConnectedBefore = true;
    });

    // Configurar índices automáticos apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('autoIndex', true);
    } else {
      mongoose.set('autoIndex', false);
    }

    // Configurações de debugging apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', (collectionName: string, method: string, query: any, doc: any) => {
        logger.debug(`MongoDB: ${collectionName}.${method}`, { query, doc });
      });
    }

    // Graceful shutdown
    const gracefulShutdown = () => {
      mongoose.connection.close(() => {
        logger.info('🛑 Conexão MongoDB encerrada');
        process.exit(0);
      });
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGUSR2', gracefulShutdown); // Para Nodemon

    return mongoose;
  } catch (error: any) {
    logger.error(`❌ Falha na conexão MongoDB: ${error.message}`);
    
    // Retry com backoff exponencial
    if (connectionAttempts < maxConnectionAttempts) {
      const delay = Math.pow(2, connectionAttempts) * 1000; // 2s, 4s, 8s, 16s, 32s
      logger.info(`Tentando reconectar em ${delay}ms...`);
      
      setTimeout(() => {
        connectDB();
      }, delay);
      
      return null;
    } else {
      logger.error('❌ Número máximo de tentativas de conexão excedido');
      process.exit(1);
    }
  }
};

// Verificar status da conexão
export const checkDBConnection = (): boolean => {
  return mongoose.connection.readyState === 1;
};

// Obter estatísticas da conexão
export const getDBStats = async () => {
  if (!checkDBConnection()) {
    throw new Error('Database não conectado');
  }
  
  const stats = await mongoose.connection.db.stats();
  return {
    connected: true,
    database: mongoose.connection.name,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    collections: stats.collections,
    dataSize: stats.dataSize,
    storageSize: stats.storageSize,
    indexes: stats.indexes,
    indexSize: stats.indexSize,
  };
};

// Criar índices em produção
export const createIndexes = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    try {
      // Aguardar conexão estar pronta
      if (mongoose.connection.readyState !== 1) {
        await new Promise(resolve => {
          mongoose.connection.once('connected', resolve);
        });
      }
      
      // Criar índices para melhor performance
      const collections = await mongoose.connection.db.listCollections().toArray();
      
      for (const collection of collections) {
        const collectionName = collection.name;
        logger.info(`Criando índices para ${collectionName}...`);
        
        // Índices específicos por collection podem ser adicionados aqui
        switch (collectionName) {
          case 'users':
            await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
            await mongoose.connection.db.collection('users').createIndex({ role: 1, active: 1 });
            break;
          case 'projects':
            await mongoose.connection.db.collection('projects').createIndex({ owner: 1, status: 1 });
            await mongoose.connection.db.collection('projects').createIndex({ visibility: 1, featured: 1 });
            break;
        }
      }
      
      logger.info('✅ Índices criados com sucesso');
    } catch (error) {
      logger.error(`❌ Erro ao criar índices: ${error}`);
    }
  }
};

export const getMongoose = (): typeof mongoose => mongoose;

export { connectDB };

export default { 
  connectDB, 
  checkDBConnection, 
  getDBStats, 
  createIndexes, 
  getMongoose 
};