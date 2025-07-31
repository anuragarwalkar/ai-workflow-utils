/**
 * Error Handler - Centralized error handling for logs operations
 */
class ErrorHandler {
  /**
   * Handle API errors consistently
   * @param {Error} error - The error object
   * @param {string} context - Context where error occurred
   * @param {Object} res - Express response object
   */
  static handleApiError(error, context, res) {
    console.error(`Error in ${context}:`, error);
    
    // Determine error type and appropriate response
    const errorResponse = this.buildErrorResponse(error, context);
    
    res.status(errorResponse.status).json({
      success: false,
      error: errorResponse.message,
      context
    });
  }
  
  /**
   * Build error response based on error type
   * @param {Error} error - The error object
   * @param {string} context - Context where error occurred
   * @returns {Object} Error response object
   */
  static buildErrorResponse(error, context) {
    // File system errors
    if (error.code === 'ENOENT') {
      return {
        status: 404,
        message: 'Logs directory or file not found'
      };
    }
    
    if (error.code === 'EACCES') {
      return {
        status: 403,
        message: 'Permission denied accessing logs'
      };
    }
    
    if (error.code === 'EMFILE' || error.code === 'ENFILE') {
      return {
        status: 500,
        message: 'Too many open files, please try again later'
      };
    }
    
    // Validation errors
    if (error.name === 'ValidationError') {
      return {
        status: 400,
        message: error.message
      };
    }
    
    // JSON parsing errors
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return {
        status: 400,
        message: 'Invalid log format detected'
      };
    }
    
    // Memory errors
    if (error.message.includes('out of memory') || error.code === 'ENOMEM') {
      return {
        status: 500,
        message: 'Insufficient memory to process logs'
      };
    }
    
    // Generic server error
    return {
      status: 500,
      message: `Failed to ${context.replace(/([A-Z])/g, ' $1').toLowerCase()}`
    };
  }
  
  /**
   * Log error with context
   * @param {Error} error - The error object
   * @param {string} context - Context where error occurred
   * @param {Object} additionalInfo - Additional information
   */
  static logError(error, context, additionalInfo = {}) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      ...additionalInfo
    };
    
    console.error('Logs Controller Error:', JSON.stringify(errorInfo, null, 2));
  }
  
  /**
   * Create a validation error
   * @param {string} message - Error message
   * @returns {Error} Validation error
   */
  static createValidationError(message) {
    const error = new Error(message);
    error.name = 'ValidationError';
    return error;
  }
  
  /**
   * Create a file system error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @returns {Error} File system error
   */
  static createFileSystemError(message, code) {
    const error = new Error(message);
    error.code = code;
    return error;
  }
  
  /**
   * Safely execute an async operation with error handling
   * @param {Function} operation - Async operation to execute
   * @param {string} context - Context for error handling
   * @param {*} defaultValue - Default value to return on error
   * @returns {*} Operation result or default value
   */
  static async safeExecute(operation, context, defaultValue = null) {
    try {
      return await operation();
    } catch (error) {
      this.logError(error, context);
      return defaultValue;
    }
  }
}

export { ErrorHandler };
export default ErrorHandler;
