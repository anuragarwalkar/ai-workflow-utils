import logger from '../../../logger.js';
import { TEMPLATE_CONSTANTS } from './constants.js';

/**
 * Error handler for template operations
 */
class TemplateErrorHandler {
  /**
   * Handle API errors and send appropriate response
   * @param {Error} error - Error object
   * @param {string} context - Error context
   * @param {Response} res - Express response object
   */
  static handleApiError(error, context, res) {
    logger.error(`${context}:`, error);

    // Handle specific error types
    const errorResponse = this.categorizeError(error);

    res.status(errorResponse.status).json({
      success: false,
      error: errorResponse.message,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }

  /**
   * Categorize error and return appropriate status and message
   * @private
   * @param {Error} error - Error object
   * @returns {Object} Error response object
   */
  static categorizeError(error) {
    const message = error.message || 'An unknown error occurred';

    // Validation errors
    if (this.isValidationError(message)) {
      return {
        status: TEMPLATE_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
        message,
      };
    }

    // Not found errors
    if (this.isNotFoundError(message)) {
      return {
        status: TEMPLATE_CONSTANTS.HTTP_STATUS.NOT_FOUND,
        message,
      };
    }

    // Permission errors
    if (this.isPermissionError(message)) {
      return {
        status: TEMPLATE_CONSTANTS.HTTP_STATUS.FORBIDDEN,
        message,
      };
    }

    // Default to internal server error
    return {
      status: TEMPLATE_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Internal server error occurred',
    };
  }

  /**
   * Check if error is a validation error
   * @private
   * @param {string} message - Error message
   * @returns {boolean} True if validation error
   */
  static isValidationError(message) {
    const validationKeywords = [
      'Missing required fields',
      'must be',
      'Invalid',
      'can only contain',
      'must be a valid',
      'format',
    ];

    return validationKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if error is a not found error
   * @private
   * @param {string} message - Error message
   * @returns {boolean} True if not found error
   */
  static isNotFoundError(message) {
    const notFoundKeywords = ['not found', 'does not exist', 'No active template'];

    return notFoundKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if error is a permission error
   * @private
   * @param {string} message - Error message
   * @returns {boolean} True if permission error
   */
  static isPermissionError(message) {
    const permissionKeywords = [
      'Cannot modify',
      'Cannot delete',
      'not allowed',
      'permission denied',
      'forbidden',
    ];

    return permissionKeywords.some(keyword =>
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Create a standardized error object
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} details - Additional error details
   * @returns {Error} Standardized error object
   */
  static createError(message, code = 'TEMPLATE_ERROR', details = {}) {
    const error = new Error(message);
    error.code = code;
    error.details = details;
    return error;
  }

  /**
   * Create validation error
   * @param {string} field - Field that failed validation
   * @param {string} reason - Reason for validation failure
   * @returns {Error} Validation error
   */
  static createValidationError(field, reason) {
    return this.createError(
      `Validation failed for field '${field}': ${reason}`,
      'VALIDATION_ERROR',
      { field, reason }
    );
  }

  /**
   * Create not found error
   * @param {string} resource - Resource that was not found
   * @param {string} identifier - Resource identifier
   * @returns {Error} Not found error
   */
  static createNotFoundError(resource, identifier) {
    return this.createError(
      `${resource} with identifier '${identifier}' not found`,
      'NOT_FOUND_ERROR',
      { resource, identifier }
    );
  }

  /**
   * Create permission error
   * @param {string} operation - Operation that was denied
   * @param {string} resource - Resource involved
   * @returns {Error} Permission error
   */
  static createPermissionError(operation, resource) {
    return this.createError(
      `Operation '${operation}' not allowed on ${resource}`,
      'PERMISSION_ERROR',
      { operation, resource }
    );
  }

  /**
   * Log error with context
   * @param {Error} error - Error to log
   * @param {string} context - Context information
   * @param {Object} metadata - Additional metadata
   */
  static logError(error, context, metadata = {}) {
    const logData = {
      context,
      message: error.message,
      code: error.code,
      stack: error.stack,
      ...metadata,
    };

    logger.error('Template error occurred:', logData);
  }

  /**
   * Wrap async function with error handling
   * @param {Function} fn - Async function to wrap
   * @param {string} context - Error context
   * @returns {Function} Wrapped function
   */
  static wrapAsync(fn, context) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.logError(error, context);
        throw error;
      }
    };
  }

  /**
   * Validate and sanitize input
   * @param {Object} input - Input to validate
   * @param {Object} schema - Validation schema
   * @returns {Object} Sanitized input
   * @throws {Error} If validation fails
   */
  static validateInput(input, schema) {
    const sanitized = {};
    const errors = [];

    Object.keys(schema).forEach(key => {
      const rule = schema[key];
      const value = input[key];

      const fieldErrors = this.validateField(key, value, rule);
      if (fieldErrors.length > 0) {
        errors.push(...fieldErrors);
      } else if (value !== undefined && value !== null) {
        sanitized[key] = value;
      }
    });

    if (errors.length > 0) {
      throw this.createValidationError('input', errors.join('; '));
    }

    return sanitized;
  }

  /**
   * Validate a single field
   * @private
   * @param {string} key - Field key
   * @param {*} value - Field value
   * @param {Object} rule - Validation rule
   * @returns {Array} Array of error messages
   */
  static validateField(key, value, rule) {
    const errors = [];

    // Check required fields
    if (rule.required && this.isEmpty(value)) {
      errors.push(`Field '${key}' is required`);
      return errors;
    }

    // Skip validation if field is optional and not provided
    if (!rule.required && this.isEmpty(value)) {
      return errors;
    }

    // Type validation
    if (rule.type && typeof value !== rule.type) {
      errors.push(`Field '${key}' must be of type ${rule.type}`);
      return errors;
    }

    // Length validations
    this.validateLength(key, value, rule, errors);

    // Pattern validation
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      errors.push(`Field '${key}' format is invalid`);
    }

    // Custom validation
    if (rule.validate && typeof rule.validate === 'function') {
      const customError = rule.validate(value);
      if (customError) {
        errors.push(`Field '${key}': ${customError}`);
      }
    }

    return errors;
  }

  /**
   * Check if value is empty
   * @private
   * @param {*} value - Value to check
   * @returns {boolean} True if empty
   */
  static isEmpty(value) {
    return value === undefined || value === null || value === '';
  }

  /**
   * Validate field length
   * @private
   * @param {string} key - Field key
   * @param {*} value - Field value
   * @param {Object} rule - Validation rule
   * @param {Array} errors - Error array to populate
   */
  static validateLength(key, value, rule, errors) {
    if (typeof value !== 'string') return;

    if (rule.maxLength && value.length > rule.maxLength) {
      errors.push(`Field '${key}' must be ${rule.maxLength} characters or less`);
    }

    if (rule.minLength && value.length < rule.minLength) {
      errors.push(`Field '${key}' must be at least ${rule.minLength} characters`);
    }
  }
}

export default TemplateErrorHandler;
