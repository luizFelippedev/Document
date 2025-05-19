import { Request, Response } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import authController from '../../src/api/controllers/auth.controller';
import User from '../../src/api/models/user.model';
import { mockRequest, mockResponse } from '../utils/express-mocks';
import * as redisConfig from '../../src/config/redis';

// Add the following import for jest types
import 'jest';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock dependencies
jest.mock('../../src/api/models/user.model');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../src/utils/email');
jest.mock('../../src/config/redis');

describe('Auth Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        termsAccepted: true
      };

      req.body = userData;

      // Mock User.findOne to return null (user doesn't exist)
      (User.findOne as jest.Mock).mockResolvedValue(null);

      // Mock User.create to return a user with the specified data
      const mockedUser = {
        _id: new mongoose.Types.ObjectId(),
        ...userData,
        generateVerificationToken: jest.fn().mockReturnValue('verification-token'),
        generateAuthToken: jest.fn().mockReturnValue('auth-token'),
        save: jest.fn().mockResolvedValue(null)
      };
      ((User.create as unknown) as jest.Mock<any>).mockResolvedValue(mockedUser);

      // Act
      await authController.register(req as Request, res as Response, next);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password
      }));
      expect(mockedUser.generateVerificationToken).toHaveBeenCalled();
      expect(mockedUser.save).toHaveBeenCalled();
      expect(mockedUser.generateAuthToken).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        message: expect.any(String),
        data: expect.objectContaining({
          user: expect.any(Object),
          token: 'auth-token'
        })
      }));
    });

    it('should return error if user already exists', async () => {
      // Arrange
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        termsAccepted: true
      };

      req.body = userData;

      // Mock User.findOne to return an existing user
      ((User.findOne as unknown) as jest.Mock<any>).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        email: userData.email
      });

      // Act
      await expect(
        authController.register(req as Request, res as Response, next)
      ).rejects.toThrow('User with this email already exists');

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      // Arrange
      const loginData = {
        email: 'user@example.com',
        password: 'Password123!'
      };

      req.body = loginData;

      // Mock User.findOne to return a user
      const mockedUser = {
        _id: new mongoose.Types.ObjectId(),
        firstName: 'John',
        lastName: 'Doe',
        email: loginData.email,
        password: 'hashed_password',
        role: 'user',
        verified: true,
        active: true,
        twoFactorEnabled: false,
        comparePassword: jest.fn().mockResolvedValue(true),
        incrementLoginAttempts: jest.fn().mockResolvedValue(null),
        isLocked: jest.fn().mockReturnValue(false),
        save: jest.fn().mockResolvedValue(null),
        loginAttempts: 0,
        lastLogin: null
      };
      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockedUser)
      });

      // Mock jwt.sign to return a token
      (jwt.sign as jest.Mock).mockReturnValue('auth-token');

      // Act
      await authController.login(req as Request, res as Response, next);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(mockedUser.comparePassword).toHaveBeenCalledWith(loginData.password);
      expect(mockedUser.save).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        message: expect.any(String),
        data: expect.objectContaining({
          user: expect.any(Object),
          token: 'auth-token'
        })
      }));
    });

    it('should return error for invalid credentials', async () => {
      // Arrange
      const loginData = {
        email: 'user@example.com',
        password: 'WrongPassword123!'
      };

      req.body = loginData;

      // Mock User.findOne to return a user
      const mockedUser = {
        _id: new mongoose.Types.ObjectId(),
        email: loginData.email,
        password: 'hashed_password',
        comparePassword: jest.fn().mockResolvedValue(false),
        incrementLoginAttempts: jest.fn().mockResolvedValue(null),
        isLocked: jest.fn().mockReturnValue(false),
      };
      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockedUser)
      });

      // Act
      await expect(
        authController.login(req as Request, res as Response, next)
      ).rejects.toThrow('Invalid email or password');

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(mockedUser.comparePassword).toHaveBeenCalledWith(loginData.password);
      expect(mockedUser.incrementLoginAttempts).toHaveBeenCalled();
    });

    it('should handle account lockout after multiple failed attempts', async () => {
      // Arrange
      const loginData = {
        email: 'user@example.com',
        password: 'WrongPassword123!'
      };

      req.body = loginData;

      // Mock User.findOne to return a user with lockout
      const mockedUser = {
        _id: new mongoose.Types.ObjectId(),
        email: loginData.email,
        password: 'hashed_password',
        isLocked: jest.fn().mockReturnValue(true),
      };
      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockedUser)
      });

      // Act
      await expect(
        authController.login(req as Request, res as Response, next)
      ).rejects.toThrow('Account is temporarily locked due to too many failed login attempts');

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(mockedUser.isLocked).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      // Arrange
      req.user = {
        _id: new mongoose.Types.ObjectId(),
        email: 'user@example.com'
      };
      req.token = 'auth-token';
      
      // Mock JWT decode
      (jwt.decode as jest.Mock).mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      });
      
      // Mock Redis
      (redisConfig.cacheSet as jest.Mock).mockResolvedValue(true);

      // Mock session destroy if using sessions
      req.session = {
        destroy: jest.fn((callback) => callback(null))
      };

      // Act
      await authController.logout(req as Request, res as Response, next);

      // Assert
      expect(jwt.decode).toHaveBeenCalledWith('auth-token');
      expect(redisConfig.cacheSet).toHaveBeenCalledWith(
        'token_blacklist:auth-token',
        true,
        expect.any(Number)
      );
      expect(req.session.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});