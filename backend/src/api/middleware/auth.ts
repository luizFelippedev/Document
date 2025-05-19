import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../../core/error';
import User, { IUser } from '../models/user.model';
import { cacheGet, cacheSet } from '../../config/redis';
import logger from '../../config/logger';

// Extended Request interface to include user property
export interface AuthRequest extends Request {
  user?: IUser;
  token?: string;
}

/**
 * Middleware to protect routes requiring authentication
 */
export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication required. Please log in.');
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Invalid token format.');
    }
    
    // Check token blacklist (for logged out tokens)
    const isBlacklisted = await cacheGet<boolean>(`token_blacklist:${token}`);
    if (isBlacklisted) {
      throw new UnauthorizedError('Token is no longer valid. Please log in again.');
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    if (!decoded) {
      throw new UnauthorizedError('Invalid or expired token.');
    }
    
    // Try to get user from cache first
    const cachedUser = await cacheGet<IUser>(`user:${decoded.id}`);
    let user;
    
    if (cachedUser) {
      user = cachedUser;
    } else {
      // Get user from database
      user = await User.findById(decoded.id);
      
      if (!user) {
        throw new UnauthorizedError('User not found.');
      }
      
      // Cache user for future requests (10 minutes)
      await cacheSet(`user:${user._id}`, user, 600);
    }
    
    // Check if user is active
    if (!user.active) {
      throw new UnauthorizedError('Your account has been deactivated.');
    }
    
    // Add user and token to request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Invalid or expired token. Please log in again.'));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware to restrict routes to specific roles
 * @param roles Array of allowed roles
 */
export const authorize = (roles: string[] = []) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('User not authenticated');
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Access denied. Required role: ${roles.join(' or ')}.`
      );
    }
    
    next();
  };
};

/**
 * Middleware to check if email is verified
 */
export const requireVerifiedEmail = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  if (!req.user.verified) {
    throw new ForbiddenError(
      'Email verification required. Please verify your email address before proceeding.'
    );
  }
  
  next();
};

/**
 * Middleware to check if two-factor authentication is required
 */
export const requireTwoFactor = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User not authenticated');
    }
    
    if (req.user.twoFactorEnabled) {
      // Check if 2FA has been verified in Redis
      const twoFaVerified = await cacheGet<boolean>(`totp_verified:${req.user._id}`);
      
      if (!twoFaVerified) {
        throw new ForbiddenError(
          'Two-factor authentication required.'
        );
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to refresh token if it's about to expire
 */
export const refreshToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !req.token) {
    next();
    return;
  }
  
  try {
    // Decode token to check expiration
    const decoded = jwt.decode(req.token) as any;
    if (!decoded) {
      next();
      return;
    }
    
    // Check if token is about to expire (less than 1 day remaining)
    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeRemaining = expirationTime - currentTime;
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    if (timeRemaining < oneDayInMs) {
      // Generate new token
      const newToken = req.user.generateAuthToken();
      
      // Add header to response with new token
      res.setHeader('X-New-Token', newToken);
    }
  } catch (error) {
    // Log error but don't interrupt request flow
    logger.error(`Token refresh error: ${error}`);
  }
  
  next();
};

/**
 * Optional authentication middleware
 * Authenticates user if token is present, but doesn't require it
 */
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token, continue without authentication
      next();
      return;
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      // Invalid token format, continue without authentication
      next();
      return;
    }
    
    // Check token blacklist
    const isBlacklisted = await cacheGet<boolean>(`token_blacklist:${token}`);
    if (isBlacklisted) {
      // Blacklisted token, continue without authentication
      next();
      return;
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    if (!decoded) {
      // Invalid token, continue without authentication
      next();
      return;
    }
    
    // Get user from database
    const user = await User.findById(decoded.id);
    
    if (user && user.active) {
      // Add user and token to request
      req.user = user;
      req.token = token;
    }
    
    next();
  } catch (error) {
    // Any token error, just continue without authentication
    next();
  }
};

export default {
  authenticate,
  authorize,
  requireVerifiedEmail,
  requireTwoFactor,
  refreshToken,
  optionalAuth,
};