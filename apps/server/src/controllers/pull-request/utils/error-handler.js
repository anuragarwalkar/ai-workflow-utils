import logger from '../../../logger.js';

/**
 * Error handling utility for PR operations
 */
class ErrorHandler {
  static handleApiError(error, context, res) {
    logger.error(`Error in ${context}:`, error);

    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: `Failed to ${context}: ${error.response.statusText}`,
        details: error.response.data,
      });
    }

    return res.status(500).json({
      success: false,
      error: `Internal server error while ${context}`,
      message: error.message,
    });
  }

  static handleValidationError(message, res) {
    return res.status(400).json({
      success: false,
      error: message,
    });
  }
}

export default ErrorHandler;
