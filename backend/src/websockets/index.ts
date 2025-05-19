import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../config/logger';
import { cacheGet, cacheSet } from '../config/redis';
import User from '../api/models/user.model';

// Map of user IDs to socket IDs
const userSocketMap: Map<string, Set<string>> = new Map();

// Socket.IO server instance
let io: Server;

/**
 * Initialize WebSockets
 * @param server HTTP server instance
 */
export const initializeWebSockets = (server: HttpServer): void => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io',
  });

  // Handle socket authentication and connection
  io.use(async (socket, next) => {
    try {
      // Get token from handshake auth
      const token = socket.handshake.auth.token as string;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      // Check token blacklist
      const isBlacklisted = await cacheGet<boolean>(`token_blacklist:${token}`);
      if (isBlacklisted) {
        return next(new Error('Token is invalid'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      if (!decoded || !decoded.id) {
        return next(new Error('Invalid token'));
      }

      // Get user from database or cache
      const cachedUser = await cacheGet<any>(`user:${decoded.id}`);
      let user: any;

      if (cachedUser) {
        user = cachedUser;
      } else {
        user = await User.findById(decoded.id).select('-password');

        if (!user) {
          return next(new Error('User not found'));
        }

        // Cache user for future requests (10 minutes)
        await cacheSet(`user:${decoded.id}`, user, 600);
      }

      // Check if user is active
      if (!user.active) {
        return next(new Error('User account is inactive'));
      }

      // Store user ID in socket
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
      logger.error(`Socket authentication error: ${error}`);
      next(new Error('Authentication error'));
    }
  }).on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    if (!userId) {
      socket.disconnect();
      return;
    }

    // Add socket to user map
    if (!userSocketMap.has(userId)) {
      userSocketMap.set(userId, new Set());
    }
    userSocketMap.get(userId)?.add(socket.id);

    logger.info(`User ${userId} connected with socket ${socket.id}`);

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Handle disconnection
    socket.on('disconnect', () => {
      // Remove socket from user map
      const userSockets = userSocketMap.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          userSocketMap.delete(userId);
        }
      }
      logger.info(`User ${userId} disconnected socket ${socket.id}`);
    });

    // Handle subscription to projects
    socket.on('subscribe:project', (projectId: string) => {
      socket.join(`project:${projectId}`);
      logger.debug(`Socket ${socket.id} subscribed to project ${projectId}`);
    });

    // Handle unsubscription from projects
    socket.on('unsubscribe:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
      logger.debug(`Socket ${socket.id} unsubscribed from project ${projectId}`);
    });

    // Handle heartbeat to keep connection alive
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  });

  logger.info('WebSocket server initialized');
};

/**
 * Send a message to a specific user
 * @param userId User ID
 * @param event Event name
 * @param data Event data
 */
export const sendWebSocketMessage = (
  userId: string,
  event: string,
  data: any
): void => {
  if (!io) {
    logger.warn('WebSocket server not initialized');
    return;
  }

  // Emit to user-specific room
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Send a message to a project room
 * @param projectId Project ID
 * @param event Event name
 * @param data Event data
 */
export const sendProjectMessage = (
  projectId: string,
  event: string,
  data: any
): void => {
  if (!io) {
    logger.warn('WebSocket server not initialized');
    return;
  }

  // Emit to project-specific room
  io.to(`project:${projectId}`).emit(event, data);
};

/**
 * Broadcast a message to all connected clients
 * @param event Event name
 * @param data Event data
 */
export const broadcastMessage = (event: string, data: any): void => {
  if (!io) {
    logger.warn('WebSocket server not initialized');
    return;
  }

  // Emit to all connected clients
  io.emit(event, data);
};

/**
 * Get the number of connected users
 * @returns Number of connected users
 */
export const getConnectedUsersCount = (): number => {
  return userSocketMap.size;
};

export default {
  initializeWebSockets,
  sendWebSocketMessage,
  sendProjectMessage,
  broadcastMessage,
  getConnectedUsersCount,
};