import logger from '../logger.js';

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info(`${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    timestamp: new Date().toISOString()
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.url} - ${res.statusCode}`, {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  });

  next();
};

// 404 handler for routes not found
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  // Set default error status if not set
  const status = err.status || err.statusCode || 500;
  
  // Log error
  logger.error('Express error handler:', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    status,
    timestamp: new Date().toISOString()
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  const errorResponse = {
    error: {
      message: status === 500 && !isDevelopment ? 'Internal Server Error' : err.message,
      status,
      timestamp: new Date().toISOString()
    }
  };

  // Include stack trace in development
  if (isDevelopment && err.stack) {
    errorResponse.error.stack = err.stack;
  }

  res.status(status).json(errorResponse);
};

// Async error wrapper to catch async errors in route handlers
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation middleware factory
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      const validationError = new Error(`Validation error: ${error.details[0].message}`);
      validationError.status = 400;
      return next(validationError);
    }
    next();
  };
};

// Rate limiting helper (basic implementation)
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter(time => time > windowStart);
      requests.set(key, userRequests);
    }
    
    const userRequests = requests.get(key) || [];
    
    if (userRequests.length >= max) {
      const error = new Error('Too many requests');
      error.status = 429;
      return next(error);
    }
    
    userRequests.push(now);
    requests.set(key, userRequests);
    
    next();
  };
};

export {
  requestLogger,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  validateBody,
  createRateLimit
};
