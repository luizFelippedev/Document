import mongoose, { ConnectOptions } from 'mongoose';
import logger from './logger';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/default';

let isConnectedBefore = false;

const connectDB = async (): Promise<typeof mongoose | null> => {
  try {
    if (mongoose.connection.readyState === 1) {
      logger.info('MongoDB já está conectado.');
      return mongoose;
    }

    const options: ConnectOptions = {
      autoIndex: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    const conn = await mongoose.connect(MONGO_URI, options);

    logger.info(`✅ MongoDB conectado em: ${conn.connection.host}`);
    isConnectedBefore = true;

    mongoose.connection.on('error', (err) => {
      logger.error(`❌ Erro na conexão MongoDB: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      if (!isConnectedBefore) {
        logger.warn('⚠️ MongoDB desconectado inesperadamente.');
      } else {
        logger.info('ℹ️ MongoDB desconectado com sucesso.');
      }
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('🛑 Conexão com MongoDB encerrada por término do app');
      process.exit(0);
    });

    return mongoose;
  } catch (error: any) {
    logger.error(`❌ Falha ao conectar no MongoDB: ${error.message}`);
    process.exit(1);
    return null;
  }
};

// Verifica se a conexão está ativa
export const checkDBConnection = (): boolean => {
  return mongoose.connection.readyState === 1;
};

// Retorna instância atual
export const getMongoose = (): typeof mongoose => {
  return mongoose;
};

export { connectDB };
export default { connectDB, checkDBConnection, getMongoose };
