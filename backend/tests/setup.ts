// Setup environment variables for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.APP_NAME = 'Test App';
process.env.EMAIL_FROM = 'test@example.com';
process.env.EMAIL_FROM_NAME = 'Test App';
process.env.OPENAI_API_KEY = 'test-api-key';

// Mock console methods
global.console = {
  ...console,
  // Keep native behavior for other methods
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};