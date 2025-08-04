/**
 * Input validation utilities for Jira operations
 */

import { ISSUE_TYPES, PRIORITY_LEVELS, FILE_UPLOAD } from './constants.js';
import path from 'path';

export class ValidationUtils {
  /**
   * Validate issue creation data
   * @param {Object} data - Issue data
   * @returns {Object} Validation result
   */
  static validateIssueData(data) {
    const errors = [];
    const { summary, description, issueType, priority, projectType } = data;

    // Required fields
    if (
      !summary ||
      typeof summary !== 'string' ||
      summary.trim().length === 0
    ) {
      errors.push('Summary is required and must be a non-empty string');
    }

    if (
      !description ||
      typeof description !== 'string' ||
      description.trim().length === 0
    ) {
      errors.push('Description is required and must be a non-empty string');
    }

    if (!issueType || !Object.values(ISSUE_TYPES).includes(issueType)) {
      errors.push(
        `Issue type must be one of: ${Object.values(ISSUE_TYPES).join(', ')}`
      );
    }

    if (
      !projectType ||
      typeof projectType !== 'string' ||
      projectType.trim().length === 0
    ) {
      errors.push('Project type is required and must be a non-empty string');
    }

    // Optional but validated fields
    if (priority && !Object.values(PRIORITY_LEVELS).includes(priority)) {
      errors.push(
        `Priority must be one of: ${Object.values(PRIORITY_LEVELS).join(', ')}`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate file upload data
   * @param {Object} file - Multer file object
   * @param {string} issueKey - Jira issue key
   * @returns {Object} Validation result
   */
  static validateFileUpload(file, issueKey) {
    const errors = [];

    if (!file) {
      errors.push('File is required');
    } else {
      // Check file size
      if (file.size > FILE_UPLOAD.MAX_SIZE) {
        errors.push(
          `File size must be less than ${FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB`
        );
      }

      // Check file extension
      const ext = path.extname(file.originalname).toLowerCase();
      if (!FILE_UPLOAD.ALLOWED_EXTENSIONS.includes(ext)) {
        errors.push(
          `File extension ${ext} is not allowed. Allowed: ${FILE_UPLOAD.ALLOWED_EXTENSIONS.join(', ')}`
        );
      }
    }

    if (
      !issueKey ||
      typeof issueKey !== 'string' ||
      !/^[A-Z]+-\d+$/.test(issueKey)
    ) {
      errors.push('Valid issue key is required (format: PROJECT-123)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate custom fields array
   * @param {Array} customFields - Custom fields array
   * @returns {Object} Validation result
   */
  static validateCustomFields(customFields) {
    const errors = [];

    if (customFields && !Array.isArray(customFields)) {
      errors.push('Custom fields must be an array');
      return { isValid: false, errors };
    }

    if (customFields) {
      customFields.forEach((field, index) => {
        if (!field.key || typeof field.key !== 'string') {
          errors.push(`Custom field at index ${index} must have a valid key`);
        }
        if (field.value === undefined || field.value === null) {
          errors.push(`Custom field at index ${index} must have a value`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate preview request data
   * @param {Object} data - Preview request data
   * @returns {Object} Validation result
   */
  static validatePreviewData(data) {
    const errors = [];
    const { prompt, images, issueType } = data;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      errors.push('Prompt is required and must be a non-empty string');
    }

    if (images && !Array.isArray(images)) {
      errors.push('Images must be an array');
    }

    if (issueType && !Object.values(ISSUE_TYPES).includes(issueType)) {
      errors.push(
        `Issue type must be one of: ${Object.values(ISSUE_TYPES).join(', ')}`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate issue keys array
   * @param {Array} issueKeys - Array of issue keys
   * @returns {Object} Validation result
   */
  static validateIssueKeys(issueKeys) {
    const errors = [];

    if (!Array.isArray(issueKeys)) {
      errors.push('Issue keys must be an array');
      return { isValid: false, errors };
    }

    if (issueKeys.length === 0) {
      errors.push('At least one issue key is required');
      return { isValid: false, errors };
    }

    const invalidKeys = issueKeys.filter(
      key => !key || typeof key !== 'string' || !/^[A-Z]+-\d+$/.test(key)
    );

    if (invalidKeys.length > 0) {
      errors.push(
        `Invalid issue key format: ${invalidKeys.join(', ')}. Expected format: PROJECT-123`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
