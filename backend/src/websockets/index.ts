// backend/src/websockets/index.ts - VERSÃO CORRIGIDA
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../config/logger';
import { cacheGet, cacheSet } from '../config/redis';
import User from '../api/models/user.model';
import { setupNotificationsHandlers } from './notifications';
import { setupChatHandlers } from './chat';

// Map de usuários conectados
const userSocketMap: Map<string, Set<string>> = new Map();

// Instância do servidor Socket.IO
let io: Server;

/**
 * Inicializar WebSockets
 * @param server Instância do servidor HTTP
 */
export const initializeWebSockets = (server: HttpServer): void => {
  try {
    io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      path: '/socket.io',
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e6, // 1MB
      allowEIO3: true,
    });

    // Middleware de autenticação
    io.use(async (socket, next) => {
      try {
        // Obter token do handshake
        const token = socket.handshake.auth.token as string;

        if (!token) {
          return next(new Error('Token de autenticação não fornecido'));
        }

        // Verificar se o token está na blacklist
        const isBlacklisted = await cacheGet<boolean>(`token_blacklist:${token}`);
        if (isBlacklisted) {
          return next(new Error('Token inválido ou expirado'));
        }

        // Verificar token JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        if (!decoded || !decoded.id) {
          return next(new Error('Token inválido'));
        }

        // Buscar usuário no cache ou banco de dados
        let user: any;
        const cachedUser = await cacheGet<any>(`user:${decoded.id}`);

        if (cachedUser) {
          user = cachedUser;
        } else {
          user = await User.findById(decoded.id).select('-password');

          if (!user) {
            return next(new Error('Usuário não encontrado'));
          }

          // Cache do usuário por 10 minutos
          await cacheSet(`user:${decoded.id}`, user, 600);
        }

        // Verificar se o usuário está ativo
        if (!user.active) {
          return next(new Error('Conta de usuário inativa'));
        }

        // Armazenar dados do usuário no socket
        socket.data.userId = decoded.id;
        socket.data.user = {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        };

        next();
      } catch (error) {
        logger.error(`Erro na autenticação do socket: ${error}`);
        next(new Error('Erro de autenticação'));
      }
    });

    // Manipular conexões
    io.on('connection', (socket: Socket) => {
      const userId = socket.data.userId;
      
      if (!userId) {
        socket.disconnect();
        return;
      }

      // Adicionar socket ao mapa de usuários
      if (!userSocketMap.has(userId)) {
        userSocketMap.set(userId, new Set());
      }
      userSocketMap.get(userId)?.add(socket.id);

      logger.info(`Usuário ${userId} conectado com socket ${socket.id}`);

      // Entrar na sala específica do usuário
      socket.join(`user:${userId}`);

      // Configurar handlers
      setupNotificationsHandlers(socket);
      setupChatHandlers(socket);

      // Manipular eventos personalizados
      socket.on('user:status', (data: { status: 'online' | 'away' | 'busy' }) => {
        // Broadcast do status do usuário para contatos
        socket.broadcast.emit('user:status-update', {
          userId,
          status: data.status,
          timestamp: new Date(),
        });
      });

      // Manipular inscrição em projetos
      socket.on('subscribe:project', (projectId: string) => {
        if (projectId && typeof projectId === 'string') {
          socket.join(`project:${projectId}`);
          logger.debug(`Socket ${socket.id} inscrito no projeto ${projectId}`);
        }
      });

      // Manipular cancelamento de inscrição em projetos
      socket.on('unsubscribe:project', (projectId: string) => {
        if (projectId && typeof projectId === 'string') {
          socket.leave(`project:${projectId}`);
          logger.debug(`Socket ${socket.id} desinscrito do projeto ${projectId}`);
        }
      });

      // Manipular heartbeat para manter conexão
      socket.on('ping', () => {
        socket.emit('pong', { 
          timestamp: Date.now(),
          userId: socket.data.userId 
        });
      });

      // Manipular erro
      socket.on('error', (error) => {
        logger.error(`Erro no socket ${socket.id}: ${error}`);
      });

      // Manipular desconexão
      socket.on('disconnect', (reason) => {
        // Remover socket do mapa de usuários
        const userSockets = userSocketMap.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            userSocketMap.delete(userId);
            
            // Notificar outros usuários que este usuário ficou offline
            socket.broadcast.emit('user:status-update', {
              userId,
              status: 'offline',
              timestamp: new Date(),
            });
          }
        }
        
        logger.info(`Usuário ${userId} desconectou socket ${socket.id} - Razão: ${reason}`);
      });

      // Enviar evento de conexão bem-sucedida
      socket.emit('connected', {
        message: 'Conectado ao servidor WebSocket',
        userId: socket.data.userId,
        timestamp: new Date(),
      });
    });

    // Manipular erros do servidor Socket.IO
    io.engine.on('connection_error', (err) => {
      logger.error(`Erro de conexão Socket.IO: ${err.req ? err.req.url : 'N/A'} - ${err.message}`);
    });

    logger.info('✅ Servidor WebSocket inicializado com sucesso');
  } catch (error) {
    logger.error(`❌ Erro ao inicializar WebSocket: ${error}`);
    throw error;
  }
};

/**
 * Obter instância do IO
 */
export const getIo = (): Server => {
  if (!io) {
    throw new Error('Socket.IO não foi inicializado');
  }
  return io;
};

/**
 * Enviar mensagem para um usuário específico
 * @param userId ID do usuário
 * @param event Nome do evento
 * @param data Dados do evento
 */
export const sendWebSocketMessage = (
  userId: string,
  event: string,
  data: any
): boolean => {
  if (!io) {
    logger.warn('Servidor WebSocket não inicializado');
    return false;
  }

  try {
    // Emitir para a sala específica do usuário
    io.to(`user:${userId}`).emit(event, data);
    return true;
  } catch (error) {
    logger.error(`Erro ao enviar mensagem WebSocket para ${userId}: ${error}`);
    return false;
  }
};

/**
 * Enviar mensagem para uma sala de projeto
 * @param projectId ID do projeto
 * @param event Nome do evento
 * @param data Dados do evento
 */
export const sendProjectMessage = (
  projectId: string,
  event: string,
  data: any
): boolean => {
  if (!io) {
    logger.warn('Servidor WebSocket não inicializado');
    return false;
  }

  try {
    // Emitir para a sala específica do projeto
    io.to(`project:${projectId}`).emit(event, data);
    return true;
  } catch (error) {
    logger.error(`Erro ao enviar mensagem para projeto ${projectId}: ${error}`);
    return false;
  }
};

/**
 * Broadcast de mensagem para todos os clientes conectados
 * @param event Nome do evento
 * @param data Dados do evento
 */
export const broadcastMessage = (event: string, data: any): boolean => {
  if (!io) {
    logger.warn('Servidor WebSocket não inicializado');
    return false;
  }

  try {
    // Emitir para todos os clientes conectados
    io.emit(event, data);
    return true;
  } catch (error) {
    logger.error(`Erro ao fazer broadcast: ${error}`);
    return false;
  }
};

/**
 * Obter número de usuários conectados
 * @returns Número de usuários conectados
 */
export const getConnectedUsersCount = (): number => {
  return userSocketMap.size;
};

/**
 * Obter lista de usuários conectados
 * @returns Array de IDs de usuários conectados
 */
export const getConnectedUsers = (): string[] => {
  return Array.from(userSocketMap.keys());
};

/**
 * Verificar se um usuário está online
 * @param userId ID do usuário
 * @returns True se o usuário estiver online
 */
export const isUserOnline = (userId: string): boolean => {
  return userSocketMap.has(userId);
};

/**
 * Desconectar um usuário específico
 * @param userId ID do usuário
 * @param reason Razão da desconexão
 */
export const disconnectUser = (userId: string, reason: string = 'Admin disconnect'): void => {
  const userSockets = userSocketMap.get(userId);
  
  if (userSockets) {
    userSockets.forEach(socketId => {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
        logger.info(`Usuário ${userId} desconectado pelo admin: ${reason}`);
      }
    });
  }
};

export default {
  initializeWebSockets,
  sendWebSocketMessage,
  sendProjectMessage,
  broadcastMessage,
  getConnectedUsersCount,
  getConnectedUsers,
  isUserOnline,
  disconnectUser,
  getIo,
};