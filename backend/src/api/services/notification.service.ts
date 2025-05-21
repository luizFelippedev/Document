import { Types } from 'mongoose';
import Notification, { INotification } from '../models/notification.model';
import logger from '../../config/logger';
import sendWebSocketMessage from '../../websockets/notifications';
import mongoose from 'mongoose';

/**
 * Notification creation parameters
 */
interface CreateNotificationParams {
  recipient: Types.ObjectId;
  sender?: Types.ObjectId;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  title: string;
  message: string;
  link?: string;
  entity?: {
    type: string;
    id: Types.ObjectId;
  };
  metadata?: Record<string, any>;
  expiresAt?: Date;
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Create a new notification
 * @param params Notification parameters
 * @param session Mongoose session for transactions
 * @returns The created notification
 */
export const createNotification = async (
  params: CreateNotificationParams,
  session?: mongoose.ClientSession
): Promise<INotification> => {
  try {
    const notification = new Notification({
      recipient: params.recipient,
      sender: params.sender,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      entity: params.entity,
      metadata: params.metadata,
      expiresAt: params.expiresAt,
      priority: params.priority || 'medium',
      read: false,
    });
    
    // Save with or without session
    if (session) {
      await notification.save({ session });
    } else {
      await notification.save();
    }

    // Send real-time notification via WebSocket if not in a transaction
    // In transaction case, this will be handled after the transaction commits
    if (!session) {
      await sendWebSocketMessage.sendNotification({
        recipient: params.recipient.toString(),
        notification: {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          createdAt: notification.createdAt,
        },
      });
    }

    return notification;
  } catch (error) {
    logger.error(`Error creating notification: ${error}`);
    throw error;
  }
};

/**
 * Get notifications for a user
 * @param userId User ID
 * @param options Query options (page, limit, unreadOnly)
 * @returns Notifications and pagination info
 */
export const getUserNotifications = async (
  userId: Types.ObjectId,
  options: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  } = {}
): Promise<{
  notifications: INotification[];
  totalCount: number;
  unreadCount: number;
}> => {
  try {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { recipient: userId };

    // Only include unread notifications if specified
    if (options.unreadOnly) {
      query.read = false;
    }

    // Only include non-expired notifications
    query.$or = [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ];

    // Count total and unread
    const [notifications, totalCount, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'firstName lastName avatar')
        .exec(),
      Notification.countDocuments(query),
      Notification.countDocuments({
        recipient: userId,
        read: false,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } },
        ],
      }),
    ]);

    return {
      notifications,
      totalCount,
      unreadCount,
    };
  } catch (error) {
    logger.error(`Error getting user notifications: ${error}`);
    throw error;
  }
};

/**
 * Mark a notification as read
 * @param notificationId Notification ID
 * @param userId User ID (for validation)
 * @returns The updated notification
 */
export const markNotificationAsRead = async (
  notificationId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<INotification | null> => {
  try {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      return null;
    }

    if (notification.read) {
      return notification; // Already read
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    return notification;
  } catch (error) {
    logger.error(`Error marking notification as read: ${error}`);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param userId User ID
 * @returns Number of notifications marked as read
 */
export const markAllNotificationsAsRead = async (
  userId: Types.ObjectId
): Promise<number> => {
  try {
    const result = await Notification.updateMany(
      {
        recipient: userId,
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    return result.modifiedCount;
  } catch (error) {
    logger.error(`Error marking all notifications as read: ${error}`);
    throw error;
  }
};

/**
 * Delete a notification
 * @param notificationId Notification ID
 * @param userId User ID (for validation)
 * @returns True if deleted, false if not found
 */
export const deleteNotification = async (
  notificationId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<boolean> => {
  try {
    const result = await Notification.deleteOne({
      _id: notificationId,
      recipient: userId,
    });

    return result.deletedCount > 0;
  } catch (error) {
    logger.error(`Error deleting notification: ${error}`);
    throw error;
  }
};

/**
 * Delete all read notifications for a user
 * @param userId User ID
 * @returns Number of notifications deleted
 */
export const deleteAllReadNotifications = async (
  userId: Types.ObjectId
): Promise<number> => {
  try {
    const result = await Notification.deleteMany({
      recipient: userId,
      read: true,
    });

    return result.deletedCount;
  } catch (error) {
    logger.error(`Error deleting read notifications: ${error}`);
    throw error;
  }
};

/**
 * Create a system notification for all users or specific roles
 * @param params Notification parameters (without recipient)
 * @param roles Optional roles to filter recipients
 * @param session Optional session for transactions
 * @returns Number of notifications created
 */
export const createSystemNotification = async (
  params: Omit<CreateNotificationParams, 'recipient'>,
  roles?: ('admin' | 'user' | 'manager')[],
  session?: mongoose.ClientSession
): Promise<number> => {
  try {
    // Build query to find users
    const query: any = { active: true };

    if (roles && roles.length > 0) {
      query.role = { $in: roles };
    }

    // Get all user IDs
    const userIds = await require('../models/user.model').default
      .find(query)
      .select('_id')
      .lean();

    if (userIds.length === 0) {
      return 0;
    }

    // Create notifications in bulk
    const notifications = userIds.map((user: { _id: Types.ObjectId }) => ({
      recipient: user._id,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      entity: params.entity,
      metadata: params.metadata,
      expiresAt: params.expiresAt,
      priority: params.priority || 'medium',
      read: false,
    }));

    let result;
    if (session) {
      result = await Notification.insertMany(notifications, { session });
    } else {
      result = await Notification.insertMany(notifications);
      
      // Send real-time notifications via WebSockets (only if not in transaction)
      for (const notification of result) {
        await sendWebSocketMessage.sendNotification({
          recipient: notification.recipient.toString(),
          notification: {
            id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            createdAt: notification.createdAt,
          },
        });
      }
    }

    return result.length;
  } catch (error) {
    logger.error(`Error creating system notification: ${error}`);
    throw error;
  }
};

/**
 * Clean up old notifications
 * @param daysOld Number of days old to consider for cleanup
 * @returns Number of notifications deleted
 */
export const cleanupOldNotifications = async (
  daysOld: number = 30
): Promise<number> => {
  try {
    const date = new Date();
    date.setDate(date.getDate() - daysOld);

    const result = await Notification.deleteMany({
      read: true,
      createdAt: { $lt: date },
    });

    return result.deletedCount;
  } catch (error) {
    logger.error(`Error cleaning up old notifications: ${error}`);
    throw error;
  }
};

export default {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllReadNotifications,
  createSystemNotification,
  cleanupOldNotifications,
};