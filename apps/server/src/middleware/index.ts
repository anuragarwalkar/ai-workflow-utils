import { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';
import logger from '../logger.ts';

export interface CustomError extends Error {
  status?: number;
  statusCode?: number;
  stack?: string;
}

// Request logging middleware
export const requestLogger: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  // Log request
  logger.info(`${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.socket.remoteAddress,
    timestamp: new Date().toISOString(),
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.url} - ${res.statusCode}`, {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  });

  next();
};

// 404 handler for routes not found
export const notFoundHandler: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error: CustomError = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

// Global error handler
export const errorHandler: ErrorRequestHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const status = err.status || err.statusCode || 500;

  logger.error('Express error handler:', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    status,
    timestamp: new Date().toISOString(),
  });

  const isDevelopment = process.env.NODE_ENV !== 'production';

  const errorResponse: { error: { message: string; status: number; timestamp: string; stack?: string } } = {
    error: {
      message: status === 500 && !isDevelopment ? 'Internal Server Error' : err.message,
      status,
      timestamp: new Date().toISOString(),
    },
  };

  if (isDevelopment && err.stack) {
    errorResponse.error.stack = err.stack;
  }

  res.status(status).json(errorResponse);
};

// Async error wrapper to catch async errors in route handlers
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation middleware factory
export const validateBody = (schema: { validate: (body: any) => { error?: { details: Array<{ message: string }> } } }): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    if (error) {
      const validationError: CustomError = new Error(`Validation error: ${error.details[0].message}`);
      validationError.status = 400;
      return next(validationError);
    }
    next();
  };
};

// Rate limiting helper (basic implementation)
export const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100): RequestHandler => {
  const requests = new Map<string, number[]>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = (req.ip || req.socket.remoteAddress || 'unknown') as string;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (requests.has(key)) {
      const userRequests = (requests.get(key) || []).filter(time => time > windowStart);
      requests.set(key, userRequests);
    }

    const userRequests = requests.get(key) || [];

    if (userRequests.length >= max) {
      const error: CustomError = new Error('Too many requests');
      error.status = 429;
      return next(error);
    }

    userRequests.push(now);
    requests.set(key, userRequests);

    next();
  };
};
