/**
 * Pull Request constants used across PR components
 */

// Storage keys for local storage
export const STORAGE_KEYS = {
  PROJECT_CONFIG: 'gitstash_project_config',
};

// Form field names for consistency
export const FORM_FIELDS = {
  PROJECT_KEY: 'projectKey',
  REPO_SLUG: 'repoSlug',
  BRANCH_NAME: 'branchName',
};

// Stream event types for PR preview
export const STREAM_EVENTS = {
  STATUS: 'status',
  CHUNK: 'chunk',
  TITLE_CHUNK: 'title_chunk',
  TITLE_COMPLETE: 'title_complete',
  DESCRIPTION_CHUNK: 'description_chunk',
  DESCRIPTION_COMPLETE: 'description_complete',
  COMPLETE: 'complete',
  ERROR: 'error',
};

// Default form state
export const DEFAULT_FORM_STATE = {
  [FORM_FIELDS.PROJECT_KEY]: '',
  [FORM_FIELDS.REPO_SLUG]: '',
  [FORM_FIELDS.BRANCH_NAME]: '',
};

// Default preview state
export const DEFAULT_PREVIEW_STATE = {
  prTitle: '',
  prDescription: '',
  aiGenerated: false,
  branchName: '',
};

// Preview modes
export const PREVIEW_MODES = {
  VIEW: 'view',
  EDIT: 'edit',
};

// Success messages
export const SUCCESS_MESSAGES = {
  PR_CREATED: 'Pull request created successfully',
  CONFIG_SAVED: 'Project configuration saved',
  PREVIEW_GENERATED: 'Preview generated successfully',
};

// Error messages
export const ERROR_MESSAGES = {
  PREVIEW_FAILED: 'Failed to generate preview',
  CREATE_FAILED: 'Failed to create pull request',
  STREAM_FAILED: 'Failed to start streaming preview',
  PARSE_ERROR: 'Error parsing stream data',
  NETWORK_ERROR: 'Network error occurred',
  VALIDATION_FAILED: 'Form validation failed',
};
