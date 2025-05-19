import { Response } from 'express';

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  status: 'success' | 'fail' | 'error';
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
    [key: string]: any;
  };
  errors?: {
    [key: string]: string | string[];
  };
  links?: {
    self?: string;
    next?: string;
    prev?: string;
    first?: string;
    last?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Send success response
 * @param res Express response object
 * @param data Data to send in response
 * @param message Success message
 * @param statusCode HTTP status code
 * @param meta Metadata for pagination, etc.
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200,
  meta?: ApiResponse['meta'],
  links?: ApiResponse['links']
): Response => {
  const response: ApiResponse<T> = {
    status: 'success',
    message,
    data,
  };
  
  if (meta) {
    response.meta = meta;
  }
  
  if (links) {
    response.links = links;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param res Express response object
 * @param message Error message
 * @param statusCode HTTP status code
 * @param errors Validation errors
 */
export const sendError = (
  res: Response,
  message: string = 'Error',
  statusCode: number = 400,
  errors?: ApiResponse['errors']
): Response => {
  const response: ApiResponse = {
    status: statusCode >= 500 ? 'error' : 'fail',
    message,
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Generate pagination data for API responses
 * @param totalItems Total number of items
 * @param page Current page number
 * @param limit Items per page
 * @param baseUrl Base URL for pagination links
 */
export const getPaginationData = (
  totalItems: number,
  page: number,
  limit: number,
  baseUrl: string
): { meta: ApiResponse['meta']; links: ApiResponse['links'] } => {
  // Calculate pagination values
  const totalPages = Math.ceil(totalItems / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  // Create meta object
  const meta: ApiResponse['meta'] = {
    page,
    limit,
    total: totalItems,
    totalPages,
    hasNextPage,
    hasPrevPage,
  };
  
  // Create links
  const links: ApiResponse['links'] = {
    self: `${baseUrl}?page=${page}&limit=${limit}`,
  };
  
  if (hasNextPage) {
    links.next = `${baseUrl}?page=${page + 1}&limit=${limit}`;
  }
  
  if (hasPrevPage) {
    links.prev = `${baseUrl}?page=${page - 1}&limit=${limit}`;
  }
  
  links.first = `${baseUrl}?page=1&limit=${limit}`;
  links.last = `${baseUrl}?page=${totalPages}&limit=${limit}`;
  
  return { meta, links };
};

/**
 * Send created response
 * @param res Express response object
 * @param data Data to send in response
 * @param message Success message
 */
export const sendCreated = <T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully'
): Response => {
  return sendSuccess(res, data, message, 201);
};

/**
 * Send no content response
 * @param res Express response object
 */
export const sendNoContent = (res: Response): Response => {
  return res.status(204).send();
};

/**
 * Send not found response
 * @param res Express response object
 * @param message Not found message
 */
export const sendNotFound = (
  res: Response,
  message: string = 'Resource not found'
): Response => {
  return sendError(res, message, 404);
};

/**
 * Send unauthorized response
 * @param res Express response object
 * @param message Unauthorized message
 */
export const sendUnauthorized = (
  res: Response,
  message: string = 'Unauthorized'
): Response => {
  return sendError(res, message, 401);
};

/**
 * Send forbidden response
 * @param res Express response object
 * @param message Forbidden message
 */
export const sendForbidden = (
  res: Response,
  message: string = 'Forbidden'
): Response => {
  return sendError(res, message, 403);
};

/**
 * Send validation error response
 * @param res Express response object
 * @param errors Validation errors
 * @param message Validation error message
 */
export const sendValidationError = (
  res: Response,
  errors: ApiResponse['errors'],
  message: string = 'Validation failed'
): Response => {
  return sendError(res, message, 422, errors);
};

export default {
  sendSuccess,
  sendError,
  sendCreated,
  sendNoContent,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendValidationError,
  getPaginationData,
};