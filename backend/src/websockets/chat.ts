import { Socket } from 'socket.io';
import { Types } from 'mongoose';
import { sendWebSocketMessage } from './index';
import logger from '../config/logger';
import User from '../api/models/user.model';
import { moderateContent } from '../lib/openai';
import { cacheGet, cacheSet } from '../config/redis';

// Chat message interface
interface ChatMessage {
  id: string;
  sender: {
    id: string;
    name: string;
  };
  receiver?: {
    id: string;
    name: string;
  };
  projectId?: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Max messages to keep per chat
const MAX_MESSAGES_PER_CHAT = 100;

// Redis key expiration (30 days)
const REDIS_EXPIRY = 60 * 60 * 24 * 30;

// Generate a chat room ID
const getChatRoomId = (userId1: string, userId2: string): string => {
  // Sort IDs to ensure consistent room ID regardless of order
  return `chat:${[userId1, userId2].sort().join('-')}`;
};

// Generate a project chat room ID
const getProjectChatRoomId = (projectId: string): string => {
  return `chat:project-${projectId}`;
};

// Store message in Redis
const storeMessage = async (roomId: string, message: ChatMessage): Promise<void> => {
  try {
    // Get existing messages
    const existingMessages = await getChatMessages(roomId);
    
    // Add new message
    const messages = [...existingMessages, message];
    
    // Limit to most recent MAX_MESSAGES_PER_CHAT messages
    const limitedMessages = messages.slice(-MAX_MESSAGES_PER_CHAT);
    
    // Store in Redis with 30-day expiration
    await cacheSet(roomId, limitedMessages, REDIS_EXPIRY);
  } catch (error) {
    logger.error(`Error storing message in Redis: ${error}`);
  }
};

// Get messages from Redis
const getChatMessages = async (roomId: string): Promise<ChatMessage[]> => {
  try {
    return await cacheGet<ChatMessage[]>(roomId) || [];
  } catch (error) {
    logger.error(`Error retrieving messages from Redis: ${error}`);
    return [];
  }
};

/**
 * Handle chat-related WebSocket events
 * @param socket WebSocket connection
 */
export const setupChatHandlers = (socket: Socket): void => {
  const userId = socket.data.userId;
  if (!userId) return;
  
  // Join user's own room
  socket.join(`user:${userId}`);
  
  // Handle direct message to user
  socket.on('chat:direct-message', async (data: {
    receiverId: string;
    message: string;
  }) => {
    try {
      const { receiverId, message } = data;
      
      if (!message || !receiverId) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }
      
      // Check message content moderation
      try {
        const moderationResult = await moderateContent(message);
        
        if (moderationResult.flagged) {
          socket.emit('error', { 
            message: 'Your message was flagged for inappropriate content and not sent' 
          });
          return;
        }
      } catch (error) {
        logger.error(`Error moderating chat message: ${error}`);
        // Continue without moderation in case of API error
      }
      
      // Verify receiver exists
      const receiver = await User.findById(receiverId).select('firstName lastName');
      
      if (!receiver) {
        socket.emit('error', { message: 'Recipient not found' });
        return;
      }
      
      // Create chat message
      const chatMessage: ChatMessage = {
        id: new Types.ObjectId().toString(),
        sender: {
          id: userId,
          name: `${socket.data.user.firstName} ${socket.data.user.lastName}`,
        },
        receiver: {
          id: receiverId,
          name: `${receiver.firstName} ${receiver.lastName}`,
        },
        message,
        timestamp: new Date(),
        read: false,
      };
      
      // Get chat room ID
      const roomId = getChatRoomId(userId, receiverId);
      
      // Store message in Redis
      await storeMessage(roomId, chatMessage);
      
      // Send to sender
      socket.emit('chat:message', chatMessage);
      
      // Send to receiver
      sendWebSocketMessage(receiverId, 'chat:message', chatMessage);
      
      logger.debug(`Direct message sent from ${userId} to ${receiverId}`);
    } catch (error) {
      logger.error(`Error handling direct message: ${error}`);
      socket.emit('error', { message: 'Error sending message' });
    }
  });
  
  // Handle project chat message
  socket.on('chat:project-message', async (data: {
    projectId: string;
    message: string;
  }) => {
    try {
      const { projectId, message } = data;
      
      if (!message || !projectId) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }
      
      // Check message content moderation
      try {
        const moderationResult = await moderateContent(message);
        
        if (moderationResult.flagged) {
          socket.emit('error', { 
            message: 'Your message was flagged for inappropriate content and not sent' 
          });
          return;
        }
      } catch (error) {
        logger.error(`Error moderating chat message: ${error}`);
        // Continue without moderation in case of API error
      }
      
      // Verify project exists & user has access
      const Project = require('../api/models/project.model').default;
      const project = await Project.findById(projectId)
        .select('name owner collaborators');
      
      if (!project) {
        socket.emit('error', { message: 'Project not found' });
        return;
      }
      
      // Check if user is owner or collaborator
      const isOwner = project.owner.toString() === userId;
      const isCollaborator = project.collaborators.some(
        (collaboratorId: Types.ObjectId) => collaboratorId.toString() === userId
      );
      
      if (!isOwner && !isCollaborator && socket.data.user.role !== 'admin') {
        socket.emit('error', { message: 'You do not have access to this project chat' });
        return;
      }
      
      // Create chat message
      const chatMessage: ChatMessage = {
        id: new Types.ObjectId().toString(),
        sender: {
          id: userId,
          name: `${socket.data.user.firstName} ${socket.data.user.lastName}`,
        },
        projectId,
        message,
        timestamp: new Date(),
        read: false,
      };
      
      // Get project chat room ID
      const roomId = getProjectChatRoomId(projectId);
      
      // Store message in Redis
      await storeMessage(roomId, chatMessage);
      
      // Join project room if not already joined
      socket.join(roomId);
      
      // Send to all users in the project room
      socket.to(roomId).emit('chat:message', chatMessage);
      
      // Send to sender as well
      socket.emit('chat:message', chatMessage);
      
      logger.debug(`Project message sent from ${userId} to project ${projectId}`);
    } catch (error) {
      logger.error(`Error handling project message: ${error}`);
      socket.emit('error', { message: 'Error sending message' });
    }
  });
  
  // Handle joining a project chat
  socket.on('chat:join-project', async (data: { projectId: string }) => {
    try {
      const { projectId } = data;
      
      // Verify project exists & user has access
      const Project = require('../api/models/project.model').default;
      const project = await Project.findById(projectId)
        .select('name owner collaborators');
      
      if (!project) {
        socket.emit('error', { message: 'Project not found' });
        return;
      }
      
      // Check if user is owner or collaborator
      const isOwner = project.owner.toString() === userId;
      const isCollaborator = project.collaborators.some(
        (collaboratorId: Types.ObjectId) => collaboratorId.toString() === userId
      );
      
      if (!isOwner && !isCollaborator && socket.data.user.role !== 'admin') {
        socket.emit('error', { message: 'You do not have access to this project chat' });
        return;
      }
      
      // Get project chat room ID
      const roomId = getProjectChatRoomId(projectId);
      
      // Join room
      socket.join(roomId);
      
      // Get recent messages from Redis
      const recentMessages = await getChatMessages(roomId);
      
      // Send recent messages
      socket.emit('chat:history', {
        projectId,
        messages: recentMessages,
      });
      
      logger.debug(`User ${userId} joined project chat ${projectId}`);
    } catch (error) {
      logger.error(`Error joining project chat: ${error}`);
      socket.emit('error', { message: 'Error joining project chat' });
    }
  });
  
  // Handle leaving a project chat
  socket.on('chat:leave-project', (data: { projectId: string }) => {
    try {
      const { projectId } = data;
      
      // Get project chat room ID
      const roomId = getProjectChatRoomId(projectId);
      
      // Leave room
      socket.leave(roomId);
      
      logger.debug(`User ${userId} left project chat ${projectId}`);
    } catch (error) {
      logger.error(`Error leaving project chat: ${error}`);
      socket.emit('error', { message: 'Error leaving project chat' });
    }
  });
  
  // Handle get chat history request
  socket.on('chat:get-history', async (data: { userId?: string; projectId?: string }) => {
    try {
      const { userId: receiverId, projectId } = data;
      
      if (receiverId) {
        // Get direct chat history from Redis
        const roomId = getChatRoomId(userId, receiverId);
        const messages = await getChatMessages(roomId);
        
        socket.emit('chat:history', {
          userId: receiverId,
          messages,
        });
      } else if (projectId) {
        // Get project chat history from Redis
        const roomId = getProjectChatRoomId(projectId);
        const messages = await getChatMessages(roomId);
        
        socket.emit('chat:history', {
          projectId,
          messages,
        });
      } else {
        socket.emit('error', { message: 'Either userId or projectId is required' });
      }
    } catch (error) {
      logger.error(`Error getting chat history: ${error}`);
      socket.emit('error', { message: 'Error retrieving chat history' });
    }
  });
  
  // Handle mark messages as read
  socket.on('chat:mark-read', async (data: { 
    messageIds: string[];
    userId?: string;
    projectId?: string;
  }) => {
    try {
      const { messageIds, userId: receiverId, projectId } = data;
      
      if (!messageIds || messageIds.length === 0) {
        socket.emit('error', { message: 'No message IDs provided' });
        return;
      }
      
      let roomId: string;
      
      if (receiverId) {
        // Direct chat
        roomId = getChatRoomId(userId, receiverId);
      } else if (projectId) {
        // Project chat
        roomId = getProjectChatRoomId(projectId);
      } else {
        socket.emit('error', { message: 'Either userId or projectId is required' });
        return;
      }
      
      // Get messages from Redis
      const messages = await getChatMessages(roomId);
      
      // Mark messages as read
      let updated = false;
      const updatedMessages = messages.map(message => {
        if (messageIds.includes(message.id) && !message.read) {
          updated = true;
          return { ...message, read: true };
        }
        return message;
      });
      
      // Update messages in Redis if any were changed
      if (updated) {
        await cacheSet(roomId, updatedMessages, REDIS_EXPIRY);
      }
      
      socket.emit('chat:messages-read', { messageIds });
    } catch (error) {
      logger.error(`Error marking messages as read: ${error}`);
      socket.emit('error', { message: 'Error marking messages as read' });
    }
  });
};

/**
 * Get unread message count for a user
 * @param userId User ID
 * @returns Unread message count
 */
export const getUnreadMessageCount = async (userId: string): Promise<number> => {
  try {
    let count = 0;
    
    // Get all direct chat room keys from Redis that involve this user
    const io = require('./index').getIo();
    const socket = io.sockets.sockets.get(userId);
    
    if (!socket) return 0;
    
    // Get all rooms for this user
    const rooms = Array.from(socket.rooms.values())
      .filter(room => room.startsWith('chat:') && room.includes(userId));
    
    // For each room, count unread messages
    for (const room of rooms) {
      const messages = await getChatMessages(room);
      count += messages.filter(msg => !msg.read && msg.receiver?.id === userId).length;
    }
    
    return count;
  } catch (error) {
    logger.error(`Error getting unread message count: ${error}`);
    return 0;
  }
};

/**
 * Send a system message to project chat
 * @param projectId Project ID
 * @param message System message
 */
export const sendSystemMessageToProject = async (projectId: string, message: string): Promise<void> => {
  try {
    // Generate a system user
    const systemUser = {
      id: 'system',
      name: 'System',
    };
    
    // Create chat message
    const chatMessage: ChatMessage = {
      id: new Types.ObjectId().toString(),
      sender: systemUser,
      projectId,
      message,
      timestamp: new Date(),
      read: false,
    };
    
    // Get project chat room ID
    const roomId = getProjectChatRoomId(projectId);
    
    // Store message in Redis
    await storeMessage(roomId, chatMessage);
    
    // Send to all users in the project room via WebSocket
    const io = require('./index').getIo();
    io.to(roomId).emit('chat:message', chatMessage);
    
    logger.debug(`System message sent to project ${projectId}`);
  } catch (error) {
    logger.error(`Error sending system message to project: ${error}`);
  }
};

export default {
  setupChatHandlers,
  getUnreadMessageCount,
  sendSystemMessageToProject,
};