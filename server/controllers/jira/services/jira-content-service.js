/**
 * Jira content service for AI-powered content generation (Functional Version)
 */

import { jiraLangChainService } from '../../../services/langchain/index.js';
import { ValidationUtils } from '../utils/validation-utils.js';
import { ErrorHandler } from '../utils/error-handler.js';
import { ISSUE_TYPE_MAPPING, SSE_HEADERS } from '../utils/constants.js';
import { withErrorHandling, withSafeExecution } from '../../../utils/error-handling.js';
import { withLogging, withPerformanceLogging } from '../../../utils/logging.js';
import { withValidation } from '../../../utils/validation.js';
import logger from '../../../logger.js';

// ============================================================================
// PURE BUSINESS LOGIC FUNCTIONS
// ============================================================================

/**
 * Core function for streaming preview content
 * @param {Object} data - Preview request data
 * @param {Array} images - Image data array
 * @param {Object} res - Express response object for streaming
 */
const streamPreviewContentCore = async (data, images, res) => {
  // Validate input data
  const validation = ValidationUtils.validatePreviewData(data);
  if (!validation.isValid) {
    throw ErrorHandler.createValidationError(validation.errors.join(', '));
  }

  const { prompt, issueType = 'Task' } = data;

  // Get template type for AI service
  const templateType = ISSUE_TYPE_MAPPING[issueType] || ISSUE_TYPE_MAPPING.Task;

  logger.info('Generating AI preview for Jira issue', {
    issueType,
    templateType,
    hasImages: images && images.length > 0,
    promptLength: prompt.length,
  });

  // Set up Server-Sent Events headers
  res.writeHead(200, SSE_HEADERS);

  // Use the specialized Jira LangChain service for streaming
  await jiraLangChainService.streamContent(
    { prompt },
    images || [],
    templateType,
    res,
  );

  logger.info('AI preview generation completed', {
    issueType,
    templateType,
  });
};

/**
 * Core function for generating content without streaming
 * @param {Object} data - Content generation data
 * @param {Array} images - Image data array
 * @returns {Promise<string>} Generated content
 */
const generateContentCore = async (data, images = []) => {
  const validation = ValidationUtils.validatePreviewData(data);
  if (!validation.isValid) {
    throw ErrorHandler.createValidationError(validation.errors.join(', '));
  }

  const { prompt, issueType = 'Task' } = data;
  const templateType = ISSUE_TYPE_MAPPING[issueType] || ISSUE_TYPE_MAPPING.Task;

  logger.info('Generating AI content for Jira issue', {
    issueType,
    templateType,
    hasImages: images.length > 0,
  });

  // Generate content using LangChain service
  const content = await jiraLangChainService.generateContent(
    { prompt },
    images,
    templateType,
  );

  logger.info('AI content generation completed', {
    issueType,
    contentLength: content?.length || 0,
  });

  return content;
};

/**
 * Core function for enhancing description
 * @param {string} description - Original description
 * @param {string} issueType - Issue type
 * @returns {Promise<string>} Enhanced description
 */
const enhanceDescriptionCore = async (description, issueType = 'Task') => {
  if (!description || typeof description !== 'string') {
    throw ErrorHandler.createValidationError('Description is required');
  }

  const enhancementPrompt = `Please enhance and improve the following ${issueType.toLowerCase()} description while maintaining its core meaning and requirements:\n\n${description}`;

  const enhancedContent = await generateContentCore({
    prompt: enhancementPrompt,
    issueType,
  });

  logger.info('Description enhanced successfully', {
    originalLength: description.length,
    enhancedLength: enhancedContent?.length || 0,
    issueType,
  });

  return enhancedContent || description; // Fallback to original if enhancement fails
};

/**
 * Core function for generating summary
 * @param {string} description - Issue description
 * @param {string} issueType - Issue type
 * @returns {Promise<string>} Generated summary
 */
const generateSummaryCore = async (description, issueType = 'Task') => {
  if (!description || typeof description !== 'string') {
    throw ErrorHandler.createValidationError('Description is required');
  }

  const summaryPrompt = `Generate a concise, clear summary (max 100 characters) for this ${issueType.toLowerCase()}:\n\n${description}`;

  const summary = await generateContentCore({
    prompt: summaryPrompt,
    issueType,
  });

  // Ensure summary is not too long
  const cleanSummary = summary?.trim().substring(0, 100) || `${issueType} - Auto-generated`;

  logger.info('Summary generated successfully', {
    summaryLength: cleanSummary.length,
    issueType,
  });

  return cleanSummary;
};

/**
 * Core function for generating acceptance criteria
 * @param {string} description - Story description
 * @returns {Promise<string>} Generated acceptance criteria
 */
const generateAcceptanceCriteriaCore = async (description) => {
  if (!description || typeof description !== 'string') {
    throw ErrorHandler.createValidationError('Description is required');
  }

  const criteriaPrompt = `Generate clear, testable acceptance criteria for this user story:\n\n${description}`;

  const criteria = await generateContentCore({
    prompt: criteriaPrompt,
    issueType: 'Story',
  });

  logger.info('Acceptance criteria generated successfully', {
    criteriaLength: criteria?.length || 0,
  });

  return criteria || 'Acceptance criteria to be defined';
};

/**
 * Core function for generating comment reply
 * @param {string} comment - Original comment to reply to
 * @param {string} context - Additional context about the issue
 * @param {string} tone - Tone for the reply
 * @returns {Promise<string>} Generated reply
 */
const generateCommentReplyCore = async (comment, context = '', tone = 'professional') => {
  if (!comment || typeof comment !== 'string') {
    throw ErrorHandler.createValidationError('Comment is required');
  }

  const toneInstructions = {
    professional: 'professional and business-appropriate',
    friendly: 'friendly and approachable while remaining professional',
    technical: 'technical and detailed with specific implementation guidance',
  };

  const toneInstruction = toneInstructions[tone] || toneInstructions.professional;

  const replyPrompt = `Generate a ${toneInstruction} reply to this Jira comment. ${context ? `Context: ${context}` : ''}\n\nOriginal comment:\n${comment}\n\nReply:`;

  const reply = await generateContentCore({
    prompt: replyPrompt,
    issueType: 'Task',
  });

  logger.info('Comment reply generated successfully', {
    originalLength: comment.length,
    replyLength: reply?.length || 0,
    tone,
  });

  return reply || 'Thank you for your comment. I will review and follow up accordingly.';
};

/**
 * Core function for formatting comment
 * @param {string} comment - Comment to format
 * @param {string} format - Target format
 * @returns {Promise<string>} Formatted comment
 */
const formatCommentCore = async (comment, format = 'jira') => {
  if (!comment || typeof comment !== 'string') {
    throw ErrorHandler.createValidationError('Comment is required');
  }

  const formatInstructions = {
    jira: 'Format this comment using Jira markup syntax for better readability. Use *bold*, _italic_, {{monospace}}, bullet points, numbered lists, and proper line breaks where appropriate.',
    markdown: 'Format this comment using proper Markdown syntax with **bold**, *italic*, `code`, bullet points, numbered lists, and appropriate headings.',
    plain: 'Format this comment as plain text with proper paragraph breaks and clear structure.',
  };

  const formatInstruction = formatInstructions[format] || formatInstructions.jira;

  const formatPrompt = `${formatInstruction}\n\nOriginal comment:\n${comment}\n\nFormatted comment:`;

  const formatted = await generateContentCore({
    prompt: formatPrompt,
    issueType: 'Task',
  });

  logger.info('Comment formatted successfully', {
    originalLength: comment.length,
    formattedLength: formatted?.length || 0,
    format,
  });

  return formatted || comment; // Fallback to original if formatting fails
};

/**
 * Core function for analyzing comment sentiment
 * @param {string} comment - Comment to analyze
 * @returns {Promise<Object>} Analysis result
 */
const analyzeCommentSentimentCore = async (comment) => {
  if (!comment || typeof comment !== 'string') {
    throw ErrorHandler.createValidationError('Comment is required');
  }

  const analysisPrompt = `Analyze the sentiment and tone of this Jira comment and provide suggestions for improvement if needed. Return your analysis in JSON format with fields: sentiment (positive/neutral/negative), tone (professional/casual/aggressive), suggestions (array), and improved_version (string).\n\nComment:\n${comment}`;

  const analysis = await generateContentCore({
    prompt: analysisPrompt,
    issueType: 'Task',
  });

  // Try to parse JSON response
  try {
    const parsed = JSON.parse(analysis);
    logger.info('Comment sentiment analyzed successfully', {
      sentiment: parsed.sentiment,
      tone: parsed.tone,
    });
    return parsed;
  } catch (parseError) {
    // If JSON parsing fails, return a basic analysis
    return {
      sentiment: 'neutral',
      tone: 'professional',
      suggestions: ['Consider using more specific language'],
      improved_version: comment,
    };
  }
};

// ============================================================================
// COMPOSED FUNCTIONAL EXPORTS
// ============================================================================

/**
 * Stream preview content with error handling and logging
 */
export const streamPreviewContent = withErrorHandling(
  withLogging(
    withValidation(streamPreviewContentCore, {
      data: { type: 'object', required: true },
      images: { type: 'array', required: false },
      res: { type: 'object', required: true },
    }),
    'streamPreviewContent',
  ),
  'streamPreviewContent',
);

/**
 * Generate content with error handling and logging
 */
export const generateContent = withErrorHandling(
  withLogging(
    withValidation(generateContentCore, {
      data: { type: 'object', required: true },
      images: { type: 'array', required: false },
    }),
    'generateContent',
  ),
  'generateContent',
);

/**
 * Enhance description with safe execution (returns original on error)
 */
export const enhanceDescription = withSafeExecution(
  withPerformanceLogging(
    withValidation(enhanceDescriptionCore, {
      description: { type: 'string', required: true, minLength: 1 },
      issueType: { type: 'string', required: false },
    }),
    'enhanceDescription',
  ),
  'enhanceDescription',
);

/**
 * Generate summary with safe execution
 */
export const generateSummary = withSafeExecution(
  withPerformanceLogging(
    withValidation(generateSummaryCore, {
      description: { type: 'string', required: true, minLength: 1 },
      issueType: { type: 'string', required: false },
    }),
    'generateSummary',
  ),
  'generateSummary',
);

/**
 * Generate acceptance criteria with safe execution
 */
export const generateAcceptanceCriteria = withSafeExecution(
  withPerformanceLogging(
    withValidation(generateAcceptanceCriteriaCore, {
      description: { type: 'string', required: true, minLength: 1 },
    }),
    'generateAcceptanceCriteria',
  ),
  'generateAcceptanceCriteria',
);

/**
 * Generate comment reply with safe execution
 */
export const generateCommentReply = withSafeExecution(
  withPerformanceLogging(
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
 * Format comment with safe execution
 */
export const formatComment = withSafeExecution(
  withPerformanceLogging(
    withValidation(formatCommentCore, {
      comment: { type: 'string', required: true, minLength: 1 },
      format: { type: 'string', required: false },
    }),
    'formatComment',
  ),
  'formatComment',
);

/**
 * Analyze comment sentiment with safe execution
 */
export const analyzeCommentSentiment = withSafeExecution(
  withPerformanceLogging(
    withValidation(analyzeCommentSentimentCore, {
      comment: { type: 'string', required: true, minLength: 1 },
    }),
    'analyzeCommentSentiment',
  ),
  'analyzeCommentSentiment',
);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get available issue types for AI generation
 * @returns {Object} Available issue types with descriptions
 */
export const getAvailableIssueTypes = () => {
  return {
    Bug: {
      description: 'A problem or defect in the software',
      templateType: ISSUE_TYPE_MAPPING.Bug,
      aiCapabilities: [
        'Bug report generation',
        'Steps to reproduce',
        'Expected vs actual behavior',
      ],
    },
    Task: {
      description: 'A unit of work to be completed',
      templateType: ISSUE_TYPE_MAPPING.Task,
      aiCapabilities: [
        'Task breakdown',
        'Implementation details',
        'Checklist generation',
      ],
    },
    Story: {
      description: 'A user story representing a feature or requirement',
      templateType: ISSUE_TYPE_MAPPING.Story,
      aiCapabilities: [
        'User story formatting',
        'Acceptance criteria',
        'Use case scenarios',
      ],
    },
  };
};