import { Request, Response, NextFunction } from 'express';
import logger from '../logger.ts';

export const withLogging = <T extends (...args: any[]) => any>(fn: T, operation: string) => {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const startTime = Date.now();

    logger.info(`Starting ${operation}`, {
      args: args.slice(0, 2),
      timestamp: new Date().toISOString(),
    });

    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;

      logger.info(`Completed ${operation}`, {
        duration: `${duration}ms`,
        success: true,
      });

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      logger.error(`Failed ${operation}`, {
        duration: `${duration}ms`,
        error: error.message,
      });

      throw error;
    }
  };
};

export const withPerformanceLogging = <T extends (...args: any[]) => any>(
  fn: T,
  operation: string,
  threshold = 1000
) => {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const startTime = Date.now();

    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;

      if (duration > threshold) {
        logger.warn(`Slow operation detected: ${operation}`, {
          duration: `${duration}ms`,
          threshold: `${threshold}ms`,
          args: args.slice(0, 2),
        });
      }

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      logger.error(`Operation failed: ${operation}`, {
        duration: `${duration}ms`,
        error: error.message,
      });

      throw error;
    }
  };
};

export const withRequestLogging = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
  operation: string
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info(`Request started: ${operation}`, {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });

    try {
      await fn(req, res, next);
      const duration = Date.now() - startTime;

      logger.info(`Request completed: ${operation}`, {
        requestId,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;

      logger.error(`Request failed: ${operation}`, {
        requestId,
        duration: `${duration}ms`,
        error: error.message,
      });

      throw error;
    }
  };
};
