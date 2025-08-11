import logger from '../../../logger.js';
import {
  withErrorHandling,
  withExpressErrorHandling,
} from '../../../utils/error-handling.js';
import { withLogging } from '../../../utils/logging.js';
import {
  ValidationSchemas,
  withValidation,
} from '../../../utils/validation.js';
import { JiraSummaryService } from '../services/jira-summary-service.js';
import { createIssue, fetchIssue } from '../services/jira-api-service.js';
import {
  enhanceDescription as enhanceJiraDescription,
  formatComment as formatJiraComment,
  generateCommentReply as generateJiraCommentReply,
  streamPreviewContent as streamJiraPreviewContent,
} from '../services/jira-content-service.js';
import { handleAttachments as handleAttachmentsService } from '../services/jira-attachment-service.js';

// ============================================================================
// PURE BUSINESS LOGIC FUNCTIONS
// ============================================================================

/**
 * Core function for fetching Jira summaries
 * @param {string[]} issueKeys - Array of Jira issue keys
 * @returns {Promise<Object>} Map of issue keys to summaries
 */
const fetchJiraSummariesCore = async issueKeys => {
  return await JiraSummaryService.fetchJiraSummaries(issueKeys);
};

/**
 * Core function for getting issue details
 * @param {string} issueKey - Jira issue key
 * @returns {Promise<Object>} Jira issue details
 */
const getIssueDetailsCore = async issueKey => {
  return await fetchIssue(issueKey);
};

/**
 * Core function for handling attachments
 * @param {string} issueKey - Jira issue key
 * @param {Array} attachments - Attachment files
 * @returns {Promise<Object>} Attachment results
 */
const handleAttachmentsCore = async (issueKey, attachments) => {
  return await handleAttachmentsService(issueKey, attachments);
};

/**
 * Core function for creating Jira issue
 * @param {Object} issueData - Issue creation data
 * @returns {Promise<Object>} Created issue result
 */
const createJiraIssueCore = async issueData => {
  return await createIssue(issueData);
};

/**
 * Core function for enhancing description
 * @param {string} description - Original description
 * @param {string} issueType - Issue type
 * @returns {Promise<string>} Enhanced description
 */
const enhanceDescriptionCore = async (description, issueType) => {
  const result = await enhanceJiraDescription(description, issueType);
  return result.success ? result.data : description;
};

/**
 * Core function for generating comment reply
 * @param {string} comment - Original comment
 * @param {string} context - Context information
 * @param {string} tone - Reply tone
 * @returns {Promise<string>} Generated reply
 */
const generateCommentReplyCore = async (comment, context, tone) => {
  const result = await generateJiraCommentReply(comment, context, tone);
  return result.success
    ? result.data
    : 'Thank you for your comment. I will review and follow up accordingly.';
};

/**
 * Core function for formatting comment
 * @param {string} comment - Original comment
 * @param {string} format - Target format
 * @returns {Promise<string>} Formatted comment
 */
const formatCommentCore = async (comment, format) => {
  const result = await formatJiraComment(comment, format);
  return result.success ? result.data : comment;
};

// ============================================================================
// COMPOSED BUSINESS LOGIC FUNCTIONS
// ============================================================================

/**
 * Fetch Jira summaries with validation, logging, and error handling
 */
export const fetchJiraSummaries = withErrorHandling(
  withLogging(
    withValidation(fetchJiraSummariesCore, ValidationSchemas.JIRA_ISSUE_KEYS),
    'fetchJiraSummaries',
  ),
  'fetchJiraSummaries',
);

/**
 * Get issue details with validation, logging, and error handling
 */
export const getIssueDetails = withErrorHandling(
  withLogging(
    withValidation(getIssueDetailsCore, ValidationSchemas.JIRA_ISSUE_KEY),
    'getIssueDetails',
  ),
  'getIssueDetails',
);

/**
 * Handle attachments with validation, logging, and error handling
 */
export const handleAttachments = withErrorHandling(
  withLogging(
    withValidation(handleAttachmentsCore, {
      issueKey: { type: 'string', required: true },
      attachments: { type: 'array', required: true },
    }),
    'handleAttachments',
  ),
  'handleAttachments',
);

/**
 * Create Jira issue with validation, logging, and error handling
 */
export const createJiraIssue = withErrorHandling(
  withLogging(
    withValidation(createJiraIssueCore, {
      summary: { type: 'string', required: true, minLength: 1 },
      description: { type: 'string', required: false },
      issueType: { type: 'string', required: true },
    }),
    'createJiraIssue',
  ),
  'createJiraIssue',
);

/**
 * Enhance description with validation, logging, and error handling
 */
export const enhanceDescription = withErrorHandling(
  withLogging(
    withValidation(enhanceDescriptionCore, {
      description: { type: 'string', required: true, minLength: 1 },
      issueType: { type: 'string', required: false },
    }),
    'enhanceDescription',
  ),
  'enhanceDescription',
);

/**
 * Generate comment reply with validation, logging, and error handling
 */
export const generateCommentReply = withErrorHandling(
  withLogging(
    withValidation(generateCommentReplyCore, {
      comment: { type: 'string', required: true, minLength: 1 },
      context: { type: 'string', required: false },
      tone: { type: 'string', required: false },
    }),
    'generateCommentReply',
  ),
  'generateCommentReply',
);

/**
 * Format comment with validation, logging, and error handling
 */
export const formatComment = withErrorHandling(
  withLogging(
    withValidation(formatCommentCore, {
      comment: { type: 'string', required: true, minLength: 1 },
      format: { type: 'string', required: false },
    }),
    'formatComment',
  ),
  'formatComment',
);

// ============================================================================
// EXPRESS ROUTE HANDLERS
// ============================================================================

/**
 * Express handler for previewing bug report
 */
export const previewBugReport = withExpressErrorHandling(async (req, res) => {
  const { prompt, images = [], issueType } = req.body;

  logger.info('Previewing bug report', {
    hasPrompt: !!prompt,
    imageCount: images.length,
    issueType,
  });

  // Call the streaming preview service
  await streamJiraPreviewContent({ prompt, issueType }, images, res);

  res.end();
}, 'previewBugReport');

/**
 * Express handler for creating Jira issue
 */
export const createJiraIssueHandler = withExpressErrorHandling(
  async (req, res) => {
    logger.info('Creating Jira issue', { body: req.body });

    const result = await createJiraIssue(req.body);

    res.status(200).json({
      message: 'Jira issue created successfully',
      jiraIssue: result,
    });
  },
  'createJiraIssueHandler',
);

/**
 * Express handler for uploading image
 */
export const uploadImage = withExpressErrorHandling(async (req, res) => {
  logger.info('Uploading image', { file: req.file });

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const result = await handleAttachments('temp', [req.file]);
  res.json(result);
}, 'uploadImage');

/**
 * Express handler for getting Jira issue
 */
export const getJiraIssue = withExpressErrorHandling(async (req, res) => {
  const { id } = req.params;
  logger.info('Getting Jira issue', { issueId: id });

  const issue = await getIssueDetails(id);
  res.json(issue);
}, 'getJiraIssue');

/**
 * Express handler for enhancing description using AI
 */
export const enhanceDescriptionHandler = withExpressErrorHandling(
  async (req, res) => {
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

    const enhancedDescription = await enhanceDescription(
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
  },
  'enhanceDescriptionHandler',
);

/**
 * Express handler for generating AI comment reply
 */
export const generateCommentReplyHandler = withExpressErrorHandling(
  async (req, res) => {
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

    const reply = await generateCommentReply(comment, context, tone);

    res.json({
      success: true,
      data: {
        originalComment: comment,
        suggestedReply: reply,
        tone,
      },
    });
  },
  'generateCommentReplyHandler',
);

/**
 * Express handler for formatting comment using AI
 */
export const formatCommentHandler = withExpressErrorHandling(
  async (req, res) => {
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

    const formattedComment = await formatComment(comment, format);

    res.json({
      success: true,
      data: {
        original: comment,
        formatted: formattedComment,
        format,
      },
    });
  },
  'formatCommentHandler',
);

/**
 * Express handler for fetching summaries (for route usage)
 */
export const fetchJiraSummariesHandler = withExpressErrorHandling(
  async (req, res) => {
    const { issueKeys } = req.body;

    if (!Array.isArray(issueKeys) || issueKeys.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'issueKeys must be a non-empty array',
      });
    }

    const summaries = await fetchJiraSummaries(issueKeys);
    res.json(summaries);
  },
  'fetchJiraSummariesHandler',
);
