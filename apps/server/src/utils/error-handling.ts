import { Request, Response, NextFunction } from 'express';
import logger from '../logger.ts';

export const withErrorHandling = <T extends (...args: any[]) => any>(fn: T, context: string) => {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error: any) {
      logger.error(`Error in ${context}:`, {
        error: error.message,
        stack: error.stack,
        args: args.slice(0, 2),
      });

      throw error;
    }
  };
};

export const withExpressErrorHandling = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
  context: string
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await fn(req, res, next);
    } catch (error: any) {
      logger.error(`Express handler error in ${context}:`, {
        error: error.message,
        method: req.method,
        url: req.url,
        body: req.body,
      });

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: error.message || 'Internal server error',
        });
      }
    }
  };
};

export interface SafeResult<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export const withSafeExecution = <T extends (...args: any[]) => any>(fn: T, context: string) => {
  return async (...args: Parameters<T>): Promise<SafeResult<Awaited<ReturnType<T>>>> => {
    try {
      const data = await fn(...args);
      return { success: true, data, error: null };
    } catch (error: any) {
      logger.error(`Safe execution error in ${context}:`, {
        error: error.message,
        args: args.slice(0, 2),
      });

      return {
        success: false,
        data: null,
        error: error.message || 'Unknown error occurred',
      };
    }
  };
};
