import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { validate } from '../validators/auth.validator';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  changePasswordSchema,
  setupTotpSchema,
  verifyTotpSchema,
} from '../validators/auth.validator';
import {
  authenticate,
  refreshToken,
  requireVerifiedEmail,
} from '../middleware/auth';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with token
 * @access  Public
 */
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification email
 * @access  Private
 */
router.post('/resend-verification', authenticate, authController.resendVerification);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change password (when logged in)
 * @access  Private
 */
router.put(
  '/change-password',
  authenticate,
  refreshToken,
  validate(changePasswordSchema),
  authController.changePassword
);

/**
 * @route   GET /api/auth/totp/setup
 * @desc    Setup TOTP (Two Factor Authentication)
 * @access  Private
 */
router.get(
  '/totp/setup',
  authenticate,
  requireVerifiedEmail,
  refreshToken,
  authController.setupTOTP
);

/**
 * @route   POST /api/auth/totp/verify
 * @desc    Verify and enable TOTP
 * @access  Private
 */
router.post(
  '/totp/verify',
  authenticate,
  requireVerifiedEmail,
  validate(setupTotpSchema),
  refreshToken,
  authController.verifyAndEnableTOTP
);

/**
 * @route   POST /api/auth/totp/disable
 * @desc    Disable TOTP
 * @access  Private
 */
router.post(
  '/totp/disable',
  authenticate,
  requireVerifiedEmail,
  refreshToken,
  authController.disableTOTP
);

/**
 * @route   POST /api/auth/totp/login-verify
 * @desc    Verify TOTP during login
 * @access  Private (with token)
 */
router.post(
  '/totp/login-verify',
  authenticate,
  validate(verifyTotpSchema),
  authController.verifyTOTPLogin
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, refreshToken, authController.getMe);

export default router;