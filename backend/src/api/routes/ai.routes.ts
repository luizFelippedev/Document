import { Router } from 'express';
import aiController from '../controllers/ai.controller';
import { authenticate, refreshToken, requireVerifiedEmail } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/ai/status
 * @desc    Check AI service availability
 * @access  Private
 */
router.get(
  '/status',
  authenticate,
  refreshToken,
  aiController.getAiStatus
);

/**
 * @route   POST /api/ai/generate/description
 * @desc    Generate a project description
 * @access  Private
 */
router.post(
  '/generate/description',
  authenticate,
  requireVerifiedEmail,
  refreshToken,
  aiController.generateProjectDescription
);

/**
 * @route   GET /api/ai/analyze/project/:id
 * @desc    Analyze a project
 * @access  Private
 */
router.get(
  '/analyze/project/:id',
  authenticate,
  refreshToken,
  aiController.analyzeProject
);

/**
 * @route   GET /api/ai/generate/ideas
 * @desc    Generate project ideas
 * @access  Private
 */
router.get(
  '/generate/ideas',
  authenticate,
  refreshToken,
  aiController.generateProjectIdeas
);

/**
 * @route   POST /api/ai/generate/thumbnail/:projectId
 * @desc    Generate a project thumbnail
 * @access  Private
 */
router.post(
  '/generate/thumbnail/:projectId',
  authenticate,
  requireVerifiedEmail,
  refreshToken,
  aiController.generateProjectThumbnail
);

/**
 * @route   GET /api/ai/similar/projects/:id
 * @desc    Find similar projects
 * @access  Private
 */
router.get(
  '/similar/projects/:id',
  authenticate,
  refreshToken,
  aiController.findSimilarProjects
);

export default router;