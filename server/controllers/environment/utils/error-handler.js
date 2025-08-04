import logger from '../../../logger.js';

/**
 * Error Handler for Environment Controller
 * Centralizes error handling logic for environment-related operations
 */
export class ErrorHandler {
  /**
   * Handle API errors with consistent format
   * @param {Error} error - The error object
   * @param {string} context - Context where the error occurred
   * @param {Object} res - Express response object
   */
  static handleApiError(error, context, res) {
    logger.error(`Error ${context}:`, error);

    const errorResponse = {
      success: false,
      error: `Failed to ${context}`,
      details: error.message,
    };

    // Determine appropriate status code
    let statusCode = 500;

    if (
      error.message.includes('Invalid configuration') ||
      error.message.includes('validation')
    ) {
      statusCode = 400;
    } else if (error.message.includes('not found')) {
      statusCode = 404;
    } else if (
      error.message.includes('unauthorized') ||
      error.message.includes('authentication')
    ) {
      statusCode = 401;
    }

    res.status(statusCode).json(errorResponse);
  }

  /**
   * Handle validation errors
   * @param {Array} validationErrors - Array of validation error messages
   * @param {Object} res - Express response object
   */
  static handleValidationError(validationErrors, res) {
    logger.error('Validation errors:', validationErrors);

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationErrors,
    });
  }

  /**
   * Create a standardized error object
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} details - Additional error details
   * @returns {Error} Standardized error object
   */
  static createError(message, code = 'ENVIRONMENT_ERROR', details = {}) {
    const error = new Error(message);
    error.code = code;
    error.details = details;
    return error;
  }
}
