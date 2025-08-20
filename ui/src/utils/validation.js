/**
 * Validation utilities for forms and data
 */

import { createLogger } from './log.js';

const logger = createLogger('ValidationUtils');

/**
 * Validate that a string is not empty
 * @param {string} value - Value to validate
 * @param {string} fieldName - Name of the field being validated
 * @returns {object} Validation result
 */
export const validateRequired = (value, fieldName) => {
  const isValid = Boolean(value && value.trim().length > 0);
  
  if (!isValid) {
    logger.debug('validateRequired', `Validation failed for ${fieldName}`, { value, fieldName });
  }
  
  return {
    isValid,
    message: isValid ? '' : `${fieldName} is required`,
  };
};

/**
 * Validate multiple required fields
 * @param {object} fields - Object with field values
 * @param {string[]} requiredFields - Array of required field names
 * @returns {object} Validation result
 */
export const validateRequiredFields = (fields, requiredFields) => {
  logger.debug('validateRequiredFields', 'Validating multiple fields', { fields, requiredFields });
  
  const errors = {};
  let isValid = true;

  requiredFields.forEach(fieldName => {
    const result = validateRequired(fields[fieldName], fieldName);
    if (!result.isValid) {
      errors[fieldName] = result.message;
      isValid = false;
    }
  });

  return {
    isValid,
    errors,
  };
};

/**
 * Validate a form object with required fields
 * @param {object} formData - Form data to validate
 * @param {string[]} requiredFields - Array of required field names
 * @returns {object} Validation result
 */
export const validateForm = (formData, requiredFields) => {
  logger.debug('validateForm', 'Validating form data', { formData, requiredFields });
  
  if (!formData || typeof formData !== 'object') {
    return {
      isValid: false,
      errors: { form: 'Invalid form data' },
    };
  }

  return validateRequiredFields(formData, requiredFields);
};

/**
 * Check if a value is a non-empty string
 * @param {any} value - Value to check
 * @returns {boolean} Whether value is a non-empty string
 */
export const isNonEmptyString = (value) => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Validate email format (basic validation)
 * @param {string} email - Email to validate
 * @returns {object} Validation result
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  
  return {
    isValid,
    message: isValid ? '' : 'Invalid email format',
  };
};

/**
 * Validate URL format (basic validation)
 * @param {string} url - URL to validate
 * @returns {object} Validation result
 */
export const validateUrl = (url) => {
  try {
    new URL(url);
    return {
      isValid: true,
      message: '',
    };
  } catch {
    return {
      isValid: false,
      message: 'Invalid URL format',
    };
  }
};
