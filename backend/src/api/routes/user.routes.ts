import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate, refreshToken } from '../middleware/auth';
import { createUploadMiddleware, handleUploadErrors } from '../middleware/upload';

const router = Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/profile',
  authenticate,
  refreshToken,
  userController.getUserProfile
);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  authenticate,
  refreshToken,
  userController.updateUserProfile
);

/**
 * @route   POST /api/users/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post(
  '/avatar',
  authenticate,
  refreshToken,
  createUploadMiddleware('avatar'),
  handleUploadErrors,
  userController.uploadAvatar
);

/**
 * @route   DELETE /api/users/avatar
 * @desc    Delete user avatar
 * @access  Private
 */
router.delete(
  '/avatar',
  authenticate,
  refreshToken,
  userController.deleteAvatar
);

/**
 * @route   GET /api/users/projects
 * @desc    Get user projects
 * @access  Private
 */
router.get(
  '/projects',
  authenticate,
  refreshToken,
  userController.getUserProjects
);

/**
 * @route   GET /api/users/certificates
 * @desc    Get user certificates
 * @access  Private
 */
router.get(
  '/certificates',
  authenticate,
  refreshToken,
  userController.getUserCertificates
);

/**
 * @route   GET /api/users/search
 * @desc    Search users
 * @access  Private
 */
router.get(
  '/search',
  authenticate,
  refreshToken,
  userController.searchUsers
);

/**
 * @route   POST /api/users/deactivate
 * @desc    Deactivate user account
 * @access  Private
 */
router.post(
  '/deactivate',
  authenticate,
  refreshToken,
  userController.deactivateAccount
);

/**
 * @route   GET /api/users/skills
 * @desc    Get user skills
 * @access  Private
 */
router.get(
  '/skills',
  authenticate,
  refreshToken,
  userController.getSkills
);

/**
 * @route   GET /api/users/activity
 * @desc    Get user activity
 * @access  Private
 */
router.get(
  '/activity',
  authenticate,
  refreshToken,
  userController.getUserActivity
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (public profile)
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  refreshToken,
  userController.getUserById
);

export default router;