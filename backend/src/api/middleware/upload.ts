import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { BadRequestError } from '../../core/error';
import logger from '../../config/logger';
import { AuthRequest } from './auth';

// Valid file types for different upload types
const validFileTypes = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/json',
    'application/zip',
    'application/x-tar',
    'application/x-gzip',
  ],
  avatar: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  project: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/json',
    'application/zip',
    'application/x-tar',
    'application/x-gzip',
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',
  ],
  certificate: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf'],
};

// Maximum file sizes (in bytes)
const maxFileSizes = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  avatar: 2 * 1024 * 1024, // 2MB
  project: 20 * 1024 * 1024, // 20MB
  certificate: 5 * 1024 * 1024, // 5MB
};

// Base upload directory
const baseUploadDir = path.join(process.cwd(), 'uploads');

// Ensure base upload directory exists
if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}

// Create upload directories if they don't exist
Object.keys(validFileTypes).forEach((type) => {
  const dir = path.join(baseUploadDir, type + 's');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Generate a unique filename
 * @param originalName Original filename
 * @returns Unique filename
 */
const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const fileExtension = path.extname(originalName);
  
  return `${timestamp}-${randomString}${fileExtension}`;
};

/**
 * Configure multer storage
 * @param uploadType Type of upload (image, document, avatar, project, certificate)
 * @returns Multer storage configuration
 */
const configureStorage = (uploadType: string): multer.StorageEngine => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadDir = path.join(baseUploadDir, `${uploadType}s`);
      
      // For user avatars
      if (uploadType === 'avatar' && (req as AuthRequest).user?._id) {
        uploadDir = path.join(baseUploadDir, 'users');
      }
      
      // For projects, add user subfolder
      if (uploadType === 'project' && (req as AuthRequest).user?._id) {
        uploadDir = path.join(baseUploadDir, 'projects', (req as AuthRequest).user?._id.toString());
      }
      
      // For certificates, add separate folders for images and files
      if (uploadType === 'certificate') {
        const isImage = validFileTypes.image.includes(file.mimetype);
        uploadDir = path.join(
          baseUploadDir,
          'certificates',
          isImage ? 'images' : 'files'
        );
      }
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      cb(null, generateUniqueFilename(file.originalname));
    },
  });
};

/**
 * Configure file filter
 * @param uploadType Type of upload (image, document, avatar, project, certificate)
 * @returns Multer file filter
 */
const configureFileFilter = (uploadType: string) => {
  return (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = validFileTypes[uploadType as keyof typeof validFileTypes] || [];
    
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new BadRequestError(
        `Invalid file type. Allowed types for ${uploadType}: ${allowedTypes.join(', ')}`
      );
      return cb(error);
    }
    
    cb(null, true);
  };
};

/**
 * Create multer upload middleware
 * @param uploadType Type of upload (image, document, avatar, project, certificate)
 * @param maxCount Maximum number of files (default: 1)
 * @returns Multer middleware
 */
export const createUploadMiddleware = (uploadType: string, maxCount: number = 1) => {
  const maxFileSize = maxFileSizes[uploadType as keyof typeof maxFileSizes] || 5 * 1024 * 1024;
  
  const upload = multer({
    storage: configureStorage(uploadType),
    fileFilter: configureFileFilter(uploadType),
    limits: {
      fileSize: maxFileSize,
    },
  });
  
  return maxCount === 1 ? upload.single(uploadType) : upload.array(uploadType, maxCount);
};

/**
 * Middleware to handle file upload errors
 */
export const handleUploadErrors = (
  err: any,
  _req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    // Multer error
    if (err.code === 'LIMIT_FILE_SIZE') {
      next(new BadRequestError('File size exceeds the allowed limit'));
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      next(new BadRequestError('Unexpected field name'));
    } else {
      next(new BadRequestError(`Upload error: ${err.message}`));
    }
  } else if (err) {
    // Other error
    next(err);
  } else {
    next();
  }
};

/**
 * Delete a file
 * @param filePath File path
 */
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      logger.info(`File deleted: ${fullPath}`);
    }
  } catch (error: any) {
    logger.error(`Error deleting file: ${error.message}`);
  }
};

/**
 * Get file size in human-readable format
 * @param filePath File path
 * @returns File size in human-readable format
 */
export const getFileSize = (filePath: string): string => {
  try {
    const stats = fs.statSync(filePath);
    const fileSizeInBytes = stats.size;
    
    if (fileSizeInBytes < 1024) {
      return `${fileSizeInBytes} B`;
    } else if (fileSizeInBytes < 1024 * 1024) {
      return `${(fileSizeInBytes / 1024).toFixed(2)} KB`;
    } else if (fileSizeInBytes < 1024 * 1024 * 1024) {
      return `${(fileSizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(fileSizeInBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  } catch (error) {
    return 'Unknown size';
  }
};

export default {
  createUploadMiddleware,
  handleUploadErrors,
  deleteFile,
  getFileSize,
};