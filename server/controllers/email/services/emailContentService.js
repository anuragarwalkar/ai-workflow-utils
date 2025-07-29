import { HtmlFormatter } from '../processors/htmlFormatter.js';
import logger from '../../../logger.js';

/**
 * EmailContentService - Handles email content generation and formatting
 */
class EmailContentService {
  /**
   * Generates formatted email body from table data
   * @param {Array} tableData - 2D array representing table data
   * @param {Object} metadata - Additional metadata for email generation
   * @param {string} metadata.wikiUrl - Source wiki URL
   * @param {string} metadata.version - Build version
   * @returns {string} Formatted HTML email body
   */
  static generateEmailBody(tableData, metadata = {}) {
    try {
      if (!Array.isArray(tableData) || tableData.length === 0) {
        throw new Error('Invalid table data: must be non-empty array');
      }

      logger.info('Generating email content', {
        rowCount: tableData.length,
        version: metadata.version
      });

      // Use HTML formatter to generate the complete email body
      const emailBody = HtmlFormatter.generateCompleteEmailBody(tableData, metadata);

      if (!emailBody || emailBody.trim().length === 0) {
        throw new Error('Generated email body is empty');
      }

      const finalEmailBody = emailBody;

      logger.info('Email content generated successfully', {
        contentLength: finalEmailBody.length
      });

      return finalEmailBody;

    } catch (error) {
      logger.error('Failed to generate email content', {
        error: error.message,
        metadata
      });
      throw new Error(`Email content generation failed: ${error.message}`);
    }
  }

  /**
   * Adds metadata footer to email body
   * @private
   * @param {string} emailBody - Generated email body
   * @param {Object} metadata - Metadata to include in footer
   * @returns {string} Email body with footer
   */
  static _addMetadataFooter(emailBody, metadata) {
    if (!metadata.wikiUrl && !metadata.version) {
      return emailBody;
    }

    let footer = '<div style="margin-top:30px;padding:15px;background-color:#f5f5f5;border-top:2px solid #801C81;font-family:Arial,sans-serif;font-size:12px;color:#666;">';
    footer += '<strong>Report Information:</strong><br>';
    
    if (metadata.version) {
      footer += `Version: ${metadata.version}<br>`;
    }
    
    if (metadata.wikiUrl) {
      footer += `Source: <a href="${metadata.wikiUrl}" style="color:#801C81;">${metadata.wikiUrl}</a><br>`;
    }
    
    footer += `Generated: ${new Date().toLocaleString()}`;
    footer += '</div>';

    return emailBody + footer;
  }

  /**
   * Validates table data structure
   * @param {Array} tableData - Table data to validate
   * @returns {boolean} True if valid
   */
  static validateTableData(tableData) {
    if (!Array.isArray(tableData) || tableData.length === 0) {
      return false;
    }

    // Check if all rows are arrays
    return tableData.every(row => Array.isArray(row));
  }
}

export { EmailContentService };
