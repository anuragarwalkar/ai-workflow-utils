/**
 * Attachment processor for file handling operations
 */

import path from 'path';
import logger from '../../../logger.js';

/**
 * Convert MOV to MP4 (placeholder implementation)
 * @param {string} inputPath - Input file path
 * @returns {Promise<{filePath: string, fileName: string}>} Converted file info
 */
export const convertMovToMp4 = async inputPath => {
  try {
    // For now, just return the original file
    // In a real implementation, you would use ffmpeg or similar
    const fileName = path.basename(inputPath);

    logger.info('MOV to MP4 conversion requested', { inputPath, fileName });

    return {
      filePath: inputPath,
      fileName,
    };
  } catch (error) {
    logger.error('Failed to convert MOV to MP4', {
      error: error.message,
      inputPath,
    });
    throw error;
  }
};

/**
 * Validate file type and size
 * @param {Object} file - File object
 * @returns {boolean} True if valid
 */
export const validateFile = file => {
  if (!file) {
    return false;
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size exceeds 10MB limit');
  }

  return true;
};

/**
 * Get file type from mime type
 * @param {string} mimeType - MIME type
 * @returns {string} File type
 */
export const getFileType = mimeType => {
  if (!mimeType) return 'unknown';

  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('text/')) return 'text';

  return 'document';
};

// Export all functions as default for backward compatibility
export const AttachmentProcessor = {
  convertMovToMp4,
  validateFile,
  getFileType,
};

export default AttachmentProcessor;
