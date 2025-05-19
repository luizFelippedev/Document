import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, BadRequestError, UnauthorizedError } from '../../core/error';
import { sendSuccess } from '../../core/responses';
import aiService from '../services/ai.service';
import mongoose from 'mongoose';
import logger from '../../config/logger';
import { cacheGet, cacheSet } from '../../config/redis';

/**
 * @desc    Generate a project description
 * @route   POST /api/ai/generate/description
 * @access  Private
 */
export const generateProjectDescription = asyncHandler(async (
  req: AuthRequest,
  res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const { prompt } = req.body;
  
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
    throw new BadRequestError('Please provide a valid prompt (minimum 10 characters)');
  }
  
  // Check if the prompt is cached
  const cacheKey = `description_prompt:${req.user._id}:${Buffer.from(prompt).toString('base64')}`;
  const cachedResult = await cacheGet(cacheKey);
  
  if (cachedResult) {
    sendSuccess(res, { description: cachedResult }, 'Generated project description from cache');
    return;
  }
  
  // Generate new description
  const description = await aiService.generateProjectDescription(prompt, req.user._id);
  
  // Cache the result for 1 hour
  await cacheSet(cacheKey, description, 3600);
  
  sendSuccess(res, { description }, 'Project description generated successfully');
});

/**
 * @desc    Analyze a project
 * @route   GET /api/ai/analyze/project/:id
 * @access  Private
 */
export const analyzeProject = asyncHandler(async (
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
  
  // Analyze project
  const analysis = await aiService.analyzeProject(new mongoose.Types.ObjectId(id));
  
  sendSuccess(res, { analysis }, 'Project analyzed successfully');
});

/**
 * @desc    Generate project ideas
 * @route   GET /api/ai/generate/ideas
 * @access  Private
 */
export const generateProjectIdeas = asyncHandler(async (
  req: AuthRequest,
  res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const { category } = req.query;
  
  // Check if we have cached ideas for this user and category
  const cacheKey = `project_ideas:${req.user._id}:${category || 'all'}`;
  const cachedIdeas = await cacheGet(cacheKey);
  
  if (cachedIdeas) {
    sendSuccess(res, { ideas: cachedIdeas }, 'Project ideas retrieved from cache');
    return;
  }
  
  // Generate new ideas
  const ideas = await aiService.generateProjectIdeas(
    req.user._id,
    category as string
  );
  
  // Cache ideas for 24 hours
  await cacheSet(cacheKey, ideas, 86400);
  
  sendSuccess(res, { ideas }, 'Project ideas generated successfully');
});

/**
 * @desc    Generate a project thumbnail
 * @route   POST /api/ai/generate/thumbnail/:projectId
 * @access  Private
 */
export const generateProjectThumbnail = asyncHandler(async (
  req: AuthRequest,
  res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const { projectId } = req.params;
  const { prompt } = req.body;
  
  // Validate project ID
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new BadRequestError('Invalid project ID');
  }
  
  // Generate thumbnail
  const thumbnailPath = await aiService.generateProjectThumbnail(
    new mongoose.Types.ObjectId(projectId),
    prompt
  );
  
  sendSuccess(res, { 
    thumbnailPath,
    thumbnailUrl: `${req.protocol}://${req.get('host')}/${thumbnailPath}`
  }, 'Project thumbnail generated successfully');
});

/**
 * @desc    Find similar projects
 * @route   GET /api/ai/similar/projects/:id
 * @access  Private
 */
export const findSimilarProjects = asyncHandler(async (
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
  
  // Find similar projects
  const similarProjects = await aiService.findSimilarProjects(
    new mongoose.Types.ObjectId(id)
  );
  
  sendSuccess(res, { 
    projects: similarProjects,
    count: similarProjects.length
  }, 'Similar projects found successfully');
});

/**
 * @desc    Check AI service availability
 * @route   GET /api/ai/status
 * @access  Private
 */
export const getAiStatus = asyncHandler(async (
  req: AuthRequest,
  res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  try {
    // Perform a simple AI operation to check availability
    const testPrompt = "Test prompt";
    await aiService.generateProjectDescription(testPrompt, req.user._id);
    
    sendSuccess(res, { 
      status: 'available',
      services: [
        { name: 'project_description', available: true },
        { name: 'project_analysis', available: true },
        { name: 'project_ideas', available: true },
        { name: 'project_thumbnail', available: true },
        { name: 'similar_projects', available: true }
      ]
    }, 'AI services are available');
  } catch (error) {
    logger.error(`AI status check failed: ${error}`);
    
    sendSuccess(res, { 
      status: 'degraded',
      message: 'Some AI services may be unavailable',
      error: (error as Error).message
    }, 'AI service status check completed with issues');
  }
});

export default {
  generateProjectDescription,
  analyzeProject,
  generateProjectIdeas,
  generateProjectThumbnail,
  findSimilarProjects,
  getAiStatus,
};