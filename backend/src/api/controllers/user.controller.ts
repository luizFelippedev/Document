import { Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/user.model';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, BadRequestError, NotFoundError, UnauthorizedError } from '../../core/error';
import { sendSuccess, sendNoContent, getPaginationData } from '../../core/responses';
import { cacheDelete, cacheSet } from '../../config/redis';
import { deleteFile } from '../middleware/upload';
import Project from '../models/project.model';
import Certificate from '../models/certificate.model';

/**
 * @desc    Get current user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getUserProfile = asyncHandler(async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  // Get full user data from database
  const user = await User.findById(req.user._id)
    .select('-password -loginAttempts -lockUntil -verificationToken -verificationExpires -resetPasswordToken -resetPasswordExpires -twoFactorSecret');
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Get user stats
  const [projectCount, certificateCount] = await Promise.all([
    Project.countDocuments({ owner: user._id }),
    Certificate.countDocuments({ recipient: user._id }),
  ]);
  
  sendSuccess(res, { 
    user,
    stats: {
      projects: projectCount,
      certificates: certificateCount,
    }
  }, 'User profile retrieved successfully');
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = asyncHandler(async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const { firstName, lastName, bio, company, position, skills } = req.body;
  
  // Find user
  const user = await User.findById(req.user._id);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Update fields
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (bio !== undefined) user.bio = bio;
  if (company !== undefined) user.company = company;
  if (position !== undefined) user.position = position;
  if (skills) user.skills = skills;
  
  // Save changes
  await user.save();
  
  // Clear user cache
  await cacheDelete(`user:${user._id}`);
  
  sendSuccess(res, { user }, 'Profile updated successfully');
});

/**
 * @desc    Upload user avatar
 * @route   POST /api/users/avatar
 * @access  Private
 */
export const uploadAvatar = asyncHandler(async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  // Check if file was uploaded
  if (!req.file) {
    throw new BadRequestError('No file uploaded');
  }
  
  // Find user
  const user = await User.findById(req.user._id);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Delete old avatar if exists
  if (user.avatar) {
    await deleteFile(user.avatar);
  }
  
  // Update avatar with new file path (normalized for different OSes)
  user.avatar = req.file.path.replace(/\\/g, '/');
  await user.save();
  
  // Clear user cache
  await cacheDelete(`user:${user._id}`);
  
  sendSuccess(res, { 
    avatar: user.avatar,
    avatarUrl: `${req.protocol}://${req.get('host')}/${user.avatar}`
  }, 'Avatar uploaded successfully');
});

/**
 * @desc    Delete user avatar
 * @route   DELETE /api/users/avatar
 * @access  Private
 */
export const deleteAvatar = asyncHandler(async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  // Find user
  const user = await User.findById(req.user._id);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Check if user has an avatar
  if (!user.avatar) {
    throw new BadRequestError('User does not have an avatar');
  }
  
  // Delete avatar file
  await deleteFile(user.avatar);
  
  // Remove avatar reference
  user.avatar = undefined;
  await user.save();
  
  // Clear user cache
  await cacheDelete(`user:${user._id}`);
  
  sendNoContent(res);
});

/**
 * @desc    Get user projects
 * @route   GET /api/users/projects
 * @access  Private
 */
export const getUserProjects = asyncHandler(async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    status,
  } = req.query;
  
  // Convert page and limit to numbers
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  
  // Build query
  const query: any = { owner: req.user._id };
  
  if (status) {
    query.status = status;
  }
  
  // Determine sort options
  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
  
  // Count total projects
  const totalProjects = await Project.countDocuments(query);
  
  // Get projects with pagination
  const projects = await Project.find(query)
    .sort(sortOptions)
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .populate('collaborators', 'firstName lastName email avatar')
    .populate('lastUpdatedBy', 'firstName lastName email');
  
  // Calculate pagination data
  const baseUrl = `${req.protocol}://${req.get('host')}/api/users/projects`;
  const { meta, links } = getPaginationData(totalProjects, pageNum, limitNum, baseUrl);
  
  sendSuccess(res, { projects }, 'User projects retrieved successfully', 200, meta, links);
});

/**
 * @desc    Get user certificates
 * @route   GET /api/users/certificates
 * @access  Private
 */
export const getUserCertificates = asyncHandler(async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const {
    page = 1,
    limit = 10,
    sortBy = 'issueDate',
    sortOrder = 'desc',
    status,
  } = req.query;
  
  // Convert page and limit to numbers
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  
  // Build query
  const query: any = { recipient: req.user._id };
  
  if (status) {
    query.status = status;
  }
  
  // Determine sort options
  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
  
  // Count total certificates
  const totalCertificates = await Certificate.countDocuments(query);
  
  // Get certificates with pagination
  const certificates = await Certificate.find(query)
    .sort(sortOptions)
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .populate('issuer', 'firstName lastName email avatar')
    .populate('project', 'name description');
  
  // Calculate pagination data
  const baseUrl = `${req.protocol}://${req.get('host')}/api/users/certificates`;
  const { meta, links } = getPaginationData(totalCertificates, pageNum, limitNum, baseUrl);
  
  sendSuccess(res, { certificates }, 'User certificates retrieved successfully', 200, meta, links);
});

/**
 * @desc    Get user by ID (public profile)
 * @route   GET /api/users/:id
 * @access  Private
 */
export const getUserById = asyncHandler(async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const { id } = req.params;
  
  // Validate user ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid user ID');
  }
  
  // Get user
  const user = await User.findById(id)
    .select('firstName lastName email bio company position avatar skills createdAt');
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Get user stats
  const [projectCount, certificateCount, publicProjects] = await Promise.all([
    Project.countDocuments({ owner: user._id }),
    Certificate.countDocuments({ recipient: user._id, status: 'issued' }),
    Project.find({ 
      owner: user._id, 
      visibility: 'public' 
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name description thumbnail category tags metrics.likes metrics.views createdAt')
    .lean(),
  ]);
  
  sendSuccess(res, {
    user,
    stats: {
      projectCount,
      certificateCount,
    },
    publicProjects,
  }, 'User retrieved successfully');
});

/**
 * @desc    Search users
 * @route   GET /api/users/search
 * @access  Private
 */
export const searchUsers = asyncHandler(async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const {
    query,
    skills,
    page = 1,
    limit = 10,
  } = req.query;
  
  // Convert page and limit to numbers
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  
  // Build search query
  const searchQuery: any = {
    active: true,
  };
  
  if (query) {
    searchQuery.$or = [
      { firstName: { $regex: query, $options: 'i' } },
      { lastName: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
      { company: { $regex: query, $options: 'i' } },
      { position: { $regex: query, $options: 'i' } },
    ];
  }
  
  if (skills) {
    const skillsArray = Array.isArray(skills) 
      ? skills 
      : (skills as string).split(',').map(skill => skill.trim());
    
    searchQuery.skills = { $in: skillsArray };
  }
  
  // Count total users
  const totalUsers = await User.countDocuments(searchQuery);
  
  // Get users with pagination
  const users = await User.find(searchQuery)
    .select('firstName lastName email bio company position avatar skills createdAt')
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .sort({ firstName: 1, lastName: 1 });
  
  // Calculate pagination data
  const baseUrl = `${req.protocol}://${req.get('host')}/api/users/search`;
  const { meta, links } = getPaginationData(totalUsers, pageNum, limitNum, baseUrl);
  
  sendSuccess(res, { users }, 'Users retrieved successfully', 200, meta, links);
});

/**
 * @desc    Deactivate user account
 * @route   POST /api/users/deactivate
 * @access  Private
 */
export const deactivateAccount = asyncHandler(async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const { password } = req.body;
  
  // Validate password
  if (!password) {
    throw new BadRequestError('Password is required');
  }
  
  // Get user with password
  const user = await User.findById(req.user._id).select('+password');
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Verify password
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    throw new BadRequestError('Invalid password');
  }
  
  // Deactivate account
  user.active = false;
  await user.save();
  
  // Clear user cache
  await cacheDelete(`user:${user._id}`);
  
  // Add to token blacklist if token exists
  if (req.token) {
    await cacheSet(`token_blacklist:${req.token}`, true, 60 * 60 * 24 * 7); // 7 days
  }
  
  sendSuccess(res, null, 'Account deactivated successfully');
});

/**
 * @desc    Get user skills
 * @route   GET /api/users/skills
 * @access  Private
 */
export const getSkills = asyncHandler(async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  // Get distinct skills across all users
  const skills = await User.distinct('skills');
  
  sendSuccess(res, { skills }, 'Skills retrieved successfully');
});

/**
 * @desc    Get user activity
 * @route   GET /api/users/activity
 * @access  Private
 */
export const getUserActivity = asyncHandler(async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  // Get user's recent projects (created or updated)
  const recentProjects = await Project.find({
    $or: [
      { owner: req.user._id },
      { lastUpdatedBy: req.user._id },
    ]
  })
    .sort({ updatedAt: -1 })
    .limit(5)
    .select('name updatedAt status')
    .lean();
  
  // Get user's recent certificates
  const recentCertificates = await Certificate.find({
    recipient: req.user._id
  })
    .sort({ issueDate: -1 })
    .limit(5)
    .select('title issueDate issuer status')
    .populate('issuer', 'firstName lastName')
    .lean();
  
  // Get project contribution activity
  const collaborationActivity = await Project.find({
    collaborators: req.user._id,
    owner: { $ne: req.user._id }
  })
    .sort({ updatedAt: -1 })
    .limit(5)
    .select('name updatedAt owner')
    .populate('owner', 'firstName lastName')
    .lean();
  
  sendSuccess(res, {
    recentProjects,
    recentCertificates,
    collaborationActivity
  }, 'User activity retrieved successfully');
});

export default {
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  deleteAvatar,
  getUserProjects,
  getUserCertificates,
  getUserById,
  searchUsers,
  deactivateAccount,
  getSkills,
  getUserActivity,
};