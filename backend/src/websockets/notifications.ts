import { Socket } from 'socket.io';
import { sendWebSocketMessage } from './index';
import logger from '../config/logger';
import Notification from '../api/models/notification.model';
import { Types } from 'mongoose';

/**
 * Handle notification-related WebSocket events
 * @param socket WebSocket connection
 */
export const setupNotificationsHandlers = (socket: Socket): void => {
  const userId = socket.data.userId;
  
  // Handle request for initial notifications
  socket.on('notifications:get', async (data: { limit?: number }) => {
    try {
      const limit = data.limit || 10;
      
      // Get recent unread notifications
      const notifications = await Notification.find({
        recipient: userId,
        read: false,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ]
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('sender', 'firstName lastName avatar')
        .lean();
      
      // Get unread count
      const unreadCount = await Notification.countDocuments({
        recipient: userId,
        read: false,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ]
      });
      
      // Send response
      socket.emit('notifications:list', {
        notifications,
        unreadCount
      });
    } catch (error) {
      logger.error(`Error fetching notifications: ${error}`);
      socket.emit('error', { message: 'Failed to fetch notifications' });
    }
  });
  
  // Handle marking notification as read
  socket.on('notifications:markRead', async (data: { id: string }) => {
    try {
      if (!data.id) {
        socket.emit('error', { message: 'Notification ID is required' });
        return;
      }
      
      // Update notification
      const notification = await Notification.findOneAndUpdate(
        { _id: data.id, recipient: userId },
        { read: true, readAt: new Date() },
        { new: true }
      );
      
      if (!notification) {
        socket.emit('error', { message: 'Notification not found' });
        return;
      }
      
      // Get updated unread count
      const unreadCount = await Notification.countDocuments({
        recipient: userId,
        read: false,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ]
      });
      
      // Send response
      socket.emit('notifications:updated', {
        notification,
        unreadCount
      });
    } catch (error) {
      logger.error(`Error marking notification as read: ${error}`);
      socket.emit('error', { message: 'Failed to update notification' });
    }
  });
  
  // Handle marking all notifications as read
  socket.on('notifications:markAllRead', async () => {
    try {
      // Update all notifications
      await Notification.updateMany(
        {
          recipient: userId,
          read: false
        },
        {
          read: true,
          readAt: new Date()
        }
      );
      
      // Send response
      socket.emit('notifications:allRead', {
        success: true,
        unreadCount: 0
      });
    } catch (error) {
      logger.error(`Error marking all notifications as read: ${error}`);
      socket.emit('error', { message: 'Failed to update notifications' });
    }
  });
};

/**
 * Send a notification to a user via WebSocket
 * @param notification Notification to send
 */
export const sendNotification = async (notification: any): Promise<void> => {
  try {
    const userId = notification.recipient.toString();
    
    // Send via WebSocket
    sendWebSocketMessage(userId, 'notifications:new', { notification });
    
    // Update unread count
    const unreadCount = await Notification.countDocuments({
      recipient: notification.recipient,
      read: false,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    });
    
    // Send updated count
    sendWebSocketMessage(userId, 'notifications:count', { unreadCount });
  } catch (error) {
    logger.error(`Error sending notification via WebSocket: ${error}`);
  }
};

/**
 * Clear expired notifications
 */
export const clearExpiredNotifications = async (): Promise<void> => {
  try {
    const result = await Notification.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    if (result.deletedCount > 0) {
      logger.info(`Cleared ${result.deletedCount} expired notifications`);
    }
  } catch (error) {
    logger.error(`Error clearing expired notifications: ${error}`);
  }
};

/**
 * Send a notification to multiple users about a system event
 * @param recipients Array of user IDs
 * @param title Notification title
 * @param message Notification message
 * @param type Notification type
 * @param link Optional link
 */
export const sendSystemNotificationToMany = async (
  recipients: Types.ObjectId[],
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' | 'system' = 'system',
  link?: string
): Promise<void> => {
  try {
    // Create notifications
    const notifications = recipients.map(recipientId => ({
      recipient: recipientId,
      type,
      title,
      message,
      link,
      read: false,
      priority: 'medium',
    }));
    
    // Insert all notifications at once
    const createdNotifications = await Notification.insertMany(notifications);
    
    // Send each notification via WebSocket
    createdNotifications.forEach(async (notification) => {
      await sendNotification(notification);
    });
    
    logger.info(`Sent system notification to ${recipients.length} users`);
  } catch (error) {
    logger.error(`Error sending system notifications: ${error}`);
  }
};

export default {
  setupNotificationsHandlers,
  sendNotification,
  clearExpiredNotifications,
  sendSystemNotificationToMany,
};