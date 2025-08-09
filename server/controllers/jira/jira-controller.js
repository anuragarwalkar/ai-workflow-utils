import { JiraSummaryService } from './services/jira-summary-service.js';
import { JiraApiService } from './services/jira-api-service.js';
import { JiraContentService } from './services/jira-content-service.js';
import { JiraAttachmentService } from './services/jira-attachment-service.js';
import { ErrorHandler } from './utils/error-handler.js';
import logger from '../../logger.js';

/**
 * Fetch Jira summaries for multiple issue keys
 * @param {string[]} issueKeys - Array of Jira issue keys
 * @returns {Promise<Object>} Map of issue keys to summaries
 */
export const fetchJiraSummaries = async (issueKeys) => {
  try {
    logger.info('Fetching Jira summaries', { issueKeys });
    return await JiraSummaryService.fetchJiraSummaries(issueKeys);
  } catch (error) {
    ErrorHandler.handleApiError(error, 'fetchJiraSummaries');
    throw error;
  }
};

/**
 * Get Jira issue details
 * @param {string} issueKey - Jira issue key
 * @returns {Promise<Object>} Jira issue details
 */
export const getIssueDetails = async (issueKey) => {
  try {
    logger.info('Getting Jira issue details', { issueKey });
    return await JiraApiService.fetchIssue(issueKey);
  } catch (error) {
    ErrorHandler.handleApiError(error, 'getIssueDetails');
    throw error;
  }
};

/**
 * Handle Jira attachments
 * @param {string} issueKey - Jira issue key
 * @param {Array} attachments - Attachment files
 * @returns {Promise<Object>} Attachment results
 */
export const handleAttachments = async (issueKey, attachments) => {
  try {
    logger.info('Handling Jira attachments', {
      issueKey,
      attachmentCount: attachments?.length,
    });
    return await JiraAttachmentService.handleAttachments(
      issueKey,
      attachments,
    );
  } catch (error) {
    ErrorHandler.handleApiError(error, 'handleAttachments');
    throw error;
  }
};

/**
 * Preview bug report (placeholder)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {Promise<void>}
 */
export const previewBugReport = async (req, res) => {
  try {
    const { prompt, images = [], issueType } = req.body;

    logger.info('Previewing bug report', {
      hasPrompt: !!prompt,
      imageCount: images.length,
      issueType,
    });

    // Call the streaming preview service
    await JiraContentService.streamPreviewContent(
      { prompt, issueType },
      images,
      res,
    );
  } catch (error) {
    ErrorHandler.handleApiError(error, 'previewBugReport', res);
  }

  res.end();
};

/**
 * Create Jira issue
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {Promise<void>}
 */
export const createJiraIssue = async (req, res) => {
  try {
    logger.info('Creating Jira issue', { body: req.body });
    const result = await JiraApiService.createIssue(req.body);

    res.status(200).json({
      message: 'Jira issue created successfully',
      jiraIssue: result,
    });
  } catch (error) {
    ErrorHandler.handleApiError(error, 'createJiraIssue');
    throw error;
  }
};

/**
 * Upload image
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {Promise<void>}
 */
export const uploadImage = async (req, res) => {
  try {
    logger.info('Uploading image', { file: req.file });
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const result = await JiraAttachmentService.handleAttachments('temp', [
      req.file,
    ]);
    res.json(result);
  } catch (error) {
    ErrorHandler.handleApiError(error, 'uploadImage');
    throw error;
  }
};

/**
 * Get Jira issue
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {Promise<void>}
 */
export const getJiraIssue = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('Getting Jira issue', { issueId: id });
    const issue = await getIssueDetails(id);
    res.json(issue);
  } catch (error) {
    ErrorHandler.handleApiError(error, 'getJiraIssue');
    throw error;
  }
};

/**
 * Enhance description using AI
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {Promise<void>}
 */
export const enhanceDescription = async (req, res) => {
  try {
    const { description, issueType = 'Task' } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        error: 'Description is required',
      });
    }

    logger.info('Enhancing Jira description with AI', {
      issueType,
      descriptionLength: description.length,
    });

    const enhancedDescription = await JiraContentService.enhanceDescription(
      description,
      issueType,
    );

    res.json({
      success: true,
      data: {
        original: description,
        enhanced: enhancedDescription,
      },
    });
  } catch (error) {
    ErrorHandler.handleApiError(error, 'enhanceDescription', res);
  }
};

/**
 * Generate AI comment reply
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {Promise<void>}
 */
export const generateCommentReply = async (req, res) => {
  try {
    const { comment, context, tone = 'professional' } = req.body;

    if (!comment) {
      return res.status(400).json({
        success: false,
        error: 'Comment is required',
      });
    }

    logger.info('Generating AI comment reply', {
      commentLength: comment.length,
      tone,
    });

    const reply = await JiraContentService.generateCommentReply(
      comment,
      context,
      tone,
    );

    res.json({
      success: true,
      data: {
        originalComment: comment,
        suggestedReply: reply,
        tone,
      },
    });
  } catch (error) {
    ErrorHandler.handleApiError(error, 'generateCommentReply', res);
  }
};

/**
 * Format comment using AI
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {Promise<void>}
 */
export const formatComment = async (req, res) => {
  try {
    const { comment, format = 'jira' } = req.body;

    if (!comment) {
      return res.status(400).json({
        success: false,
        error: 'Comment is required',
      });
    }

    logger.info('Formatting comment with AI', {
      commentLength: comment.length,
      format,
    });

    const formattedComment = await JiraContentService.formatComment(
      comment,
      format,
    );

    res.json({
      success: true,
      data: {
        original: comment,
        formatted: formattedComment,
        format,
      },
    });
  } catch (error) {
    ErrorHandler.handleApiError(error, 'formatComment', res);
  }
};

// Export all functions as default for backward compatibility
const JiraController = {
  fetchJiraSummaries,
  getIssueDetails,
  handleAttachments,
  previewBugReport,
  createJiraIssue,
  uploadImage,
  getJiraIssue,
  enhanceDescription,
  generateCommentReply,
  formatComment,
};

export default JiraController;
