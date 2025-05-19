import { Request, Response } from 'express';
import mongoose from 'mongoose';
import projectController from '../../src/api/controllers/project.controller';
import Project from '../../src/api/models/project.model';
import User from '../../src/api/models/user.model';
import { mockRequest, mockResponse } from '../utils/express-mocks';
import * as redisConfig from '../../src/config/redis';
import * as uploadMiddleware from '../../src/api/middleware/upload';
import * as notificationService from '../../src/api/services/notification.service';

// Mock dependencies
jest.mock('../../src/api/models/project.model');
jest.mock('../../src/api/models/user.model');
jest.mock('../../src/config/redis');
jest.mock('../../src/api/middleware/upload');
jest.mock('../../src/api/services/notification.service');

describe('Project Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('should create a project successfully', async () => {
      // Arrange
      const userId = new mongoose.Types.ObjectId();
      const projectData = {
        name: 'Test Project',
        description: 'This is a test project',
        category: 'Test Category',
        tags: ['test', 'project'],
        visibility: 'private',
      };

      req.body = projectData;
      req.user = {
        _id: userId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      // Mock Project.create to return a project
      const mockedProject = {
        _id: new mongoose.Types.ObjectId(),
        ...projectData,
        owner: userId,
        collaborators: [],
        files: [],
        metrics: {
          views: 0,
          likes: 0,
          downloads: 0,
          shares: 0,
        },
        lastUpdatedBy: userId,
        save: jest.fn().mockResolvedValue(null),
      };
      (Project.create as jest.Mock).mockResolvedValue(mockedProject);

      // Act
      await projectController.createProject(req as Request, res as Response, next);

      // Assert
      expect(Project.create).toHaveBeenCalledWith(expect.objectContaining({
        name: projectData.name,
        description: projectData.description,
        category: projectData.category,
        owner: userId,
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        message: expect.any(String),
        data: {
          project: mockedProject
        }
      }));
    });

    it('should create a project with file upload', async () => {
      // Arrange
      const userId = new mongoose.Types.ObjectId();
      const projectData = {
        name: 'Test Project',
        description: 'This is a test project',
        category: 'Test Category',
        tags: ['test', 'project'],
        visibility: 'private',
      };

      req.body = projectData;
      req.user = {
        _id: userId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };
      req.file = {
        originalname: 'test-file.jpg',
        path: 'uploads/projects/test-file.jpg',
        size: 1024,
        mimetype: 'image/jpeg',
        filename: 'test-file.jpg',
        destination: 'uploads/projects',
        buffer: Buffer.from('test'),
        encoding: '7bit',
        fieldname: 'project',
      };

      // Mock Project.create to return a project
      const mockedProject = {
        _id: new mongoose.Types.ObjectId(),
        ...projectData,
        owner: userId,
        collaborators: [],
        files: [],
        metrics: {
          views: 0,
          likes: 0,
          downloads: 0,
          shares: 0,
        },
        lastUpdatedBy: userId,
        save: jest.fn().mockResolvedValue(null),
      };
      (Project.create as jest.Mock).mockResolvedValue(mockedProject);

      // Act
      await projectController.createProject(req as Request, res as Response, next);

      // Assert
      expect(Project.create).toHaveBeenCalledWith(expect.objectContaining({
        name: projectData.name,
        description: projectData.description,
        category: projectData.category,
        owner: userId,
      }));
      expect(mockedProject.save).toHaveBeenCalled();
      expect(mockedProject.files.push).toHaveBeenCalledWith(expect.objectContaining({
        name: req.file.originalname,
        path: req.file.path.replace(/\\/g, '/'),
        size: req.file.size,
        type: req.file.mimetype,
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        data: {
          project: mockedProject
        }
      }));
    });

    it('should create a project with collaborators', async () => {
      // Arrange
      const userId = new mongoose.Types.ObjectId();
      const collaboratorId = new mongoose.Types.ObjectId();
      const projectData = {
        name: 'Collaboration Project',
        description: 'This is a test project with collaborators',
        category: 'Test Category',
        tags: ['test', 'project', 'collaboration'],
        visibility: 'team',
        collaborators: [collaboratorId.toString()],
      };

      req.body = projectData;
      req.user = {
        _id: userId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      // Mock User.find to return collaborators
      const mockedCollaborator = {
        _id: collaboratorId,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
      };
      (User.find as jest.Mock).mockResolvedValue([mockedCollaborator]);

      // Mock Project.create to return a project
      const mockedProject = {
        _id: new mongoose.Types.ObjectId(),
        ...projectData,
        owner: userId,
        collaborators: [],
        files: [],
        metrics: {
          views: 0,
          likes: 0,
          downloads: 0,
          shares: 0,
        },
        lastUpdatedBy: userId,
        save: jest.fn().mockResolvedValue(null),
      };
      (Project.create as jest.Mock).mockResolvedValue(mockedProject);

      // Mock notification service
      (notificationService.createNotification as jest.Mock).mockResolvedValue(null);

      // Act
      await projectController.createProject(req as Request, res as Response, next);

      // Assert
      expect(User.find).toHaveBeenCalledWith({
        _id: { $in: [collaboratorId.toString()] },
        active: true,
      });
      expect(notificationService.createNotification).toHaveBeenCalledWith(expect.objectContaining({
        recipient: collaboratorId,
        sender: userId,
        type: 'info',
        title: 'Project Collaboration',
      }));
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getProjects', () => {
    it('should get projects for authenticated user', async () => {
      // Arrange
      const userId = new mongoose.Types.ObjectId();
      req.user = {
        _id: userId,
        role: 'user',
      };
      req.query = {
        page: '1',
        limit: '10',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      // Mock Redis cache miss
      (redisConfig.cacheGet as jest.Mock).mockResolvedValue(null);

      // Mock Project.countDocuments
      (Project.countDocuments as jest.Mock).mockResolvedValue(2);

      // Mock Project.find
      const mockedProjects = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Project 1',
          description: 'Description 1',
          owner: userId,
        },
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Project 2',
          description: 'Description 2',
          owner: userId,
        }
      ];
      
      // Mock the chained methods
      const findMock = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
      };
      findMock.populate.mockReturnValue(mockedProjects);
      
      (Project.find as jest.Mock).mockReturnValue(findMock);

      // Mock Redis cache set
      (redisConfig.cacheSet as jest.Mock).mockResolvedValue(null);

      // Act
      await projectController.getProjects(req as Request, res as Response, next);

      // Assert
      expect(redisConfig.cacheGet).toHaveBeenCalled();
      expect(Project.countDocuments).toHaveBeenCalled();
      expect(Project.find).toHaveBeenCalledWith(expect.objectContaining({
        $or: [
          { owner: userId },
          { collaborators: userId },
          { visibility: 'public' },
        ]
      }));
      expect(findMock.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(findMock.skip).toHaveBeenCalledWith(0);
      expect(findMock.limit).toHaveBeenCalledWith(10);
      expect(redisConfig.cacheSet).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        data: {
          projects: mockedProjects
        }
      }));
    });
  });

  describe('getProjectById', () => {
    it('should get a project by ID', async () => {
      // Arrange
      const userId = new mongoose.Types.ObjectId();
      const projectId = new mongoose.Types.ObjectId();
      req.user = {
        _id: userId,
        role: 'user',
      };
      req.params = {
        id: projectId.toString(),
      };

      // Mock Redis cache miss
      (redisConfig.cacheGet as jest.Mock).mockResolvedValue(null);

      // Mock Project.findById
      const mockedProject = {
        _id: projectId,
        name: 'Project 1',
        description: 'Description 1',
        owner: userId,
        collaborators: [],
        visibility: 'private',
        metrics: {
          views: 0,
        },
        equals: jest.fn().mockImplementation((id) => id.toString() === userId.toString()),
        save: jest.fn().mockResolvedValue(null),
      };
      
      // Mock the chained methods
      const findByIdMock = {
        populate: jest.fn().mockReturnThis(),
      };
      findByIdMock.populate.mockReturnValue(mockedProject);
      
      (Project.findById as jest.Mock).mockReturnValue(findByIdMock);

      // Mock Redis cache set
      (redisConfig.cacheSet as jest.Mock).mockResolvedValue(null);

      // Act
      await projectController.getProjectById(req as Request, res as Response, next);

      // Assert
      expect(redisConfig.cacheGet).toHaveBeenCalled();
      expect(Project.findById).toHaveBeenCalledWith(projectId.toString());
      expect(mockedProject.save).toHaveBeenCalled();
      expect(redisConfig.cacheSet).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        data: {
          project: mockedProject
        }
      }));
    });

    it('should return 404 if project not found', async () => {
      // Arrange
      const userId = new mongoose.Types.ObjectId();
      const projectId = new mongoose.Types.ObjectId();
      req.user = {
        _id: userId,
        role: 'user',
      };
      req.params = {
        id: projectId.toString(),
      };

      // Mock Redis cache miss
      (redisConfig.cacheGet as jest.Mock).mockResolvedValue(null);

      // Mock Project.findById to return null
      const findByIdMock = {
        populate: jest.fn().mockReturnThis(),
      };
      findByIdMock.populate.mockReturnValue(null);
      
      (Project.findById as jest.Mock).mockReturnValue(findByIdMock);

      // Act & Assert
      await expect(
        projectController.getProjectById(req as Request, res as Response, next)
      ).rejects.toThrow('Project not found');
    });

    it('should return 403 if user does not have access to project', async () => {
      // Arrange
      const userId = new mongoose.Types.ObjectId();
      const ownerId = new mongoose.Types.ObjectId();
      const projectId = new mongoose.Types.ObjectId();
      req.user = {
        _id: userId,
        role: 'user',
      };
      req.params = {
        id: projectId.toString(),
      };

      // Mock Redis cache miss
      (redisConfig.cacheGet as jest.Mock).mockResolvedValue(null);

      // Mock Project.findById to return a project user cannot access
      const mockedProject = {
        _id: projectId,
        name: 'Private Project',
        description: 'Description',
        owner: ownerId, // Different owner
        collaborators: [], // No collaborators
        visibility: 'private', // Private project
        equals: jest.fn().mockImplementation((id) => false), // Never equal
        some: jest.fn().mockImplementation((predicate) => false), // No match
      };
      
      // Mock the chained methods
      const findByIdMock = {
        populate: jest.fn().mockReturnThis(),
      };
      findByIdMock.populate.mockReturnValue(mockedProject);
      
      (Project.findById as jest.Mock).mockReturnValue(findByIdMock);

      // Act & Assert
      await expect(
        projectController.getProjectById(req as Request, res as Response, next)
      ).rejects.toThrow('You do not have access to this project');
    });
  });
});