import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { authenticate, authorize, refreshToken } from '../middleware/auth';

const router = Router();

// All routes require admin access
const adminMiddleware = [
  authenticate,
  authorize(['admin']),
  refreshToken,
];

/**
 * @route   GET /api/admin/stats
 * @desc    Get system statistics
 * @access  Private (Admin)
 */
router.get('/stats', adminMiddleware, adminController.getSystemStats);

/**
 * @route   GET /api/admin/overview
 * @desc    Get system overview
 * @access  Private (Admin)
 */
router.get('/overview', adminMiddleware, adminController.getSystemOverview);

/**
 * @route   GET /api/admin/logs
 * @desc    Get system logs
 * @access  Private (Admin)
 */
router.get('/logs', adminMiddleware, adminController.getSystemLogs);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Private (Admin)
 */
router.get('/users', adminMiddleware, adminController.getAllUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID (admin view)
 * @access  Private (Admin)
 */
router.get('/users/:id', adminMiddleware, adminController.getUserById);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user
 * @access  Private (Admin)
 */
router.put('/users/:id', adminMiddleware, adminController.updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user
 * @access  Private (Admin)
 */
router.delete('/users/:id', adminMiddleware, adminController.deleteUser);

/**
 * @route   POST /api/admin/notifications
 * @desc    Send system notification
 * @access  Private (Admin)
 */
router.post('/notifications', adminMiddleware, adminController.sendSystemNotification);

export default router;