import winston from 'winston';
import 'winston-daily-rotate-file';
import fs from 'fs';
import path from 'path';

// Ensure log directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Create file transports for different log levels
const errorFileTransport = new winston.transports.DailyRotateFile({
  level: 'error',
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: fileFormat,
});

const combinedFileTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: fileFormat,
});

// Configure transports
const transports = [
  new winston.transports.Console({
    format: consoleFormat,
  }),
  errorFileTransport,
  combinedFileTransport,
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logger
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Function to handle uncaught exceptions and unhandled rejections
const handleExceptions = () => {
  // Log uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error(`Uncaught Exception: ${error.message}`, {
      stack: error.stack,
      name: error.name,
    });
    
    // Give logger time to write before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
  
  // Log unhandled rejections
  process.on('unhandledRejection', (reason: Error | any) => {
    logger.error(`Unhandled Rejection: ${reason.message || reason}`, {
      stack: reason.stack,
    });
  });
};

// Initialize exception handling
handleExceptions();

export default logger;