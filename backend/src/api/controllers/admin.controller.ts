import { Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/user.model';
import Project from '../models/project.model';
import Certificate from '../models/certificate.model';
import Notification from '../models/notification.model';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../core/error';
import { sendSuccess, sendNoContent, getPaginationData } from '../../core/responses';
import { cacheDelete, cacheGet, cacheSet } from '../../config/redis';
import { createNotification, createSystemNotification } from '../services/notification.service';
import { getConnectedUsersCount } from '../../websockets';

/**
 * @desc    Get system statistics
 * @route   GET /api/admin/stats
 * @access  Private (Admin)
 */
export const getSystemStats = asyncHandler(async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  if (req.user.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  
  // Try to get from cache first
  const cacheKey = 'admin:system-stats';
  const cachedStats = await cacheGet(cacheKey);
  
  if (cachedStats) {
    sendSuccess(res, cachedStats, 'System statistics retrieved from cache');
    return;
  }
  
  // Get counts for various entities
  const [
    totalUsers,
    activeUsers,
    totalProjects,
    publicProjects,
    totalCertificates,
    activeNotifications,
    newUsersToday,
    newProjectsToday,
    newCertificatesToday,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ active: true }),
    Project.countDocuments(),
    Project.countDocuments({ visibility: 'public' }),
    Certificate.countDocuments(),
    Notification.countDocuments({ read: false }),
    User.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    }),
    Project.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    }),
    Certificate.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    }),
  ]);
  
  // Get connected users count from WebSockets
  const connectedUsers = getConnectedUsersCount();
  
  // Calculate storage usage
  const projects = await Project.find().select('files');
  let storageUsed = 0;
  
  projects.forEach(project => {
    project.files.forEach(file => {
      storageUsed += file.size;
    });
  });
  
  const stats = {
    users: {
      total: totalUsers,
      active: activeUsers,
      newToday: newUsersToday,
      connected: connectedUsers,
    },
    projects: {
      total: totalProjects,
      public: publicProjects,
      newToday: newProjectsToday,
    },
    certificates: {
      total: totalCertificates,
      newToday: newCertificatesToday,
    },
    notifications: {
      active: activeNotifications,
    },
    storage: {
      used: storageUsed,
      usedFormatted: formatBytes(storageUsed),
    },
    system: {
      timestamp: new Date(),
      uptime: process.uptime(),
    },
  };
  
  // Cache the result for 5 minutes
  await cacheSet(cacheKey, stats, 300);
  
  sendSuccess(res, stats, 'System statistics retrieved successfully');
});

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private (Admin)
 */
export const getAllUsers = asyncHandler(async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  if (req.user.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search,
    role,
    active,
  } = req.query;
  
  // Convert page and limit to numbers
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  
  // Build query
  const query: any = {};
  
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  
  if (role) {
    query.role = role;
  }
  
  if (active !== undefined) {
    query.active = active === 'true';
  }
  
  // Determine sort options
  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
  
  // Get count
  const totalUsers = await User.countDocuments(query);
  
  // Get users
  const users = await User.find(query)
    .select('-password -verificationToken -verificationExpires -resetPasswordToken -resetPasswordExpires -twoFactorSecret')
    .sort(sortOptions)
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);
  
  // Get pagination data
  const baseUrl = `${req.protocol}://${req.get('host')}/api/admin/users`;
  const { meta, links } = getPaginationData(totalUsers, pageNum, limitNum, baseUrl);
  
  sendSuccess(res, { users }, 'Users retrieved successfully', 200, meta, links);
});

/**
 * @desc    Get user by ID (admin view)
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin)
 */
export const getUserById = asyncHandler(async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  if (req.user.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  
  const { id } = req.params;
  
  // Validate ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid user ID');
  }
  
  // Get user
  const user = await User.findById(id)
    .select('-password -verificationToken -verificationExpires -resetPasswordToken -resetPasswordExpires -twoFactorSecret');
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Get user statistics
  const [projectCount, certificateCount, lastLogin] = await Promise.all([
    Project.countDocuments({ owner: user._id }),
    Certificate.countDocuments({ recipient: user._id }),
    User.findById(id).select('lastLogin').lean(),
  ]);
  
  sendSuccess(res, {
    user,
    stats: {
      projectCount,
      certificateCount,
      lastLogin: lastLogin?.lastLogin,
    },
  }, 'User retrieved successfully');
});

/**
 * @desc    Update user
 * @route   PUT /api/admin/users/:id
 * @access  Private (Admin)
 */
export const updateUser = asyncHandler(async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  if (req.user.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  
  const { id } = req.params;
  const { firstName, lastName, role, active, verified, skills } = req.body;
  
  // Validate ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid user ID');
  }
  
  // Get user
  const user = await User.findById(id);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Update fields
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (role) user.role = role;
  if (active !== undefined) user.active = active;
  if (verified !== undefined) user.verified = verified;
  if (skills) user.skills = skills;
  
  // Save changes
  await user.save();
  
  // Clear user cache
  await cacheDelete(`user:${user._id}`);
  
  // Notify user if their role or active status changed
  if (role !== undefined && role !== user.role) {
    await createNotification({
      recipient: user._id,
      sender: req.user._id,
      type: 'info',
      title: 'Role Updated',
      message: `Your role has been updated to: ${role}`,
    });
  }
  
  if (active !== undefined && active !== user.active) {
    await createNotification({
      recipient: user._id,
      sender: req.user._id,
      type: active ? 'success' : 'warning',
      title: active ? 'Account Activated' : 'Account Deactivated',
      message: active
        ? 'Your account has been activated by an administrator'
        : 'Your account has been deactivated by an administrator',
    });
  }
  
  sendSuccess(res, { user }, 'User updated successfully');
});

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin)
 */
export const deleteUser = asyncHandler(async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  if (req.user.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  
  const { id } = req.params;
  
  // Validate ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid user ID');
  }
  
  // Check if user is trying to delete themselves
  if (id === req.user._id.toString()) {
    throw new BadRequestError('You cannot delete your own account');
  }
  
  // Get user
  const user = await User.findById(id);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Delete user
  await User.deleteOne({ _id: id });
  
  // Clear user cache
  await cacheDelete(`user:${user._id}`);
  
  // Delete user's projects or transfer them to admin
  if (req.query.deleteProjects === 'true') {
    await Project.deleteMany({ owner: id });
  } else {
    await Project.updateMany(
      { owner: id },
      { owner: req.user._id }
    );
  }
  
  sendNoContent(res);
});

/**
 * @desc    Send system notification
 * @route   POST /api/admin/notifications
 * @access  Private (Admin)
 */
export const sendSystemNotification = asyncHandler(async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  if (req.user.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  
  const { title, message, type, recipients, roles, link } = req.body;
  
  if (!title || !message) {
    throw new BadRequestError('Title and message are required');
  }
  
  let count = 0;
  
  // Send to specific recipients if provided
  if (recipients && Array.isArray(recipients) && recipients.length > 0) {
    // Validate recipient IDs
    const validRecipients = recipients.filter(id => mongoose.Types.ObjectId.isValid(id));
    
    if (validRecipients.length === 0) {
      throw new BadRequestError('No valid recipient IDs provided');
    }
    
    // Send notifications
    for (const recipientId of validRecipients) {
      await createNotification({
        recipient: new mongoose.Types.ObjectId(recipientId),
        sender: req.user._id,
        type: type || 'info',
        title,
        message,
        link,
      });
      count++;
    }
  } 
  // Send to roles if provided
  else if (roles && Array.isArray(roles) && roles.length > 0) {
    count = await createSystemNotification(
      {
        title,
        message,
        type: type || 'info',
        link,
        sender: req.user._id,
      },
      roles as ('admin' | 'user' | 'manager')[],
    );
  } 
  // Send to all users
  else {
    count = await createSystemNotification({
      title,
      message,
      type: type || 'info',
      link,
      sender: req.user._id,
    });
  }
  
  sendSuccess(res, { count }, `Notification sent to ${count} recipients`);
});

/**
 * @desc    Get system logs
 * @route   GET /api/admin/logs
 * @access  Private (Admin)
 */
export const getSystemLogs = asyncHandler(async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  if (req.user.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  
  const { type = 'combined', date, lines = 100 } = req.query;
  
  // Validate type
  if (type !== 'combined' && type !== 'error') {
    throw new BadRequestError('Invalid log type');
  }
  
  // Validate lines
  const numLines = parseInt(lines as string, 10);
  if (isNaN(numLines) || numLines < 1 || numLines > 1000) {
    throw new BadRequestError('Lines must be between 1 and 1000');
  }
  
  try {
    const fs = require('fs');
    const path = require('path');
    const readline = require('readline');
    
    // Determine log file path
    let logFile;
    
    if (date) {
      // Format: YYYY-MM-DD
      logFile = path.join(
        process.cwd(),
        'logs',
        `${type === 'error' ? 'error' : 'combined'}-${date}.log`
      );
    } else {
      // Get most recent log file
      const logDir = path.join(process.cwd(), 'logs');
      const files = fs.readdirSync(logDir);
      
      const logFiles = files.filter((file: string) => 
        file.startsWith(`${type === 'error' ? 'error' : 'combined'}-`) && 
        file.endsWith('.log')
      );
      
      if (logFiles.length === 0) {
        throw new NotFoundError('No log files found');
      }
      
      // Sort by date (newest first)
      logFiles.sort((a: string, b: string) => {
        const dateA = a.replace(`${type === 'error' ? 'error' : 'combined'}-`, '').replace('.log', '');
        const dateB = b.replace(`${type === 'error' ? 'error' : 'combined'}-`, '').replace('.log', '');
        return dateB.localeCompare(dateA);
      });
      
      logFile = path.join(logDir, logFiles[0]);
    }
    
    // Check if file exists
    if (!fs.existsSync(logFile)) {
      throw new NotFoundError('Log file not found');
    }
    
    // Read last N lines from file
    const logLines: string[] = [];
    const fileStream = fs.createReadStream(logFile);
    
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });
    
    for await (const line of rl) {
      logLines.push(line);
      if (logLines.length > numLines) {
        logLines.shift();
      }
    }
    
    sendSuccess(res, {
      type,
      file: path.basename(logFile),
      lines: logLines,
    }, 'System logs retrieved successfully');
  } catch (error) {
    if ((error as Error).message === 'Log file not found') {
      throw new NotFoundError('Log file not found');
    }
    throw error;
  }
});

/**
 * @desc    Get system overview
 * @route   GET /api/admin/overview
 * @access  Private (Admin)
 */
export const getSystemOverview = asyncHandler(async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  if (req.user.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  
  // Try to get from cache first
  const cacheKey = 'admin:system-overview';
  const cachedOverview = await cacheGet(cacheKey);
  
  if (cachedOverview) {
    sendSuccess(res, cachedOverview, 'System overview retrieved from cache');
    return;
  }
  
  // Get system stats
  const [
    userStats,
    projectStats,
    certificateStats,
    notificationStats,
    storageStats,
  ] = await Promise.all([
    getUserStats(),
    getProjectStats(),
    getCertificateStats(),
    getNotificationStats(),
    getStorageStats(),
  ]);
  
  const overview = {
    users: userStats,
    projects: projectStats,
    certificates: certificateStats,
    notifications: notificationStats,
    storage: storageStats,
    system: {
      timestamp: new Date(),
      uptime: process.uptime(),
      nodejs: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
    },
  };
  
  // Cache the result for 5 minutes
  await cacheSet(cacheKey, overview, 300);
  
  sendSuccess(res, overview, 'System overview retrieved successfully');
});

// Helper function to get user statistics
const getUserStats = async () => {
  // Get user counts by role
  const roleCounts = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
  ]);
  
  // Get counts by active status
  const activeCounts = await User.aggregate([
    { $group: { _id: '$active', count: { $sum: 1 } } },
  ]);
  
  // Get user registration stats by month
  const registrationStats = await User.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
  
  // Format registration stats
  const formattedRegistrationStats = registrationStats.map(stat => ({
    year: stat._id.year,
    month: stat._id.month,
    count: stat.count,
  }));
  
  // Get recent users
  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('firstName lastName email role createdAt');
  
  return {
    roles: roleCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>),
    active: activeCounts.reduce((acc, curr) => {
      acc[curr._id ? 'active' : 'inactive'] = curr.count;
      return acc;
    }, {} as Record<string, number>),
    registrationStats: formattedRegistrationStats,
    recentUsers,
  };
};

// Helper function to get project statistics
const getProjectStats = async () => {
  // Get project counts by visibility
  const visibilityCounts = await Project.aggregate([
    { $group: { _id: '$visibility', count: { $sum: 1 } } },
  ]);
  
  // Get project counts by status
  const statusCounts = await Project.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  
  // Get project creation stats by month
  const creationStats = await Project.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
  
  // Format creation stats
  const formattedCreationStats = creationStats.map(stat => ({
    year: stat._id.year,
    month: stat._id.month,
    count: stat.count,
  }));
  
  // Get recent projects
  const recentProjects = await Project.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name category status visibility createdAt')
    .populate('owner', 'firstName lastName');
  
  return {
    visibility: visibilityCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>),
    status: statusCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>),
    creationStats: formattedCreationStats,
    recentProjects,
  };
};

// Helper function to get certificate statistics
const getCertificateStats = async () => {
  // Get certificate counts by status
  const statusCounts = await Certificate.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  
  // Get certificate creation stats by month
  const creationStats = await Certificate.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
  
  // Format creation stats
  const formattedCreationStats = creationStats.map(stat => ({
    year: stat._id.year,
    month: stat._id.month,
    count: stat.count,
  }));
  
  // Get recent certificates
  const recentCertificates = await Certificate.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title status issueDate createdAt')
    .populate('recipient', 'firstName lastName')
    .populate('issuer', 'firstName lastName');
  
  return {
    status: statusCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>),
    creationStats: formattedCreationStats,
    recentCertificates,
  };
};

// Helper function to get notification statistics
const getNotificationStats = async () => {
  // Get notification counts by type
  const typeCounts = await Notification.aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ]);
  
  // Get notification counts by read status
  const readCounts = await Notification.aggregate([
    { $group: { _id: '$read', count: { $sum: 1 } } },
  ]);
  
  // Get notification creation stats by day (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const creationStats = await Notification.aggregate([
    {
      $match: {
        createdAt: { $gte: sevenDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
  ]);
  
  // Format creation stats
  const formattedCreationStats = creationStats.map(stat => ({
    year: stat._id.year,
    month: stat._id.month,
    day: stat._id.day,
    count: stat.count,
  }));
  
  return {
    type: typeCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>),
    read: readCounts.reduce((acc, curr) => {
      acc[curr._id ? 'read' : 'unread'] = curr.count;
      return acc;
    }, {} as Record<string, number>),
    creationStats: formattedCreationStats,
  };
};

// Helper function to get storage statistics
const getStorageStats = async () => {
  // Get total storage used
  const projects = await Project.find().select('files');
  let totalStorageUsed = 0;
  
  // Format counts by file type
  const fileTypeCounts: Record<string, number> = {};
  const fileTypeStorage: Record<string, number> = {};
  
  projects.forEach(project => {
    project.files.forEach(file => {
      totalStorageUsed += file.size;
      
      // Count by file type
      const fileType = file.type.split('/')[0] || 'other';
      fileTypeCounts[fileType] = (fileTypeCounts[fileType] || 0) + 1;
      fileTypeStorage[fileType] = (fileTypeStorage[fileType] || 0) + file.size;
    });
  });
  
  return {
    totalUsed: totalStorageUsed,
    totalUsedFormatted: formatBytes(totalStorageUsed),
    byType: {
      counts: fileTypeCounts,
      storage: Object.entries(fileTypeStorage).reduce((acc, [type, size]) => {
        acc[type] = formatBytes(size);
        return acc;
      }, {} as Record<string, string>),
    },
  };
};

// Helper function to format bytes
const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export default {
  getSystemStats,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  sendSystemNotification,
  getSystemLogs,
  getSystemOverview,
};