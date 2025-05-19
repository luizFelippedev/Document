import { Router } from 'express';
import projectController from '../controllers/project.controller';
import { authenticate, refreshToken, requireVerifiedEmail } from '../middleware/auth';
import { createUploadMiddleware, handleUploadErrors } from '../middleware/upload';
import { validate } from '../validators/auth.validator';
import {
  createProjectSchema,
  updateProjectSchema,
  addCollaboratorsSchema,
  addProjectFileSchema,
} from '../validators/project.validator';

const router = Router();

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  requireVerifiedEmail,
  refreshToken,
  createUploadMiddleware('project'),
  handleUploadErrors,
  validate(createProjectSchema),
  projectController.createProject
);

/**
 * @route   GET /api/projects
 * @desc    Get all projects for the user
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  refreshToken,
  projectController.getProjects
);

/**
 * @route   GET /api/projects/categories
 * @desc    Get project categories
 * @access  Private
 */
router.get(
  '/categories',
  authenticate,
  refreshToken,
  projectController.getProjectCategories
);

/**
 * @route   GET /api/projects/:id
 * @desc    Get a project by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  refreshToken,
  projectController.getProjectById
);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update a project
 * @access  Private
 */
router.put(
  '/:id',
  authenticate,
  requireVerifiedEmail,
  refreshToken,
  createUploadMiddleware('project'),
  handleUploadErrors,
  validate(updateProjectSchema),
  projectController.updateProject
);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete a project
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  refreshToken,
  projectController.deleteProject
);

/**
 * @route   POST /api/projects/:id/collaborators
 * @desc    Add collaborators to a project
 * @access  Private
 */
router.post(
  '/:id/collaborators',
  authenticate,
  requireVerifiedEmail,
  refreshToken,
  validate(addCollaboratorsSchema),
  projectController.addCollaborators
);

/**
 * @route   DELETE /api/projects/:id/collaborators/:collaboratorId
 * @desc    Remove collaborator from a project
 * @access  Private
 */
router.delete(
  '/:id/collaborators/:collaboratorId',
  authenticate,
  refreshToken,
  projectController.removeCollaborator
);

/**
 * @route   POST /api/projects/:id/files
 * @desc    Upload file to a project
 * @access  Private
 */
router.post(
  '/:id/files',
  authenticate,
  requireVerifiedEmail,
  refreshToken,
  createUploadMiddleware('project'),
  handleUploadErrors,
  validate(addProjectFileSchema),
  projectController.uploadProjectFile
);

/**
 * @route   DELETE /api/projects/:id/files/:fileId
 * @desc    Delete file from a project
 * @access  Private
 */
router.delete(
  '/:id/files/:fileId',
  authenticate,
  refreshToken,
  projectController.deleteProjectFile
);

/**
 * @route   GET /api/projects/:id/files/:fileId/download
 * @desc    Download a project file
 * @access  Private
 */
router.get(
  '/:id/files/:fileId/download',
  authenticate,
  refreshToken,
  projectController.downloadProjectFile
);

/**
 * @route   POST /api/projects/:id/like
 * @desc    Like a project
 * @access  Private
 */
router.post(
  '/:id/like',
  authenticate,
  refreshToken,
  projectController.likeProject
);

/**
 * @route   POST /api/projects/:id/share
 * @desc    Share a project
 * @access  Private
 */
router.post(
  '/:id/share',
  authenticate,
  refreshToken,
  projectController.shareProject
);

export default router;