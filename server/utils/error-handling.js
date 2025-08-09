import logger from '../logger.js';

/**
 * Higher-order function that wraps a function with error handling
 * @param {Function} fn - The function to wrap
 * @param {string} context - Context for error logging
 * @returns {Function} Wrapped function with error handling
 */
export const withErrorHandling = (fn, context) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      logger.error(`Error in ${context}:`, {
        error: error.message,
        stack: error.stack,
        args: args.slice(0, 2), // Log first 2 args for debugging
      });
      
      // Re-throw for Express error handling middleware
      throw error;
    }
  };
};

/**
 * Higher-order function that wraps Express handlers with error handling
 * @param {Function} fn - The Express handler function to wrap
 * @param {string} context - Context for error logging
 * @returns {Function} Wrapped Express handler with error handling
 */
export const withExpressErrorHandling = (fn, context) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
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

/**
 * Higher-order function that wraps a function with try-catch and returns a result object
 * @param {Function} fn - The function to wrap
 * @param {string} context - Context for error logging
 * @returns {Function} Wrapped function that returns {success, data, error}
 */
export const withSafeExecution = (fn, context) => {
  return async (...args) => {
    try {
      const data = await fn(...args);
      return { success: true, data, error: null };
    } catch (error) {
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
