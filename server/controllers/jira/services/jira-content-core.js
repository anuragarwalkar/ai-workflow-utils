// Core business logic for Jira content service (modularized)
import { jiraLangChainService } from '../../../services/langchain/index.js';
import { ValidationUtils } from '../utils/validation-utils.js';
import { ErrorHandler } from '../utils/error-handler.js';
import { ISSUE_TYPE_MAPPING, SSE_HEADERS } from '../utils/constants.js';
import logger from '../../../logger.js';

export const streamPreviewContentCore = async (data, images, res) => {
  const validation = ValidationUtils.validatePreviewData(data);
  if (!validation.isValid) {
    throw ErrorHandler.createValidationError(validation.errors.join(', '));
  }
  const { prompt, issueType = 'Task' } = data;
  const templateType = ISSUE_TYPE_MAPPING[issueType] || ISSUE_TYPE_MAPPING.Task;
  logger.info('Generating AI preview for Jira issue', {
    issueType,
    templateType,
    hasImages: images && images.length > 0,
    promptLength: prompt.length,
  });
  res.writeHead(200, SSE_HEADERS);
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

export const generateContentCore = async (data, images = []) => {
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

export const enhanceDescriptionCore = async (description, issueType = 'Task') => {
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
  return enhancedContent || description;
};

export const generateSummaryCore = async (description, issueType = 'Task') => {
  if (!description || typeof description !== 'string') {
    throw ErrorHandler.createValidationError('Description is required');
  }
  const summaryPrompt = `Generate a concise, clear summary (max 100 characters) for this ${issueType.toLowerCase()}:\n\n${description}`;
  const summary = await generateContentCore({
    prompt: summaryPrompt,
    issueType,
  });
  const cleanSummary = summary?.trim().substring(0, 100) || `${issueType} - Auto-generated`;
  logger.info('Summary generated successfully', {
    summaryLength: cleanSummary.length,
    issueType,
  });
  return cleanSummary;
};

export const generateAcceptanceCriteriaCore = async description => {
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

export const generateCommentReplyCore = async (
  comment,
  context = '',
  tone = 'professional',
) => {
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
  return (
    reply ||
    'Thank you for your comment. I will review and follow up accordingly.'
  );
};

export const formatCommentCore = async (comment, format = 'jira') => {
  if (!comment || typeof comment !== 'string') {
    throw ErrorHandler.createValidationError('Comment is required');
  }
  const formatInstructions = {
    jira: 'Format this comment using Jira markup syntax for better readability. Use *bold*, _italic_, {{monospace}}, bullet points, numbered lists, and proper line breaks where appropriate.',
    markdown:
      'Format this comment using proper Markdown syntax with **bold**, *italic*, `code`, bullet points, numbered lists, and appropriate headings.',
    plain:
      'Format this comment as plain text with proper paragraph breaks and clear structure.',
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
  return formatted || comment;
};

export const analyzeCommentSentimentCore = async comment => {
  if (!comment || typeof comment !== 'string') {
    throw ErrorHandler.createValidationError('Comment is required');
  }
  const analysisPrompt = `Analyze the sentiment and tone of this Jira comment and provide suggestions for improvement if needed. Return your analysis in JSON format with fields: sentiment (positive/neutral/negative), tone (professional/casual/aggressive), suggestions (array), and improved_version (string).\n\nComment:\n${comment}`;
  const analysis = await generateContentCore({
    prompt: analysisPrompt,
    issueType: 'Task',
  });
  try {
    const parsed = JSON.parse(analysis);
    logger.info('Comment sentiment analyzed successfully', {
      sentiment: parsed.sentiment,
      tone: parsed.tone,
    });
    return parsed;
  } catch {
    return {
      sentiment: 'neutral',
      tone: 'professional',
      suggestions: ['Consider using more specific language'],
      improved_version: comment,
    };
  }
};
