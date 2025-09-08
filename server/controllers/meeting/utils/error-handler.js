import logger from '../../../logger.js';

/**
 * Error Handler - Centralized error handling for meeting operations
 * Follows the same pattern as other error handlers in the project
 */
export class ErrorHandler {
  /**
   * Handle API errors and send appropriate response
   * @param {Error} error - Error object
   * @param {string} operation - Operation name for logging
   * @param {Object} res - Express response object
   */
  static handleApiError(error, operation, res) {
    logger.error(`[ERROR_HANDLER] [${operation}] Error:`, {
      message: error.message,
      stack: error.stack,
      operation,
    });

    // Determine error status code
    let statusCode = 500;
    let errorType = 'INTERNAL_SERVER_ERROR';

    if (error.message.includes('not found')) {
      statusCode = 404;
      errorType = 'NOT_FOUND';
    } else if (error.message.includes('unauthorized') || error.message.includes('forbidden')) {
      statusCode = 403;
      errorType = 'FORBIDDEN';
    } else if (error.message.includes('invalid') || error.message.includes('validation')) {
      statusCode = 400;
      errorType = 'BAD_REQUEST';
    } else if (error.message.includes('timeout')) {
      statusCode = 408;
      errorType = 'REQUEST_TIMEOUT';
    } else if (error.message.includes('rate limit')) {
      statusCode = 429;
      errorType = 'TOO_MANY_REQUESTS';
    }

    const errorResponse = {
      success: false,
      error: {
        type: errorType,
        message: error.message,
        operation,
        timestamp: new Date().toISOString(),
      },
    };

    // Don't include stack trace in production
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.error.stack = error.stack;
    }

    res.status(statusCode).json(errorResponse);
  }

  /**
   * Handle streaming errors
   * @param {Error} error - Error object
   * @param {string} operation - Operation name for logging
   * @param {Object} res - Express response object
   */
  static handleStreamingError(error, operation, res) {
    logger.error(`[ERROR_HANDLER] [${operation}] Streaming error:`, {
      message: error.message,
      operation,
    });

    try {
      const errorData = {
        type: 'error',
        error: error.message,
        operation,
        timestamp: new Date().toISOString(),
      };

      res.write(`data: ${JSON.stringify(errorData)}\n\n`);
      res.end();
    } catch (writeError) {
      logger.error(`[ERROR_HANDLER] [${operation}] Failed to write streaming error:`, writeError);
      res.end();
    }
  }

  /**
   * Validate required fields in request body
   * @param {Object} body - Request body
   * @param {Array} requiredFields - Array of required field names
   * @throws {Error} If validation fails
   */
  static validateRequiredFields(body, requiredFields) {
    const missingFields = requiredFields.filter(field => {
      return body[field] === undefined || body[field] === null || body[field] === '';
    });

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Validate file path
   * @param {string} filePath - File path to validate
   * @throws {Error} If validation fails
   */
  static validateFilePath(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('Invalid file path provided');
    }

    if (filePath.includes('..') || filePath.includes('~')) {
      throw new Error('Invalid file path: path traversal not allowed');
    }
  }

  /**
   * Validate meeting ID format
   * @param {string} meetingId - Meeting ID to validate
   * @throws {Error} If validation fails
   */
  static validateMeetingId(meetingId) {
    if (!meetingId || typeof meetingId !== 'string') {
      throw new Error('Invalid meeting ID provided');
    }

    if (!meetingId.startsWith('meeting_')) {
      throw new Error('Invalid meeting ID format');
    }
  }

  /**
   * Create operational error with context
   * @param {string} message - Error message
   * @param {string} operation - Operation name
   * @param {Object} context - Additional context
   * @returns {Error} Enhanced error object
   */
  static createOperationalError(message, operation, context = {}) {
    const error = new Error(message);
    error.operation = operation;
    error.context = context;
    error.timestamp = new Date().toISOString();
    error.isOperational = true;
    return error;
  }
}
