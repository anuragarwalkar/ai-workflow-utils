/**
 * Error handling utilities for Jira operations
 */

import logger from '../../../logger.js';
import { ERROR_MESSAGES } from './constants.js';

/**
 * Handle API errors and send appropriate response
 * @param {Error} error - The error object
 * @param {string} context - Context where error occurred
 * @param {Object} res - Express response object
 */
export const handleApiError = (error, context, res) => {
  logger.error(`${context}: ${error.message}`, {
    stack: error.stack,
    context,
  });

  // Check if response has already been sent
  if (res.headersSent) {
    return;
  }

  let statusCode = 500;
  let message = 'Internal server error';
  let details = error.message;

  // Handle Axios errors
  if (error.response) {
    statusCode = error.response.status;
    message = error.response.data?.message || error.response.statusText;
    details = error.response.data;
  } else if (error.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service unavailable - unable to connect to Jira';
  } else if (error.message.includes('Missing required')) {
    statusCode = 400;
    message = error.message;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    details: process.env.NODE_ENV === 'development' ? details : undefined,
  });
};

/**
 * Handle streaming errors (Server-Sent Events)
 * @param {Error} error - The error object
 * @param {string} context - Context where error occurred
 * @param {Object} res - Express response object
 */
export const handleStreamingError = (error, context, res) => {
  logger.error(`${context}: ${error.message}`, {
    stack: error.stack,
    context,
  });

  if (!res.headersSent) {
    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        error: context,
        details: error.message,
      })}\n\n`
    );
  }
};

/**
 * Validate required fields in request body
 * @param {Object} body - Request body
 * @param {Array<string>} requiredFields - Required field names
 * @throws {Error} If validation fails
 */
export const validateRequiredFields = (body, requiredFields) => {
  const missing = requiredFields.filter(field => {
    const value = body[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    throw new Error(`${ERROR_MESSAGES.MISSING_REQUIRED_FIELDS}: ${missing.join(', ')}`);
  }
};

/**
 * Create validation error
 * @param {string} message - Error message
 * @returns {Error} Validation error
 */
export const createValidationError = message => {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.statusCode = 400;
  return error;
};

/**
 * Create service error
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Error} Service error
 */
export const createServiceError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.name = 'ServiceError';
  error.statusCode = statusCode;
  return error;
};

// Export all functions as default for backward compatibility
export const ErrorHandler = {
  handleApiError,
  handleStreamingError,
  validateRequiredFields,
  createValidationError,
  createServiceError,
};

export default ErrorHandler;
