import logger from '../logger.js';

/**
 * Higher-order function that wraps a function with logging
 * @param {Function} fn - The function to wrap
 * @param {string} operation - Operation name for logging
 * @returns {Function} Wrapped function with logging
 */
export const withLogging = (fn, operation) => {
  return async (...args) => {
    const startTime = Date.now();

    logger.info(`Starting ${operation}`, {
      args: args.slice(0, 2), // Log first 2 args
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
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(`Failed ${operation}`, {
        duration: `${duration}ms`,
        error: error.message,
      });

      throw error;
    }
  };
};

/**
 * Higher-order function that wraps a function with performance logging
 * @param {Function} fn - The function to wrap
 * @param {string} operation - Operation name for logging
 * @param {number} threshold - Performance threshold in ms (default: 1000)
 * @returns {Function} Wrapped function with performance logging
 */
export const withPerformanceLogging = (fn, operation, threshold = 1000) => {
  return async (...args) => {
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
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(`Operation failed: ${operation}`, {
        duration: `${duration}ms`,
        error: error.message,
      });

      throw error;
    }
  };
};

/**
 * Higher-order function that wraps Express handlers with request logging
 * @param {Function} fn - The Express handler function to wrap
 * @param {string} operation - Operation name for logging
 * @returns {Function} Wrapped Express handler with request logging
 */
export const withRequestLogging = (fn, operation) => {
  return async (req, res, next) => {
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
    } catch (error) {
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
