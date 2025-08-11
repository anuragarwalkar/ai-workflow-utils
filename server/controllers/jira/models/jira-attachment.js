/**
 * Jira Attachment functional model and validation
 * Migrated from class-based to functional programming approach
 */

import { withValidation } from '../../../utils/validation.js';
import { withErrorHandling, withSafeExecution } from '../../../utils/error-handling.js';
import { withLogging, withPerformanceLogging } from '../../../utils/logging.js';
import { ValidationUtils } from '../utils/validation-utils.js';
import path from 'path';
import fs from 'fs';

// ============================================================================
// CORE BUSINESS LOGIC FUNCTIONS (Pure Functions)
// ============================================================================

/**
 * Create attachment data structure from request data
 * @param {Object} data - Request data including file and issueKey
 * @returns {Object} Attachment data structure
 */
const createAttachmentCore = data => ({
  file: data.file,
  issueKey: data.issueKey,
  fileName: data.fileName || data.file?.originalname,
  originalPath: data.file?.path,
  processedPath: null,
  processedFileName: null,
});

/**
 * Validate attachment data
 * @param {Object} data - Raw attachment data
 * @throws {Error} If validation fails
 */
const validateAttachmentCore = data => {
  const validation = ValidationUtils.validateFileUpload(data.file, data.issueKey);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }
};

/**
 * Set processed file information (after conversion)
 * @param {Object} attachment - Attachment object
 * @param {string} filePath - Processed file path
 * @param {string} fileName - Processed file name
 * @returns {Object} Updated attachment object
 */
const setProcessedFileCore = (attachment, filePath, fileName) => ({
  ...attachment,
  processedPath: filePath,
  processedFileName: fileName,
});

/**
 * Get the file path to use for upload
 * @param {Object} attachment - Attachment object
 * @returns {string} File path
 */
const getUploadPathCore = attachment => attachment.processedPath || attachment.originalPath;

/**
 * Get the file name to use for upload
 * @param {Object} attachment - Attachment object
 * @returns {string} File name
 */
const getUploadFileNameCore = attachment => attachment.processedFileName || attachment.fileName;

/**
 * Get file extension
 * @param {Object} attachment - Attachment object
 * @returns {string} File extension
 */
const getFileExtensionCore = attachment => {
  const fileName = getUploadFileNameCore(attachment);
  return path.extname(fileName).toLowerCase();
};

/**
 * Check if file needs conversion (e.g., .mov to .mp4)
 * @param {Object} attachment - Attachment object
 * @returns {boolean} True if conversion needed
 */
const needsConversionCore = attachment => getFileExtensionCore(attachment) === '.mov';

/**
 * Get file size in bytes
 * @param {Object} attachment - Attachment object
 * @returns {number} File size
 */
const getFileSizeCore = attachment => attachment.file?.size || 0;

/**
 * Get file MIME type
 * @param {Object} attachment - Attachment object
 * @returns {string} MIME type
 */
const getMimeTypeCore = attachment => attachment.file?.mimetype || 'application/octet-stream';

/**
 * Convert to plain object
 * @param {Object} attachment - Attachment object
 * @returns {Object} Plain object representation
 */
const toObjectCore = attachment => ({
  issueKey: attachment.issueKey,
  fileName: getUploadFileNameCore(attachment),
  originalFileName: attachment.fileName,
  fileSize: getFileSizeCore(attachment),
  mimeType: getMimeTypeCore(attachment),
  extension: getFileExtensionCore(attachment),
  needsConversion: needsConversionCore(attachment),
});

/**
 * Get display-friendly representation
 * @param {Object} attachment - Attachment object
 * @returns {Object} Display object
 */
const toDisplayCore = attachment => ({
  issueKey: attachment.issueKey,
  fileName: getUploadFileNameCore(attachment),
  fileSize: `${(getFileSizeCore(attachment) / 1024 / 1024).toFixed(2)} MB`,
  extension: getFileExtensionCore(attachment),
});

/**
 * Clean up temporary files
 * @param {Object} attachment - Attachment object
 */
const cleanupCore = attachment => {
  // Clean up original file if it exists
  if (attachment.originalPath && fs.existsSync(attachment.originalPath)) {
    try {
      fs.unlinkSync(attachment.originalPath);
    } catch (error) {
      console.warn(`Failed to clean up original file ${attachment.originalPath}:`, error.message);
    }
  }

  // Clean up processed file if it exists and is different from original
  if (
    attachment.processedPath &&
    attachment.processedPath !== attachment.originalPath &&
    fs.existsSync(attachment.processedPath)
  ) {
    try {
      fs.unlinkSync(attachment.processedPath);
    } catch (error) {
      console.warn(`Failed to clean up processed file ${attachment.processedPath}:`, error.message);
    }
  }
};

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ATTACHMENT_VALIDATION_SCHEMA = {
  file: { type: 'object', required: true },
  issueKey: { type: 'string', required: true, pattern: /^[A-Z]+-\d+$/ },
  fileName: { type: 'string', required: false },
};

const PROCESSED_FILE_VALIDATION_SCHEMA = {
  filePath: { type: 'string', required: true, minLength: 1 },
  fileName: { type: 'string', required: true, minLength: 1 },
};

// ============================================================================
// COMPOSED FUNCTIONAL EXPORTS
// ============================================================================

/**
 * Create JiraAttachment instance from request data with validation and error handling
 */
export const createAttachment = withErrorHandling(
  withLogging(
    withValidation(createAttachmentCore, ATTACHMENT_VALIDATION_SCHEMA),
    'createAttachment'
  ),
  'createAttachment'
);

/**
 * Validate attachment data with error handling
 */
export const validateAttachment = withErrorHandling(
  withValidation(validateAttachmentCore, ATTACHMENT_VALIDATION_SCHEMA),
  'validateAttachment'
);

/**
 * Set processed file information with validation and safe execution
 */
export const setProcessedFile = withSafeExecution(
  withValidation(
    (attachment, filePath, fileName) => setProcessedFileCore(attachment, filePath, fileName),
    {
      attachment: { type: 'object', required: true },
      ...PROCESSED_FILE_VALIDATION_SCHEMA,
    }
  ),
  'setProcessedFile'
);

/**
 * Get upload path with safe execution
 */
export const getUploadPath = withSafeExecution(
  withValidation(getUploadPathCore, {
    attachment: { type: 'object', required: true },
  }),
  'getUploadPath'
);

/**
 * Get upload file name with safe execution
 */
export const getUploadFileName = withSafeExecution(
  withValidation(getUploadFileNameCore, {
    attachment: { type: 'object', required: true },
  }),
  'getUploadFileName'
);

/**
 * Get file extension with safe execution
 */
export const getFileExtension = withSafeExecution(
  withValidation(getFileExtensionCore, {
    attachment: { type: 'object', required: true },
  }),
  'getFileExtension'
);

/**
 * Check if file needs conversion with safe execution
 */
export const needsConversion = withSafeExecution(
  withValidation(needsConversionCore, {
    attachment: { type: 'object', required: true },
  }),
  'needsConversion'
);

/**
 * Get file size with safe execution
 */
export const getFileSize = withSafeExecution(
  withValidation(getFileSizeCore, {
    attachment: { type: 'object', required: true },
  }),
  'getFileSize'
);

/**
 * Get MIME type with safe execution
 */
export const getMimeType = withSafeExecution(
  withValidation(getMimeTypeCore, {
    attachment: { type: 'object', required: true },
  }),
  'getMimeType'
);

/**
 * Convert to object with safe execution
 */
export const toObject = withSafeExecution(
  withValidation(toObjectCore, {
    attachment: { type: 'object', required: true },
  }),
  'toObject'
);

/**
 * Convert to display format with safe execution
 */
export const toDisplay = withSafeExecution(
  withValidation(toDisplayCore, {
    attachment: { type: 'object', required: true },
  }),
  'toDisplay'
);

/**
 * Clean up files with safe execution and performance logging
 */
export const cleanup = withSafeExecution(
  withPerformanceLogging(
    withValidation(cleanupCore, {
      attachment: { type: 'object', required: true },
    }),
    'cleanup'
  ),
  'cleanup'
);

/**
 * Create attachment from request data (main factory function)
 */
export const fromRequest = withErrorHandling(
  withLogging(data => {
    validateAttachmentCore(data);
    return createAttachmentCore(data);
  }, 'fromRequest'),
  'fromRequest'
);

// ============================================================================
// UTILITY FUNCTIONS FOR EXTERNAL USE
// ============================================================================

/**
 * Create multiple attachments from request data array
 * @param {Array} dataArray - Array of request data objects
 * @returns {Array} Array of attachment objects
 */
export const createMultipleAttachments = withSafeExecution(
  withLogging(dataArray => {
    if (!Array.isArray(dataArray)) {
      throw new Error('Data must be an array');
    }
    return dataArray.map(data => createAttachmentCore(data));
  }, 'createMultipleAttachments'),
  'createMultipleAttachments'
);

/**
 * Validate multiple attachments
 * @param {Array} dataArray - Array of request data objects
 * @returns {Object} Validation result with details
 */
export const validateMultipleAttachments = withSafeExecution(
  withLogging(dataArray => {
    if (!Array.isArray(dataArray)) {
      throw new Error('Data must be an array');
    }
    const results = dataArray.map((data, index) => {
      try {
        validateAttachmentCore(data);
        return { index, valid: true, errors: [] };
      } catch (error) {
        return { index, valid: false, errors: [error.message] };
      }
    });
    const validCount = results.filter(r => r.valid).length;
    const invalidResults = results.filter(r => !r.valid);
    return {
      totalCount: dataArray.length,
      validCount,
      invalidCount: invalidResults.length,
      allValid: invalidResults.length === 0,
      invalidItems: invalidResults,
    };
  }, 'validateMultipleAttachments'),
  'validateMultipleAttachments'
);
