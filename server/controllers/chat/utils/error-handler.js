import logger from '../../../logger.js';
import { ChatConstants } from './chat-config.js';

/**
 * Error Handler Utility - Centralized error handling for chat operations
 * Follows error handling pattern with context-aware error processing
 */
export class ErrorHandler {
  /**
   * Handle API errors with context and appropriate HTTP responses
   * @param {Error} error - The error object to handle
   * @param {string} context - Context where the error occurred
   * @param {Object} res - Express response object
   */
  static handleApiError(error, context, res) {
    logger.error(`Error in ${context}:`, error);

    // Determine error type and appropriate response
    const errorInfo = this._categorizeError(error);

    res.status(errorInfo.statusCode).json({
      success: false,
      error: errorInfo.message,
      context,
      type: errorInfo.type,
    });
  }

  /**
   * Handle streaming errors for Server-Sent Events
   * @param {Error} error - The error object to handle
   * @param {string} context - Context where the error occurred
   * @param {Object} res - Express response object for streaming
   */
  static handleStreamingError(error, context, res) {
    logger.error(`Streaming error in ${context}:`, error);

    const errorInfo = this._categorizeError(error);

    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        error: errorInfo.message,
        context,
        errorType: errorInfo.type,
      })}\n\n`,
    );
  }

  /**
   * Categorize error and determine appropriate response
   * @private
   * @param {Error} error - Error to categorize
   * @returns {Object} Error information with status code, message, and type
   */
  static _categorizeError(error) {
    const message = error.message || 'An unexpected error occurred';

    // Rate limiting errors
    if (message.includes('429') || message.includes('Rate Limited')) {
      return {
        statusCode: 429,
        message: 'API rate limit exceeded. Please try again later.',
        type: ChatConstants.ERROR_TYPES.RATE_LIMIT,
      };
    }

    // Authentication errors
    if (
      message.includes('401') ||
      message.includes('Unauthorized') ||
      message.includes('Invalid API key')
    ) {
      return {
        statusCode: 401,
        message: 'Invalid API key configuration.',
        type: ChatConstants.ERROR_TYPES.AUTH,
      };
    }

    // Validation errors
    if (
      message.includes('required') ||
      message.includes('validation') ||
      message.includes('Invalid')
    ) {
      return {
        statusCode: 400,
        message,
        type: ChatConstants.ERROR_TYPES.VALIDATION,
      };
    }

    // Network errors
    if (
      message.includes('Network error') ||
      message.includes('Unable to reach') ||
      message.includes('timeout')
    ) {
      return {
        statusCode: 503,
        message: 'Service temporarily unavailable. Please try again later.',
        type: ChatConstants.ERROR_TYPES.NETWORK,
      };
    }

    // Provider-specific errors
    if (
      message.includes('API Error') ||
      message.includes('OpenAI') ||
      message.includes('Ollama')
    ) {
      return {
        statusCode: 502,
        message: 'AI service error. Please try again.',
        type: ChatConstants.ERROR_TYPES.PROVIDER,
      };
    }

    // Generic server error
    return {
      statusCode: 500,
      message: 'Failed to process chat message. Please try again.',
      type: 'INTERNAL_ERROR',
    };
  }

  /**
   * Create a standardized error object
   * @param {string} message - Error message
   * @param {string} type - Error type from ChatConstants.ERROR_TYPES
   * @param {number} statusCode - HTTP status code
   * @returns {Error} Standardized error object
   */
  static createError(message, type, statusCode = 500) {
    const error = new Error(message);
    error.type = type;
    error.statusCode = statusCode;
    return error;
  }
}
