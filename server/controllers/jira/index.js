// Functional Handlers (Pure Functional Programming)
export * from './handlers/jira-handlers.js';

// Services
export { JiraApiService } from './services/jira-api-service.js';
export { JiraSummaryService } from './services/jira-summary-service.js';
export { 
  streamPreviewContent,
  generateContent,
  enhanceDescription as enhanceJiraDescription,
  generateSummary,
  generateAcceptanceCriteria,
  generateCommentReply as generateJiraCommentReply,
  formatComment as formatJiraComment,
  analyzeCommentSentiment,
  getAvailableIssueTypes,
} from './services/jira-content-service.js';
export { JiraAttachmentService } from './services/jira-attachment-service.js';

// Models
export { JiraIssue } from './models/jira-issue.js';
// export { JiraAttachment } from './models/jira-attachment.js'; // REMOVED: No such export in model file

// Processors
export { CustomFieldProcessor } from './processors/custom-field-processor.js';
export { AttachmentProcessor } from './processors/attachment-processor.js';

// Utils
export { ValidationUtils } from './utils/validation-utils.js';
export { EnvironmentConfig } from './utils/environment-config.js';
export { ErrorHandler } from './utils/error-handler.js';
export * from './utils/constants.js';
