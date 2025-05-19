import mongoose, { Document, Schema } from 'mongoose';

/**
 * Interface representing a notification document in the system.
 * 
 * @interface INotification
 * @extends {Document}
 * 
 * @property {Schema.Types.ObjectId} recipient - The ID of the user receiving the notification
 * @property {Schema.Types.ObjectId} [sender] - The ID of the user/entity sending the notification (optional)
 * @property {'info' | 'success' | 'warning' | 'error' | 'system'} type - The type of notification
 * @property {string} title - The title/header of the notification
 * @property {string} message - The main content/body of the notification
 * @property {string} [link] - Optional URL associated with the notification
 * @property {boolean} read - Indicates whether the notification has been read
 * @property {Date} [readAt] - Timestamp when the notification was read
 * @property {{type: string, id: Schema.Types.ObjectId}} [entity] - Associated entity details
 * @property {{[key: string]: any}} [metadata] - Additional custom data for the notification
 * @property {Date} [expiresAt] - Timestamp when the notification expires
 * @property {'low' | 'medium' | 'high'} priority - Priority level of the notification
 * @property {Date} createdAt - Timestamp when the notification was created
 * @property {Date} updatedAt - Timestamp when the notification was last updated
 * 
 * @method markAsRead - Marks the notification as read and updates readAt timestamp
 * @returns {Promise<void>}
 * 
 * @method isExpired - Checks if the notification has expired
 * @returns {boolean}
 */
export interface INotification extends Document {
  recipient: Schema.Types.ObjectId;
  sender?: Schema.Types.ObjectId;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  readAt?: Date;
  entity?: {
    type: string;
    id: Schema.Types.ObjectId;
  };
  metadata?: {
    [key: string]: any;
  };
  expiresAt?: Date;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  markAsRead(): Promise<void>;
  isExpired(): boolean;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification recipient is required'],
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'error', 'system'],
      default: 'info',
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    link: {
      type: String,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    entity: {
      type: {
        type: String,
        enum: ['project', 'certificate', 'user', 'comment'],
      },
      id: {
        type: Schema.Types.ObjectId,
      },
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    expiresAt: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient querying
NotificationSchema.index({ recipient: 1, read: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-expire

// Mark notification as read
NotificationSchema.methods.markAsRead = async function (): Promise<void> {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    await this.save();
  }
};

// Check if notification is expired
NotificationSchema.methods.isExpired = function (): boolean {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Static method to mark multiple notifications as read
NotificationSchema.statics.markMultipleAsRead = async function (recipientId: Schema.Types.ObjectId, notificationIds?: Schema.Types.ObjectId[]): Promise<void> {
  const query: any = { 
    recipient: recipientId,
    read: false
  };
  
  if (notificationIds && notificationIds.length > 0) {
    query._id = { $in: notificationIds };
  }
  
  const updateData = {
    read: true,
    readAt: new Date(),
  };
  
  await this.updateMany(query, updateData);
};

// Static method to get unread count for user
NotificationSchema.statics.getUnreadCount = async function (userId: Schema.Types.ObjectId): Promise<number> {
  return this.countDocuments({
    recipient: userId,
    read: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Static method to clear old notifications
NotificationSchema.statics.clearOldNotifications = async function (days: number = 30): Promise<void> {
  const date = new Date();
  date.setDate(date.getDate() - days);
  
  await this.deleteMany({
    read: true,
    createdAt: { $lt: date }
  });
};

const Notification = mongoose.model<INotification & mongoose.Document>(
  'Notification',
  NotificationSchema
);

export default Notification;