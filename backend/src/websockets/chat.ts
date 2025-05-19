import { Socket } from 'socket.io';
import { Types } from 'mongoose';
import { sendWebSocketMessage } from './index';
import logger from '../config/logger';
import User from '../api/models/user.model';
import { moderateContent } from '../lib/openai';

// In-memory message store (for simplicity, in production use Redis or DB)
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

// Chat rooms (user-to-user or project rooms)
const chatMessages: Record<string, ChatMessage[]> = {};

// Max messages to keep in memory per chat
const MAX_MESSAGES_PER_CHAT = 100;

// Generate a chat room ID
const getChatRoomId = (userId1: string, userId2: string): string => {
  // Sort IDs to ensure consistent room ID regardless of order
  return [userId1, userId2].sort().join('-');
};

// Generate a project chat room ID
const getProjectChatRoomId = (projectId: string): string => {
  return `project-${projectId}`;
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
      
      // Store message
      if (!chatMessages[roomId]) {
        chatMessages[roomId] = [];
      }
      
      chatMessages[roomId].push(chatMessage);
      
      // Limit stored messages
      if (chatMessages[roomId].length > MAX_MESSAGES_PER_CHAT) {
        chatMessages[roomId] = chatMessages[roomId].slice(-MAX_MESSAGES_PER_CHAT);
      }
      
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
      
      // Store message
      if (!chatMessages[roomId]) {
        chatMessages[roomId] = [];
      }
      
      chatMessages[roomId].push(chatMessage);
      
      // Limit stored messages
      if (chatMessages[roomId].length > MAX_MESSAGES_PER_CHAT) {
        chatMessages[roomId] = chatMessages[roomId].slice(-MAX_MESSAGES_PER_CHAT);
      }
      
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
      
      // Get recent messages
      const recentMessages = chatMessages[roomId] || [];
      
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
        // Get direct chat history
        const roomId = getChatRoomId(userId, receiverId);
        const messages = chatMessages[roomId] || [];
        
        socket.emit('chat:history', {
          userId: receiverId,
          messages,
        });
      } else if (projectId) {
        // Get project chat history
        const roomId = getProjectChatRoomId(projectId);
        const messages = chatMessages[roomId] || [];
        
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
  socket.on('chat:mark-read', (data: { 
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
      
      let roomId;
      
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
      
      // Get messages
      const messages = chatMessages[roomId] || [];
      
      // Mark messages as read
      messageIds.forEach(messageId => {
        const message = messages.find(msg => msg.id === messageId);
        if (message) {
          message.read = true;
        }
      });
      
      // Update messages
      chatMessages[roomId] = messages;
      
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
export const getUnreadMessageCount = (userId: string): number => {
  let count = 0;
  
  // Check all chat rooms
  Object.keys(chatMessages).forEach(roomId => {
    // Direct chat
    if (roomId.includes(userId)) {
      count += chatMessages[roomId].filter(
        msg => !msg.read && msg.receiver?.id === userId
      ).length;
    }
    
    // Project chat
    if (roomId.startsWith('project-')) {
      // Would need to check if user is in this project
      // For simplicity, not implemented here
    }
  });
  
  return count;
};

/**
 * Send a system message to project chat
 * @param projectId Project ID
 * @param message System message
 */
export const sendSystemMessageToProject = (projectId: string, message: string): void => {
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
    
    // Store message
    if (!chatMessages[roomId]) {
      chatMessages[roomId] = [];
    }
    
    chatMessages[roomId].push(chatMessage);
    
    // Limit stored messages
    if (chatMessages[roomId].length > MAX_MESSAGES_PER_CHAT) {
      chatMessages[roomId] = chatMessages[roomId].slice(-MAX_MESSAGES_PER_CHAT);
    }
    
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