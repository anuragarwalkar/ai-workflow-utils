/**
 * Jira attachment service for file upload handling
 */

import fs from 'fs';
import FormData from 'form-data';
import { JiraAttachment } from '../models/jira-attachment.js';
import { JiraApiService } from './jira-api-service.js';
import { AttachmentProcessor } from '../processors/attachment-processor.js';
import { ErrorHandler } from '../utils/error-handler.js';
import logger from '../../../logger.js';

export class JiraAttachmentService {
  /**
   * Upload file to Jira issue
   * @param {Object} file - Multer file object
   * @param {string} issueKey - Jira issue key
   * @param {string} originalFileName - Original file name
   * @returns {Promise<Object>} Upload result
   */
  static async uploadFile(file, issueKey, originalFileName) {
    let attachment = null;

    try {
      // Create attachment model
      attachment = JiraAttachment.fromRequest({
        file,
        issueKey,
        fileName: originalFileName,
      });

      logger.info('Starting file upload to Jira', {
        issueKey,
        fileName: attachment.getUploadFileName(),
        fileSize: attachment.getFileSize(),
        mimeType: attachment.getMimeType(),
      });

      // Process file if needed (e.g., convert .mov to .mp4)
      await this.processFileIfNeeded(attachment);

      // Create form data for upload
      const formData = await this.createFormData(attachment);

      // Upload to Jira
      const uploadResponse = await JiraApiService.uploadAttachment(
        issueKey,
        formData,
      );

      logger.info('File uploaded successfully to Jira', {
        issueKey,
        fileName: attachment.getUploadFileName(),
        attachmentId: uploadResponse[0]?.id,
      });

      return {
        success: true,
        data: uploadResponse,
        fileName: attachment.getUploadFileName(),
        originalFileName: attachment.fileName,
        fileSize: attachment.getFileSize(),
      };
    } catch (error) {
      logger.error('Failed to upload file to Jira', {
        issueKey,
        fileName: originalFileName,
        error: error.message,
      });
      throw error;
    } finally {
      // Clean up temporary files
      if (attachment) {
        attachment.cleanup();
      }
    }
  }

  /**
   * Process file if conversion is needed
   * @param {JiraAttachment} attachment - Attachment object
   */
  static async processFileIfNeeded(attachment) {
    try {
      if (attachment.needsConversion()) {
        logger.info('Converting file', {
          originalFile: attachment.getUploadFileName(),
          conversion: 'mov to mp4',
        });

        const { filePath, fileName } =
          await AttachmentProcessor.convertMovToMp4(
            attachment.getUploadPath(),
            attachment.getUploadFileName(),
          );

        attachment.setProcessedFile(filePath, fileName);

        logger.info('File conversion completed', {
          originalFile: attachment.fileName,
          convertedFile: fileName,
        });
      }
    } catch (error) {
      logger.error('File processing failed', {
        fileName: attachment.getUploadFileName(),
        error: error.message,
      });
      throw ErrorHandler.createServiceError(
        `File processing failed: ${error.message}`,
      );
    }
  }

  /**
   * Create FormData for file upload
   * @param {JiraAttachment} attachment - Attachment object
   * @returns {Promise<FormData>} FormData object
   */
  static async createFormData(attachment) {
    try {
      const filePath = attachment.getUploadPath();
      const fileName = attachment.getUploadFileName();

      // Verify file exists
      if (!fs.existsSync(filePath)) {
        throw ErrorHandler.createServiceError(`File not found: ${filePath}`);
      }

      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath), fileName);

      return formData;
    } catch (error) {
      logger.error('Failed to create form data', {
        filePath: attachment.getUploadPath(),
        error: error.message,
      });
      throw ErrorHandler.createServiceError(
        `Failed to prepare file for upload: ${error.message}`,
      );
    }
  }

  /**
   * Validate file before upload
   * @param {Object} file - Multer file object
   * @param {string} issueKey - Jira issue key
   * @returns {Object} Validation result
   */
  static validateUpload(file, issueKey) {
    try {
      JiraAttachment.validate({ file, issueKey });
      return { isValid: true, errors: [] };
    } catch (error) {
      return {
        isValid: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Get supported file types
   * @returns {Object} Supported file types information
   */
  static getSupportedFileTypes() {
    return {
      images: ['.jpg', '.jpeg', '.png', '.gif'],
      documents: ['.pdf', '.txt', '.doc', '.docx'],
      videos: ['.mp4', '.mov'],
      archives: ['.zip', '.rar', '.7z'],
      maxSize: '10MB',
      note: 'MOV files will be automatically converted to MP4',
    };
  }

  /**
   * Handle multiple file uploads
   * @param {Array} files - Array of multer file objects
   * @param {string} issueKey - Jira issue key
   * @returns {Promise<Array>} Upload results array
   */
  static async uploadMultipleFiles(files, issueKey) {
    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        const result = await this.uploadFile(file, issueKey, file.originalname);
        results.push(result);
      } catch (error) {
        errors.push({
          fileName: file.originalname,
          error: error.message,
        });
      }
    }

    return {
      successful: results,
      failed: errors,
      totalProcessed: files.length,
      totalSuccessful: results.length,
      totalFailed: errors.length,
    };
  }

  /**
   * Get file upload statistics
   * @param {string} issueKey - Jira issue key
   * @returns {Object} Upload statistics
   */
  static getUploadStats(issueKey) {
    // This would typically query a database or cache
    // For now, return a placeholder structure
    return {
      issueKey,
      totalUploads: 0,
      totalSize: 0,
      averageSize: 0,
      fileTypes: {},
      lastUpload: null,
    };
  }
}
