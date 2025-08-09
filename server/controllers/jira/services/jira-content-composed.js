// Composed functional exports for Jira content service (modularized)
import {
  analyzeCommentSentimentCore,
  enhanceDescriptionCore,
  formatCommentCore,
  generateAcceptanceCriteriaCore,
  generateCommentReplyCore,
  generateContentCore,
  generateSummaryCore,
  streamPreviewContentCore,
} from './jira-content-core.js';
import {
  withErrorHandling,
  withSafeExecution,
} from '../../../utils/error-handling.js';
import { withLogging, withPerformanceLogging } from '../../../utils/logging.js';
import { withValidation } from '../../../utils/validation.js';

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

export const generateAcceptanceCriteria = withSafeExecution(
  withPerformanceLogging(
    withValidation(generateAcceptanceCriteriaCore, {
      description: { type: 'string', required: true, minLength: 1 },
    }),
    'generateAcceptanceCriteria',
  ),
  'generateAcceptanceCriteria',
);

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

export const analyzeCommentSentiment = withSafeExecution(
  withPerformanceLogging(
    withValidation(analyzeCommentSentimentCore, {
      comment: { type: 'string', required: true, minLength: 1 },
    }),
    'analyzeCommentSentiment',
  ),
  'analyzeCommentSentiment',
);
