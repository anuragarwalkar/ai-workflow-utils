/**
 * Jira Attachment data model and validation
 */

import { ValidationUtils } from "../utils/validation-utils.js";
import path from "path";

export class JiraAttachment {
  constructor(data) {
    this.file = data.file;
    this.issueKey = data.issueKey;
    this.fileName = data.fileName || data.file?.originalname;
    this.originalPath = data.file?.path;
    this.processedPath = null;
    this.processedFileName = null;
  }

  /**
   * Validate attachment data
   * @param {Object} data - Raw attachment data
   * @throws {Error} If validation fails
   */
  static validate(data) {
    const validation = ValidationUtils.validateFileUpload(data.file, data.issueKey);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
  }

  /**
   * Create JiraAttachment instance from request data
   * @param {Object} data - Request data including file and issueKey
   * @returns {JiraAttachment} JiraAttachment instance
   */
  static fromRequest(data) {
    this.validate(data);
    return new JiraAttachment(data);
  }

  /**
   * Set processed file information (after conversion)
   * @param {string} filePath - Processed file path
   * @param {string} fileName - Processed file name
   */
  setProcessedFile(filePath, fileName) {
    this.processedPath = filePath;
    this.processedFileName = fileName;
  }

  /**
   * Get the file path to use for upload
   * @returns {string} File path
   */
  getUploadPath() {
    return this.processedPath || this.originalPath;
  }

  /**
   * Get the file name to use for upload
   * @returns {string} File name
   */
  getUploadFileName() {
    return this.processedFileName || this.fileName;
  }

  /**
   * Get file extension
   * @returns {string} File extension
   */
  getFileExtension() {
    return path.extname(this.getUploadFileName()).toLowerCase();
  }

  /**
   * Check if file needs conversion (e.g., .mov to .mp4)
   * @returns {boolean} True if conversion needed
   */
  needsConversion() {
    return this.getFileExtension() === '.mov';
  }

  /**
   * Get file size in bytes
   * @returns {number} File size
   */
  getFileSize() {
    return this.file?.size || 0;
  }

  /**
   * Get file MIME type
   * @returns {string} MIME type
   */
  getMimeType() {
    return this.file?.mimetype || 'application/octet-stream';
  }

  /**
   * Convert to plain object
   * @returns {Object} Plain object representation
   */
  toObject() {
    return {
      issueKey: this.issueKey,
      fileName: this.getUploadFileName(),
      originalFileName: this.fileName,
      fileSize: this.getFileSize(),
      mimeType: this.getMimeType(),
      extension: this.getFileExtension(),
      needsConversion: this.needsConversion()
    };
  }

  /**
   * Get display-friendly representation
   * @returns {Object} Display object
   */
  toDisplay() {
    return {
      issueKey: this.issueKey,
      fileName: this.getUploadFileName(),
      fileSize: `${(this.getFileSize() / 1024 / 1024).toFixed(2)} MB`,
      extension: this.getFileExtension()
    };
  }

  /**
   * Clean up temporary files
   */
  cleanup() {
    const fs = require('fs');
    
    // Clean up original file if it exists
    if (this.originalPath && fs.existsSync(this.originalPath)) {
      try {
        fs.unlinkSync(this.originalPath);
      } catch (error) {
        console.warn(`Failed to clean up original file ${this.originalPath}:`, error.message);
      }
    }

    // Clean up processed file if it exists and is different from original
    if (this.processedPath && 
        this.processedPath !== this.originalPath && 
        fs.existsSync(this.processedPath)) {
      try {
        fs.unlinkSync(this.processedPath);
      } catch (error) {
        console.warn(`Failed to clean up processed file ${this.processedPath}:`, error.message);
      }
    }
  }
}
