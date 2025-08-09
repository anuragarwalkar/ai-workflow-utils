import logger from '../../../logger.js';

/**
 * ErrorHandler - Utility for handling errors in email operations
 */
class ErrorHandler {
  /**
   * Handles API errors and sends appropriate response
   * @param {Error} error - The error that occurred
   * @param {string} context - Context where the error occurred
   * @param {Object} res - Express response object
   */
  static handleApiError(error, context, res) {
    const timestamp = new Date().toISOString();
    const errorId = this._generateErrorId();

    // Log the error with context
    logger.error(`Email ${context} error`, {
      errorId,
      message: error.message,
      stack: error.stack,
      context,
      timestamp,
    });

    // Determine error type and response
    const errorResponse = this._buildErrorResponse(error, errorId, context);

    res.status(errorResponse.status).json({
      success: false,
      error: errorResponse.message,
      errorId,
      timestamp,
    });
  }

  /**
   * Handles validation errors specifically
   * @param {Error} error - Validation error
   * @param {Object} res - Express response object
   */
  static handleValidationError(error, res) {
    logger.warn('Email validation error', {
      message: error.message,
    });

    res.status(400).json({
      success: false,
      error: error.message,
      type: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handles service unavailable errors (external API failures)
   * @param {Error} error - Service error
   * @param {string} service - Name of the service
   * @param {Object} res - Express response object
   */
  static handleServiceError(error, service, res) {
    const errorId = this._generateErrorId();

    logger.error(`${service} service error`, {
      errorId,
      message: error.message,
      service,
    });

    res.status(503).json({
      success: false,
      error: `${service} service is currently unavailable. Please try again later.`,
      errorId,
      service,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Builds appropriate error response based on error type
   * @private
   * @param {Error} error - The error object
   * @param {string} errorId - Generated error ID
   * @param {string} context - Error context
   * @returns {Object} Error response object
   */
  static _buildErrorResponse(error, errorId, context) {
    // Check for specific error types
    if (error.message.includes('Missing required fields')) {
      return {
        status: 400,
        message: error.message,
      };
    }

    if (error.message.includes('Invalid') && error.message.includes('format')) {
      return {
        status: 400,
        message: error.message,
      };
    }

    if (
      error.message.includes('not found') ||
      error.message.includes('Not found')
    ) {
      return {
        status: 404,
        message: `Resource not found during ${context}`,
      };
    }

    if (
      error.message.includes('fetch failed') ||
      error.message.includes('ENOTFOUND')
    ) {
      return {
        status: 503,
        message: `External service unavailable during ${context}`,
      };
    }

    if (
      error.message.includes('Unauthorized') ||
      error.message.includes('401')
    ) {
      return {
        status: 401,
        message: 'Authentication failed. Please check your credentials.',
      };
    }

    if (error.message.includes('Forbidden') || error.message.includes('403')) {
      return {
        status: 403,
        message: 'Access denied. Insufficient permissions.',
      };
    }

    // Default to internal server error
    return {
      status: 500,
      message: `An unexpected error occurred during ${context}. Please contact support with error ID: ${errorId}`,
    };
  }

  /**
   * Generates a unique error ID for tracking
   * @private
   * @returns {string} Unique error identifier
   */
  static _generateErrorId() {
    return `EMAIL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Wraps async functions with error handling
   * @param {Function} fn - Async function to wrap
   * @returns {Function} Wrapped function
   */
  static asyncWrapper(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(error => {
        this.handleApiError(error, 'async operation', res);
      });
    };
  }

  /**
   * Creates a safe error message for client consumption
   * @param {Error} error - Original error
   * @param {string} defaultMessage - Default message if error is sensitive
   * @returns {string} Safe error message
   */
  static createSafeErrorMessage(error, defaultMessage = 'An error occurred') {
    // Don't expose sensitive information in production
    if (process.env.NODE_ENV === 'production') {
      // Only expose validation and user-facing errors
      if (
        error.message.includes('Invalid') ||
        error.message.includes('Missing') ||
        error.message.includes('not found')
      ) {
        return error.message;
      }
      return defaultMessage;
    }

    // In development, show full error details
    return error.message;
  }
}

export { ErrorHandler };
