import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import { asyncHandler, BadRequestError, NotFoundError, UnauthorizedError } from '../../core/error';
import { 
  sendSuccess, 
  sendCreated, 
  sendNoContent 
} from '../../core/responses';
import { AuthRequest } from '../middleware/auth';
import { cacheSet, cacheDelete, cacheGet } from '../../config/redis';
import logger from '../../config/logger';
import { sendEmail } from '../../utils/email';
import { generateTOTP, verifyTOTP } from '../../utils/totp';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (
  req: Request,
  res: Response): Promise<void> => {
  const { 
    firstName, 
    lastName, 
    email, 
    password, 
    company, 
    position, 
    bio,
    skills 
  } = req.body;
  
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new BadRequestError('User with this email already exists');
  }
  
  // Create new user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    company,
    position,
    bio,
    skills: skills || [],
  });
  
  // Generate verification token
  const verificationToken = user.generateVerificationToken();
  await user.save();
  
  // Send verification email
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
  
  await sendEmail({
    to: user.email,
    subject: 'Please verify your email address',
    template: 'email-verification',
    data: {
      firstName: user.firstName,
      verificationUrl,
    },
  });
  
  // Generate JWT token
  const token = user.generateAuthToken();
  
  // Create payload for response
  const userWithoutSensitiveData = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    company: user.company,
    position: user.position,
    bio: user.bio,
    verified: user.verified,
    role: user.role,
    skills: user.skills,
  };
  
  sendCreated(res, { user: userWithoutSensitiveData, token }, 'User registered successfully. Please check your email to verify your account.');
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (
  req: Request,
  res: Response): Promise<void> => {
  const { email, password, remember } = req.body;
  
  // Find user by email with password included
  const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil +twoFactorSecret +twoFactorEnabled');
  
  // Check if user exists
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }
  
  // Check if account is locked
  if (user.isLocked()) {
    throw new UnauthorizedError('Account is temporarily locked due to too many failed login attempts. Please try again later.');
  }
  
  // Check if user is active
  if (!user.active) {
    throw new UnauthorizedError('Your account has been deactivated. Please contact support.');
  }
  
  // Verify password
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    // Increment login attempts
    await user.incrementLoginAttempts();
    throw new UnauthorizedError('Invalid email or password');
  }
  
  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    user.loginAttempts = 0;
    user.lockUntil = undefined;
  }
  
  // Update last login
  user.lastLogin = new Date();
  await user.save();
  
  // Generate JWT token with appropriate expiration
  const expiresIn = remember ? '30d' : '7d';
  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || 'your-secret-key',
    {
      expiresIn,
    }
  );
  
  // Create response payload
  const userResponse = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    verified: user.verified,
    twoFactorEnabled: user.twoFactorEnabled,
    lastLogin: user.lastLogin,
  };
  
  // Check if two-factor authentication is enabled
  if (user.twoFactorEnabled) {
    // Return partial success with auth token but indicate 2FA is required
    sendSuccess(
      res,
      { 
        user: userResponse, 
        token, 
        requireTwoFactor: true 
      },
      'Login successful. Two-factor authentication required.'
    );
  }
  
  // Standard login response
  sendSuccess(res, { user: userResponse, token }, 'Login successful');
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (
  req: AuthRequest,
  res: Response): Promise<void> => {
  // Add token to blacklist
  if (req.token) {
    // Decode token to get expiration time
    const decoded = jwt.decode(req.token) as any;
    
    if (decoded && decoded.exp) {
      // Calculate TTL (time to expiration) in seconds
      const now = Math.floor(Date.now() / 1000);
      const ttl = decoded.exp - now;
      
      // Add token to blacklist with the same TTL as the token's expiration
      await cacheSet(`token_blacklist:${req.token}`, true, ttl > 0 ? ttl : 3600);
    }
  }
  
  // Clear session if using sessions
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        logger.error(`Error destroying session: ${err}`);
      }
    });
  }
  
  sendNoContent(res);
});

/**
 * @desc    Verify email
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
export const verifyEmail = asyncHandler(async (
  req: Request,
  res: Response): Promise<void> => {
  const { token } = req.body;
  
  // Hash the token from request
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Find user with matching token
  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationExpires: { $gt: Date.now() },
  });
  
  if (!user) {
    throw new BadRequestError('Invalid or expired verification token');
  }
  
  // Update user verification status
  user.verified = true;
  user.verificationToken = undefined;
  user.verificationExpires = undefined;
  await user.save();
  
  sendSuccess(res, null, 'Email verified successfully');
});

/**
 * @desc    Resend verification email
 * @route   POST /api/auth/resend-verification
 * @access  Private
 */
export const resendVerification = asyncHandler(async (
  req: AuthRequest,
  res: Response): Promise<void> => {
  const user = req.user;
  
  if (!user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  if (user.verified) {
    throw new BadRequestError('Email is already verified');
  }
  
  // Generate new verification token
  const verificationToken = user.generateVerificationToken();
  await user.save();
  
  // Send verification email
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
  
  await sendEmail({
    to: user.email,
    subject: 'Please verify your email address',
    template: 'email-verification',
    data: {
      firstName: user.firstName,
      verificationUrl,
    },
  });
  
  sendSuccess(res, null, 'Verification email sent successfully');
});

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (
  req: Request,
  res: Response): Promise<void> => {
  const { email } = req.body;
  
  // Find user by email
  const user = await User.findOne({ email });
  
  // Don't reveal if user exists or not
  if (!user || !user.active) {
    sendSuccess(
      res,
      null,
      'If your email is registered, you will receive a password reset link'
    );
    return;
  }

  // Generate reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save();
  
  // Create reset URL
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  try {
    // Send email
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      data: {
        firstName: user.firstName,
        resetUrl,
        expiryHours: 1, // Token expires in 1 hour
      },
    });
    
    sendSuccess(
      res,
      null,
      'Password reset email sent successfully'
    );
  } catch (error) {
    // If email sending fails, clear the reset token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    logger.error(`Error sending password reset email: ${error}`);
    throw new Error('Error sending password reset email. Please try again later.');
  }
});

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = asyncHandler(async (
  req: Request,
  res: Response): Promise<void> => {
  const { token, password } = req.body;
  
  // Hash the token from request
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Find user with matching token that hasn't expired
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });
  
  if (!user) {
    throw new BadRequestError('Invalid or expired password reset token');
  }
  
  // Update password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  
  // Reset login attempts
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  
  await user.save();
  
  // Send password changed notification email
  await sendEmail({
    to: user.email,
    subject: 'Password Changed Successfully',
    template: 'password-changed',
    data: {
      firstName: user.firstName,
    },
  });
  
  sendSuccess(res, null, 'Password reset successfully');
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (
  req: AuthRequest,
  res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  // Get user with password
  const user = await User.findById(req.user._id).select('+password');
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  
  if (!isMatch) {
    throw new BadRequestError('Current password is incorrect');
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  // Invalidate all existing tokens by adding current token to blacklist
  if (req.token) {
    await cacheSet(`token_blacklist:${req.token}`, true, 3600 * 24 * 7); // 7 days
  }
  
  // Send password changed notification email
  await sendEmail({
    to: user.email,
    subject: 'Password Changed Successfully',
    template: 'password-changed',
    data: {
      firstName: user.firstName,
    },
  });
  
  sendSuccess(res, null, 'Password changed successfully. Please login again with your new password.');
});

/**
 * @desc    Generate TOTP setup
 * @route   GET /api/auth/totp/setup
 * @access  Private
 */
export const setupTOTP = asyncHandler(async (
  req: AuthRequest,
  res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  // Get user
  const user = await User.findById(req.user._id);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Generate TOTP secret
  const { secret, qrCodeUrl } = generateTOTP(user.email);
  
  // Store secret temporarily in Redis with a short TTL
  await cacheSet(`totp_setup:${user._id}`, secret, 600); // 10 minutes
  
  sendSuccess(
    res,
    {
      qrCodeUrl,
      secret,
    },
    'TOTP setup initialized successfully'
  );
});

/**
 * @desc    Verify and enable TOTP
 * @route   POST /api/auth/totp/verify
 * @access  Private
 */
export const verifyAndEnableTOTP = asyncHandler(async (
  req: AuthRequest,
  res: Response): Promise<void> => {
  const { token } = req.body;
  
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  // Get user
  const user = await User.findById(req.user._id);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Get temp secret from Redis
  const redisSecret = await cacheGet(`totp_setup:${user._id}`);
  if (!redisSecret || typeof redisSecret !== 'string') {
    throw new BadRequestError('TOTP setup has expired. Please try again.');
  }
  const tempSecret = redisSecret;
  
  // Verify token against temp secret
  const isValid = verifyTOTP(tempSecret, token);
  
  if (!isValid) {
    throw new BadRequestError('Invalid TOTP token. Please try again.');
  }
  
  // Enable TOTP and save secret
  user.twoFactorEnabled = true;
  user.twoFactorSecret = tempSecret;
  await user.save();
  
  // Delete temp secret from Redis
  await cacheDelete(`totp_setup:${user._id}`);
  
  sendSuccess(res, null, 'Two-factor authentication enabled successfully');
});

/**
 * @desc    Disable TOTP
 * @route   POST /api/auth/totp/disable
 * @access  Private
 */
export const disableTOTP = asyncHandler(async (
  req: AuthRequest,
  res: Response): Promise<void> => {
  const { password } = req.body;
  
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  // Get user with password
  const user = await User.findById(req.user._id).select('+password');
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Verify password
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    throw new BadRequestError('Password is incorrect');
  }
  
  // Disable TOTP
  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  await user.save();
  
  sendSuccess(res, null, 'Two-factor authentication disabled successfully');
});

/**
 * @desc    Verify TOTP during login
 * @route   POST /api/auth/totp/login-verify
 * @access  Public (with token)
 */
export const verifyTOTPLogin = asyncHandler(async (
  req: AuthRequest,
  res: Response): Promise<void> => {
  const { token } = req.body;
  
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  // Get user with 2FA secret
  const user = await User.findById(req.user._id).select('+twoFactorSecret');
  
  if (!user || !user.twoFactorSecret) {
    throw new BadRequestError('Two-factor authentication is not set up');
  }
  
  // Verify token
  const isValid = verifyTOTP(user.twoFactorSecret, token);
  
  if (!isValid) {
    throw new BadRequestError('Invalid TOTP token');
  }
  
  // Store verification status in Redis
  await cacheSet(`totp_verified:${user._id}`, true, 3600); // 1 hour TTL
  
  // Create response payload
  const userResponse = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    verified: user.verified,
  };
  
  sendSuccess(
    res,
    { user: userResponse },
    'Two-factor authentication verified successfully'
  );
});

/**
 * @desc    Check authentication status
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (
  req: AuthRequest,
  res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const user = {
    id: req.user._id,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    email: req.user.email,
    role: req.user.role,
    verified: req.user.verified,
    company: req.user.company,
    position: req.user.position,
    bio: req.user.bio,
    avatar: req.user.avatar,
    lastLogin: req.user.lastLogin,
    skills: req.user.skills,
    createdAt: req.user.createdAt,
  };
  
  sendSuccess(res, { user }, 'User retrieved successfully');
});

export default {
  register,
  login,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  setupTOTP,
  verifyAndEnableTOTP,
  disableTOTP,
  verifyTOTPLogin,
  getMe,
};