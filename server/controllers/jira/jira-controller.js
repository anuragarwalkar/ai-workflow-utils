import { JiraSummaryService } from './services/jira-summary-service.js';
import { JiraApiService } from './services/jira-api-service.js';
import { JiraContentService } from './services/jira-content-service.js';
import { JiraAttachmentService } from './services/jira-attachment-service.js';
import { ErrorHandler } from './utils/error-handler.js';
import logger from '../../logger.js';

/**
 * Main Jira Controller - Orchestrates all jira-related operations
 */
class JiraController {
  /**
   * Fetch Jira summaries for multiple issue keys
   * @param {string[]} issueKeys - Array of Jira issue keys
   * @returns {Promise<Object>} Map of issue keys to summaries
   */
  static async fetchJiraSummaries(issueKeys) {
    try {
      logger.info('Fetching Jira summaries', { issueKeys });
      return await JiraSummaryService.fetchJiraSummaries(issueKeys);
    } catch (error) {
      ErrorHandler.handleApiError(error, 'fetchJiraSummaries');
      throw error;
    }
  }

  /**
   * Get Jira issue details
   * @param {string} issueKey - Jira issue key
   * @returns {Promise<Object>} Jira issue details
   */
  static async getIssueDetails(issueKey) {
    try {
      logger.info('Getting Jira issue details', { issueKey });
      return await JiraApiService.getIssueDetails(issueKey);
    } catch (error) {
      ErrorHandler.handleApiError(error, 'getIssueDetails');
      throw error;
    }
  }

  /**
   * Create Jira issue content using AI
   * @param {Object} issueData - Issue data
   * @returns {Promise<Object>} Generated content
   */
  static async createJiraContent(issueData) {
    try {
      logger.info('Creating Jira content', { issueData });
      return await JiraContentService.createJiraContent(issueData);
    } catch (error) {
      ErrorHandler.handleApiError(error, 'createJiraContent');
      throw error;
    }
  }

  /**
   * Handle Jira attachments
   * @param {string} issueKey - Jira issue key
   * @param {Array} attachments - Attachment files
   * @returns {Promise<Object>} Attachment results
   */
  static async handleAttachments(issueKey, attachments) {
    try {
      logger.info('Handling Jira attachments', { issueKey, attachmentCount: attachments?.length });
      return await JiraAttachmentService.handleAttachments(issueKey, attachments);
    } catch (error) {
      ErrorHandler.handleApiError(error, 'handleAttachments');
      throw error;
    }
  }

  /**
   * Preview bug report (placeholder)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @returns {Promise<void>}
   */
  static async previewBugReport(req, res) {
    try {
      logger.info('Previewing bug report', { body: req.body });
      // This would typically generate a preview of the Jira issue content
      res.json({ 
        success: true, 
        preview: "Bug report preview would be generated here",
        data: req.body 
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'previewBugReport');
      throw error;
    }
  }

  /**
   * Create Jira issue
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @returns {Promise<void>}
   */
  static async createJiraIssue(req, res) {
    try {
      logger.info('Creating Jira issue', { body: req.body });
      const result = await JiraContentService.createJiraContent(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'createJiraIssue');
      throw error;
    }
  }

  /**
   * Upload image
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @returns {Promise<void>}
   */
  static async uploadImage(req, res) {
    try {
      logger.info('Uploading image', { file: req.file });
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const result = await JiraAttachmentService.handleAttachments('temp', [req.file]);
      res.json({ success: true, data: result });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'uploadImage');
      throw error;
    }
  }

  /**
   * Get Jira issue
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @returns {Promise<void>}
   */
  static async getJiraIssue(req, res) {
    try {
      const { id } = req.params;
      logger.info('Getting Jira issue', { issueId: id });
      const issue = await this.getIssueDetails(id);
      res.json({ success: true, data: issue });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'getJiraIssue');
      throw error;
    }
  }
}

// Export the fetchJiraSummaries function for backward compatibility
export const fetchJiraSummaries = JiraController.fetchJiraSummaries;

// Export the controller class as default
export default JiraController;
