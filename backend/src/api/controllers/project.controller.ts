import { Response, NextFunction } from 'express';
import mongoose, { Types } from 'mongoose';
import Project, { IProject } from '../models/project.model';
import User from '../models/user.model';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../core/error';
import { sendSuccess, sendCreated, sendNoContent, getPaginationData } from '../../core/responses';
import { deleteFile } from '../middleware/upload';
import { cacheGet, cacheSet, cacheDelete } from '../../config/redis';
import logger from '../../config/logger';
import { createNotification } from '../services/notification.service';
import { generateImage } from '../../lib/openai';
import path from 'path';
import fs from 'fs';

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private
 */
export const createProject = asyncHandler(async (
  req: AuthRequest,
  res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const {
    name,
    description,
    category,
    tags,
    visibility,
    collaborators,
    startDate,
    endDate,
    aiGenerated,
    aiPrompt,
  } = req.body;
  
  // Create project
  const project = await Project.create({
    name,
    description,
    owner: req.user._id,
    category,
    tags: tags || [],
    visibility: visibility || 'private',
    collaborators: collaborators || [],
    startDate: startDate || null,
    endDate: endDate || null,
    aiGenerated: aiGenerated || false,
    aiPrompt: aiPrompt || null,
    lastUpdatedBy: req.user._id,
  });
  
  // If collaborators are specified, notify them
  if (collaborators && collaborators.length > 0) {
    const validCollaborators = await User.find({
      _id: { $in: collaborators },
      active: true,
    }).select('_id');
    
    const validCollaboratorIds = validCollaborators.map(user => user._id);
    
    // Add valid collaborators to the project
    if (validCollaboratorIds.length > 0) {
      project.collaborators = validCollaboratorIds;
      await project.save();
      
      // Create notifications for collaborators
      validCollaboratorIds.forEach(async (userId) => {
        await createNotification({
          recipient: new Types.ObjectId(userId),
          sender: req.user?._id,
          type: 'info',
          title: 'Project Collaboration',
          message: `You've been added as a collaborator to "${project.name}"`,
          link: `/projects/${project._id}`,
          entity: {
            type: 'project',
            id: project._id,
          },
        });
      });
    }
  }
  
  // Handle file upload if there's a file
  if (req.file) {
    project.files.push({
      name: req.file.originalname,
      path: req.file.path.replace(/\\/g, '/'), // Normalize path for different OSes
      size: req.file.size,
      type: req.file.mimetype,
      uploadedAt: new Date(),
    });
    
    // If it's an image, use it as a thumbnail
    if (req.file.mimetype.startsWith('image/')) {
      project.thumbnail = req.file.path.replace(/\\/g, '/');
    }
    
    await project.save();
  }
  
  // If AI generated thumbnail was requested but no image was uploaded
  if (!project.thumbnail && aiGenerated && aiPrompt) {
    try {
      // Generate a thumbnail image using AI
      const imageUrl = await generateImage(
        aiPrompt || `A professional project thumbnail for ${name}`, 
        '1024x1024'
      );
      
      // Download the image and save it to the project's directory
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();
      
      // Create directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), 'uploads', 'projects', req.user._id.toString());
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Generate a unique filename
      const filename = `${Date.now()}-thumbnail.png`;
      const filePath = path.join(uploadDir, filename);
      
      // Save the image
      fs.writeFileSync(filePath, Buffer.from(buffer));
      
      // Update project with thumbnail path
      project.thumbnail = `uploads/projects/${req.user._id}/${filename}`.replace(/\\/g, '/');
      await project.save();
    } catch (error) {
      logger.error(`Error generating AI thumbnail: ${error}`);
      // Continue without a thumbnail if generation fails
    }
  }
  
  sendCreated(res, { project }, 'Project created successfully');
});

/**
 * @desc    Get all projects
 * @route   GET /api/projects
 * @access  Private
 */
export const getProjects = asyncHandler(async (
  req: AuthRequest,
  res: Response): Promise<any> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    status,
    category,
    search,
    tags,
  } = req.query;
  
  // Convert page and limit to numbers
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  
  // Validate pagination params
  if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
    throw new BadRequestError('Invalid pagination parameters');
  }
  
  // Build query based on user role and filters
  const query: any = {};
  
  // Regular users can only see their own projects or projects they collaborate on
  if (req.user.role !== 'admin') {
    query.$or = [
      { owner: req.user._id },
      { collaborators: req.user._id },
      { visibility: 'public' },
    ];
  }
  
  // Apply filters
  if (status) {
    query.status = status;
  }
  
  if (category) {
    query.category = category;
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  
  if (tags) {
    const tagArray = Array.isArray(tags) 
      ? tags 
      : (tags as string).split(',').map(tag => tag.trim());
    query.tags = { $in: tagArray };
  }
  
  // Cache key based on query and user
  const cacheKey = `projects:${req.user._id}:${JSON.stringify(req.query)}`;
  
  // Try to get from cache first
  const cachedResult = await cacheGet(cacheKey);
  if (cachedResult && typeof cachedResult === 'object' && 'data' in cachedResult) {
    return sendSuccess(res, (cachedResult as any).data, 'Projects retrieved from cache', 200, (cachedResult as any).meta, (cachedResult as any).links);
  }
  
  // Determine sort options
  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
  
  // Count total documents for pagination
  const totalProjects = await Project.countDocuments(query);
  
  // Get projects with pagination
  const projects = await Project.find(query)
    .sort(sortOptions)
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .populate('owner', 'firstName lastName email avatar')
    .populate('collaborators', 'firstName lastName email avatar')
    .populate('lastUpdatedBy', 'firstName lastName email');
  
  // Calculate pagination data
  const baseUrl = `${req.protocol}://${req.get('host')}/api/projects`;
  const { meta, links } = getPaginationData(totalProjects, pageNum, limitNum, baseUrl);
  
  // Cache the result for 5 minutes
  const result = { data: { projects }, meta, links };
  await cacheSet(cacheKey, result, 300);
  
  sendSuccess(res, { projects }, 'Projects retrieved successfully', 200, meta, links);
});

/**
 * @desc    Get a project by ID
 * @route   GET /api/projects/:id
 * @access  Private
 */
export const getProjectById = asyncHandler(async (
  req: AuthRequest,
  res: Response): Promise<any> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const { id } = req.params;
  
  // Validate project ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid project ID');
  }
  
  // Cache key
  const cacheKey = `project:${id}`;
  
  // Try to get from cache first
  const cachedProject = await cacheGet(cacheKey);
  if (cachedProject) {
    // Check if user has access to the project
    const project = cachedProject as IProject;
    
    if (
      project.visibility !== 'public' && 
      project.owner.toString() !== req.user._id.toString() && 
      !project.collaborators.some(collab => collab.toString() === req.user?._id.toString()) && 
      req.user.role !== 'admin'
    ) {
      throw new ForbiddenError('You do not have access to this project');
    }
    
    return sendSuccess(res, { project }, 'Project retrieved from cache');
  }
  
  // Find project
  const project = await Project.findById(id)
    .populate('owner', 'firstName lastName email avatar')
    .populate('collaborators', 'firstName lastName email avatar')
    .populate('lastUpdatedBy', 'firstName lastName email');
  
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  // Check if user has access to the project
  if (
    project.visibility !== 'public' && 
    project.owner.toString() !== req.user._id.toString() && 
    !project.collaborators.some(collab => collab.toString() === req.user?._id.toString()) && 
    req.user.role !== 'admin'
  ) {
    throw new ForbiddenError('You do not have access to this project');
  }
  
  // Increment views counter
  project.metrics.views += 1;
  await project.save();
  
  // Cache the project for 5 minutes
  await cacheSet(cacheKey, project, 300);
  
  sendSuccess(res, { project }, 'Project retrieved successfully');
});

/**
 * @desc    Update a project
 * @route   PUT /api/projects/:id
 * @access  Private
 */
export const updateProject = asyncHandler(async (
  req: AuthRequest,
  res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const { id } = req.params;
  
  // Validate project ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid project ID');
  }
  
  // Find project
  const project = await Project.findById(id);
  
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  // Check if user is owner, collaborator, or admin
  if (
    project.owner.toString() !== req.user._id.toString() && 
    !project.collaborators.some(collab => collab.toString() === req.user?._id.toString()) && 
    req.user.role !== 'admin'
  ) {
    throw new ForbiddenError('You do not have permission to update this project');
  }
  
  // Update fields
  const {
    name,
    description,
    category,
    tags,
    visibility,
    status,
    startDate,
    endDate,
    aiPrompt,
  } = req.body;
  
  // Only update fields that are provided
  if (name) project.name = name;
  if (description) project.description = description;
  if (category) project.category = category;
  if (tags) project.tags = tags;
  if (visibility) project.visibility = visibility;
  if (status) project.status = status;
  if (startDate) project.startDate = new Date(startDate);
  if (endDate) project.endDate = new Date(endDate);
  if (aiPrompt) project.aiPrompt = aiPrompt;
  
  // Update last updated by
  project.lastUpdatedBy = req.user._id;
  
  // Handle file upload if there's a file
  if (req.file) {
    project.files.push({
      name: req.file.originalname,
      path: req.file.path.replace(/\\/g, '/'), // Normalize path
      size: req.file.size,
      type: req.file.mimetype,
      uploadedAt: new Date(),
    });
    
    // If it's an image, use it as a thumbnail
    if (req.file.mimetype.startsWith('image/')) {
      project.thumbnail = req.file.path.replace(/\\/g, '/');
    }
  }
  
  // Save changes
  await project.save();
  
  // Clear project cache
  await cacheDelete(`project:${id}`);
  
  // Invalidate user's projects cache
  await cacheDelete(`projects:${req.user._id}:*`);
  
  // If status changed to 'completed', notify owner and collaborators
  if (status === 'completed' && project.status !== 'completed') {
    // Notify owner if the updater is not the owner
    if (project.owner.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: new Types.ObjectId(project.owner.toString()),
        sender: req.user._id,
        type: 'success',
        title: 'Project Completed',
        message: `Your project "${project.name}" has been marked as completed`,
        link: `/projects/${project._id}`,
        entity: {
          type: 'project',
          id: project._id,
        },
      });
    }
    
    // Notify collaborators
    project.collaborators.forEach(async (collaboratorId) => {
      if (collaboratorId.toString() !== req.user?._id.toString()) {
        await createNotification({
          recipient: new Types.ObjectId(collaboratorId.toString()),
          sender: req.user?._id,
          type: 'success',
          title: 'Project Completed',
          message: `Project "${project.name}" has been marked as completed`,
          link: `/projects/${project._id}`,
          entity: {
            type: 'project',
            id: project._id,
          },
        });
      }
    });
  }
  
  sendSuccess(res, { project }, 'Project updated successfully');
});

/**
 * @desc    Delete a project
 * @route   DELETE /api/projects/:id
 * @access  Private
 */
export const deleteProject = asyncHandler(async (
  req: AuthRequest,
  res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const { id } = req.params;
  
  // Validate project ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid project ID');
  }
  
  // Find project
  const project = await Project.findById(id);
  
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  // Check if user is owner or admin
  if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ForbiddenError('You do not have permission to delete this project');
  }
  
  // Delete project files
  for (const file of project.files) {
    await deleteFile(file.path);
  }
  
  // Delete thumbnail if it exists
  if (project.thumbnail) {
    await deleteFile(project.thumbnail);
  }
  
  // Delete project
  await Project.deleteOne({ _id: id });
  
  // Clear project cache
  await cacheDelete(`project:${id}`);
  
  // Invalidate user's projects cache
  await cacheDelete(`projects:${req.user._id}:*`);
  
  // Notify collaborators
  project.collaborators.forEach(async (collaboratorId) => {
    await createNotification({
      recipient: new Types.ObjectId(collaboratorId.toString()),
      sender: req.user?._id,
      type: 'info',
      title: 'Project Deleted',
      message: `Project "${project.name}" has been deleted`,
      entity: {
        type: 'project',
        id: project._id,
      },
    });
  });
  
  sendNoContent(res);
});

/**
 * @desc    Add collaborators to a project
 * @route   POST /api/projects/:id/collaborators
 * @access  Private
 */
export const addCollaborators = asyncHandler(async (
  req: AuthRequest,
  res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const { id } = req.params;
  const { collaborators } = req.body;
  
  // Validate project ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid project ID');
  }
  
  // Find project
  const project = await Project.findById(id);
  
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  // Check if user is owner or admin
  if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ForbiddenError('You do not have permission to add collaborators to this project');
  }
  
  // Check if collaborators is an array and not empty
  if (!Array.isArray(collaborators) || collaborators.length === 0) {
    throw new BadRequestError('Collaborators must be a non-empty array');
  }
  
  // Verify that all collaborator IDs are valid
  if (!collaborators.every(id => mongoose.Types.ObjectId.isValid(id))) {
    throw new BadRequestError('Invalid collaborator ID');
  }
  
  // Find users that exist and are active
  const users = await User.find({
    _id: { $in: collaborators },
    active: true,
  }).select('_id firstName lastName email');
  
  if (users.length === 0) {
    throw new BadRequestError('No valid users found');
  }
  
  // Get current collaborators as strings for comparison
  const currentCollaborators = project.collaborators.map(id => id.toString());
  
  // Filter out users who are already collaborators
  const newCollaborators = users.filter(
    user => !currentCollaborators.includes(user._id.toString())
  );
  
  if (newCollaborators.length === 0) {
    throw new BadRequestError('All users are already collaborators');
  }
  
  // Add new collaborators
  project.collaborators.push(...newCollaborators.map(user => user._id));
  await project.save();
  
  // Clear project cache
  await cacheDelete(`project:${id}`);
  
  // Notify new collaborators
  newCollaborators.forEach(async (user) => {
    await createNotification({
      recipient: new Types.ObjectId(user._id.toString()),
      sender: req.user?._id,
      type: 'info',
      title: 'Project Collaboration',
      message: `You've been added as a collaborator to "${project.name}"`,
      link: `/projects/${project._id}`,
      entity: {
        type: 'project',
        id: project._id,
      },
    });
  });
  
  sendSuccess(
    res,
    { 
      project,
      addedCollaborators: newCollaborators.map(user => ({
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      }))
    },
    'Collaborators added successfully'
  );
});

/**
 * @desc    Remove collaborator from a project
 * @route   DELETE /api/projects/:id/collaborators/:collaboratorId
 * @access  Private
 */
export const removeCollaborator = asyncHandler(async (
  req: AuthRequest,
  res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const { id, collaboratorId } = req.params;
  
  // Validate IDs
  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(collaboratorId)) {
    throw new BadRequestError('Invalid ID format');
  }
  
  // Find project
  const project = await Project.findById(id);
  
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  // Check permissions: owner, admin, or self-removal
  const isSelfRemoval = collaboratorId === req.user._id.toString();
  const isOwnerOrAdmin = project.owner.toString() === req.user._id.toString() || req.user.role === 'admin';
  
  if (!isOwnerOrAdmin && !isSelfRemoval) {
    throw new ForbiddenError('You do not have permission to remove this collaborator');
  }
  
  // Check if user is a collaborator
  const collaboratorIndex = project.collaborators.findIndex(
    collab => collab.toString() === collaboratorId
  );
  
  if (collaboratorIndex === -1) {
    throw new BadRequestError('User is not a collaborator on this project');
  }
  
  // Remove collaborator
  project.collaborators.splice(collaboratorIndex, 1);
  await project.save();
  
  // Clear project cache
  await cacheDelete(`project:${id}`);
  
  // If not self-removal, notify the removed collaborator
  if (!isSelfRemoval) {
    await createNotification({
      recipient: new Types.ObjectId(collaboratorId),
      sender: req.user?._id,
      type: 'info',
      title: 'Project Collaboration Ended',
      message: `You've been removed as a collaborator from "${project.name}"`,
      entity: {
        type: 'project',
        id: project._id,
      },
    });
  }
  
  // If self-removal, notify the project owner
  if (isSelfRemoval && project.owner.toString() !== req.user._id.toString()) {
    await createNotification({
      recipient: new Types.ObjectId(project.owner.toString()),
      sender: req.user?._id,
      type: 'info',
      title: 'Collaborator Left',
      message: `${req.user.firstName} ${req.user.lastName} has left the project "${project.name}"`,
      link: `/projects/${project._id}`,
      entity: {
        type: 'project',
        id: project._id,
      },
    });
  }
  
  sendSuccess(res, { success: true }, 'Collaborator removed successfully');
});

/**
 * @desc    Upload file to a project
 * @route   POST /api/projects/:id/files
 * @access  Private
 */
export const uploadProjectFile = asyncHandler(async (
  req: AuthRequest,
  res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const { id } = req.params;
  
  // Check if file was uploaded
  if (!req.file) {
    throw new BadRequestError('No file uploaded');
  }
  
  // Validate project ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid project ID');
  }
  
  // Find project
  const project = await Project.findById(id);
  
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  // Check if user is owner or collaborator
  if (
    project.owner.toString() !== req.user._id.toString() && 
    !project.collaborators.some(collab => collab.toString() === req.user?._id.toString()) && 
    req.user.role !== 'admin'
  ) {
    throw new ForbiddenError('You do not have permission to add files to this project');
  }
  
  // Add file to project
  const file = {
    name: req.body.name || req.file.originalname,
    path: req.file.path.replace(/\\/g, '/'), // Normalize path
    size: req.file.size,
    type: req.file.mimetype,
    uploadedAt: new Date(),
  };
  
  project.files.push(file);
  
  // If it's an image and no thumbnail exists, use it as thumbnail
  if (req.file.mimetype.startsWith('image/') && !project.thumbnail) {
    project.thumbnail = req.file.path.replace(/\\/g, '/');
  }
  
  // Update last updated by
  project.lastUpdatedBy = req.user._id;
  
  await project.save();
  
  // Clear project cache
  await cacheDelete(`project:${id}`);
  
  // Notify owner if uploader is not the owner
  if (project.owner.toString() !== req.user._id.toString()) {
    await createNotification({
      recipient: new Types.ObjectId(project.owner.toString()),
      sender: req.user?._id,
      type: 'info',
      title: 'New File Added',
      message: `A new file "${file.name}" has been added to your project "${project.name}"`,
      link: `/projects/${project._id}`,
      entity: {
        type: 'project',
        id: project._id,
      },
    });
  }
  
  sendSuccess(res, { file }, 'File uploaded successfully');
});

/**
 * @desc    Delete file from a project
 * @route   DELETE /api/projects/:id/files/:fileId
 * @access  Private
 */
export const deleteProjectFile = asyncHandler(async (
  req: AuthRequest,
  res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const { id, fileId } = req.params;
  
  // Validate project ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid project ID');
  }
  
  // Find project
  const project = await Project.findById(id);
  
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  // Check if user is owner or admin
  if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ForbiddenError('You do not have permission to delete files from this project');
  }
  
  // Since files may not have _id property, find by index
  const fileIndex = project.files.findIndex((_file, index) => index.toString() === fileId);
  
  if (fileIndex === -1) {
    throw new NotFoundError('File not found');
  }
  
  // Get file before removing
  const file = project.files[fileIndex];
  
  // Delete file from filesystem
  await deleteFile(file.path);
  
  // Remove file from project
  project.files.splice(fileIndex, 1);
  
  // If file was used as thumbnail, remove thumbnail reference
  if (project.thumbnail === file.path) {
    project.thumbnail = undefined;
  }
  
  // Update last updated by
  project.lastUpdatedBy = req.user._id;
  
  await project.save();
  
  // Clear project cache
  await cacheDelete(`project:${id}`);
  
  sendSuccess(res, null, 'File deleted successfully');
});

/**
 * @desc    Like a project
 * @route   POST /api/projects/:id/like
 * @access  Private
 */
export const likeProject = asyncHandler(async (
  req: AuthRequest,
  res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const { id } = req.params;
  
  // Validate project ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid project ID');
  }
  
  // Find project
  const project = await Project.findById(id);
  
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  // Increment likes
  project.metrics.likes += 1;
  await project.save();
  
  // Clear project cache
  await cacheDelete(`project:${id}`);
  
  // If user is not the owner, notify the owner
  if (project.owner.toString() !== req.user._id.toString()) {
    await createNotification({
      recipient: new Types.ObjectId(project.owner.toString()),
      sender: req.user._id,
      type: 'success',
      title: 'Project Liked',
      message: `${req.user.firstName} ${req.user.lastName} liked your project "${project.name}"`,
      link: `/projects/${project._id}`,
      entity: {
        type: 'project',
        id: project._id,
      },
    });
  }
  
  sendSuccess(res, { likes: project.metrics.likes }, 'Project liked successfully');
});

/**
 * @desc    Share a project
 * @route   POST /api/projects/:id/share
 * @access  Private
 */
export const shareProject = asyncHandler(async (
  req: AuthRequest,
  res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const { id } = req.params;
  
  // Validate project ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid project ID');
  }
  
  // Find project
  const project = await Project.findById(id);
  
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  // Public projects can be shared by anyone, private/team projects only by collaborators or owner
  if (
    project.visibility !== 'public' && 
    project.owner.toString() !== req.user._id.toString() && 
    !project.collaborators.some(collab => collab.toString() === req.user?._id.toString()) && 
    req.user.role !== 'admin'
  ) {
    throw new ForbiddenError('You do not have permission to share this project');
  }
  
  // Increment shares
  project.metrics.shares += 1;
  await project.save();
  
  // Clear project cache
  await cacheDelete(`project:${id}`);
  
  // Generate a shareable link/token if needed
  const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${project._id}`;
  
  sendSuccess(res, { 
    shareUrl,
    shares: project.metrics.shares 
  }, 'Project shared successfully');
});

/**
 * @desc    Download a project file
 * @route   GET /api/projects/:id/files/:fileId/download
 * @access  Private
 */
export const downloadProjectFile = asyncHandler(async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const { id, fileId } = req.params;
  
  // Validate project ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid project ID');
  }
  
  // Find project
  const project = await Project.findById(id);
  
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  // Check if user has access to the project
  if (
    project.visibility !== 'public' && 
    project.owner.toString() !== req.user._id.toString() && 
    !project.collaborators.some(collab => collab.toString() === req.user?._id.toString()) && 
    req.user.role !== 'admin'
  ) {
    throw new ForbiddenError('You do not have access to this project');
  }
  
  // Find file by index
  const fileIndex = parseInt(fileId, 10);
  if (isNaN(fileIndex) || fileIndex < 0 || fileIndex >= project.files.length) {
    throw new NotFoundError('File not found');
  }
  
  const file = project.files[fileIndex];
  
  if (!file) {
    throw new NotFoundError('File not found');
  }
  
  // Increment downloads count
  project.metrics.downloads += 1;
  await project.save();
  
  // Clear project cache
  await cacheDelete(`project:${id}`);
  
  // Send file for download
  res.download(file.path, file.name, (err) => {
    if (err) {
      next(new Error('Error downloading file'));
    }
  });
});

/**
 * @desc    Get project categories
 * @route   GET /api/projects/categories
 * @access  Private
 */
export const getProjectCategories = asyncHandler(async (
  _req: AuthRequest,
  res: Response): Promise<any> => {
  // Try to get from cache first
  const cacheKey = 'project:categories';
  const cachedCategories = await cacheGet(cacheKey);
  
  if (cachedCategories) {
    return sendSuccess(res, { categories: cachedCategories }, 'Categories retrieved from cache');
  }
  
  // Get distinct categories
  const categories = await Project.distinct('category');
  
  // Cache the result for 1 day
  await cacheSet(cacheKey, categories, 86400);
  
  sendSuccess(res, { categories }, 'Project categories retrieved successfully');
});

export default {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addCollaborators,
  removeCollaborator,
  uploadProjectFile,
  deleteProjectFile,
  likeProject,
  shareProject,
  downloadProjectFile,
  getProjectCategories,
};