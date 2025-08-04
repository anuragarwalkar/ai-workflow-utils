import path from 'path';
import { createLogger, format, transports } from 'winston';
import fs from 'fs';

// Use project root for consistent path resolution
const projectRoot = process.cwd();
const logsDir = path.join(projectRoot, 'logs');
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (error) {
  console.warn('Warning: Could not create logs directory:', error.message);
}

// Helper function to format additional arguments
const formatArgs = (args, pretty = false) => {
  if (!args || !Array.isArray(args) || args.length === 0) {
    return '';
  }

  return args
    .map(arg => {
      if (
        typeof arg === 'string' ||
        typeof arg === 'number' ||
        typeof arg === 'boolean'
      ) {
        return String(arg);
      } else if (arg instanceof Error) {
        return `Error: ${arg.message}`;
      } else if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, null, pretty ? 2 : 0);
        } catch (e) {
          return '[Circular Object]';
        }
      } else {
        return String(arg);
      }
    })
    .join(' ');
};

// Create console transport with colors
const consoleTransport = new transports.Console({
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.printf(info => {
      const colorizer = format.colorize().colorize;
      let message = info.message;

      // Handle additional arguments from splat
      const additionalArgs = info[Symbol.for('splat')];
      if (additionalArgs && additionalArgs.length > 0) {
        const formattedArgs = formatArgs(additionalArgs, true);
        if (formattedArgs) {
          message = `${message} ${formattedArgs}`;
        }
      }

      return colorizer(
        info.level,
        `${info.timestamp} [${info.level.toUpperCase()}]: ${message}`
      );
    })
  ),
});

// Create file format without colors
const fileFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.printf(info => {
    let message = info.message;

    // Handle additional arguments from splat
    const additionalArgs = info[Symbol.for('splat')];
    if (additionalArgs && additionalArgs.length > 0) {
      const formattedArgs = formatArgs(additionalArgs, false);
      if (formattedArgs) {
        message = `${message} ${formattedArgs}`;
      }
    }

    return `${info.timestamp} [${info.level.toUpperCase()}]: ${message}`;
  })
);

// Determine log level based on environment
const getLogLevel = () => {
  const explicitLevel = process.env.LOG_LEVEL;
  if (explicitLevel) {
    return explicitLevel.toLowerCase();
  }

  // Default level based on NODE_ENV
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Create transports array with fallback
const logTransports = [consoleTransport];

// Try to add file transports, fall back to console-only if there are permission issues
try {
  logTransports.push(
    new transports.File({
      filename: path.join(projectRoot, 'logs/error.log'),
      level: 'error',
      format: fileFormat,
    }),
    new transports.File({
      filename: path.join(projectRoot, 'logs/combined.log'),
      format: fileFormat,
    })
  );
} catch (error) {
  console.warn(
    'Warning: Could not create file transports, using console only:',
    error.message
  );
}

// Create the logger instance
const logger = createLogger({
  level: getLogLevel(),
  format: format.combine(
    format.splat(), // This is crucial for handling multiple arguments
    format.timestamp(),
    format.errors({ stack: true })
  ),
  transports: logTransports,
  // Prevent Winston from exiting on unhandled exceptions in production
  exitOnError: process.env.NODE_ENV !== 'production',
});

// Log the initialization for debugging
const logLevel = getLogLevel();
const nodeEnv = process.env.NODE_ENV || 'development';
const explicitLogLevel = process.env.LOG_LEVEL || 'undefined';
console.log(
  `🔧 Logger initialized with level: ${logLevel.toUpperCase()} (NODE_ENV: ${nodeEnv}, LOG_LEVEL: ${explicitLogLevel})`
);

export default logger;
