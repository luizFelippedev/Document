import { Request, Response } from 'express';

/**
 * Mock Express Request object
 * @param options Optional properties to add to the mock request
 * @returns Mocked Express Request object
 */
export const mockRequest = (options: Partial<Request> = {}): Partial<Request> => {
  const req: Partial<Request> = {
    body: {},
    params: {},
    query: {},
    headers: {},
    cookies: {},
    get: jest.fn().mockImplementation((key) => {
      if (key === 'host') return 'localhost';
      return null;
    }),
    protocol: 'http',
    ...options
  };
  
  return req;
};

/**
 * Mock Express Response object
 * @returns Mocked Express Response object with common methods
 */
export const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
    download: jest.fn().mockImplementation((path, filename, callback) => {
      if (callback) callback(null);
      return res;
    }),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    attachment: jest.fn().mockReturnThis(),
    locals: {},
    headersSent: false,
    app: {} as any,
    req: {} as any,
  };
  
  return res;
};

export default {
  mockRequest,
  mockResponse
};