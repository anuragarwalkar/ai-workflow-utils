/**
 * Jira-specific constants
 */

// Issue type mappings for AI template selection
export const ISSUE_TYPE_MAPPING = {
  Bug: 'JIRA_BUG',
  Task: 'JIRA_TASK',
  Story: 'JIRA_STORY',
};

// Priority levels
export const PRIORITY_LEVELS = {
  HIGHEST: 'Highest',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
  LOWEST: 'Lowest',
};

// Issue types
export const ISSUE_TYPES = {
  BUG: 'Bug',
  TASK: 'Task',
  STORY: 'Story',
  EPIC: 'Epic',
  SUB_TASK: 'Sub-task',
};

// API endpoints
export const JIRA_ENDPOINTS = {
  ISSUE: '/rest/api/2/issue',
  SEARCH: '/rest/api/2/search',
  ATTACHMENTS: issueKey => `/rest/api/2/issue/${issueKey}/attachments`,
};

// File upload constants
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_EXTENSIONS: [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.pdf',
    '.txt',
    '.doc',
    '.docx',
    '.mp4',
    '.mov',
  ],
  UPLOAD_DIR: 'uploads/',
};

// Server-Sent Events constants
export const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Cache-Control',
};

// Error messages
export const ERROR_MESSAGES = {
  INVALID_PAYLOAD: 'Invalid request payload',
  MISSING_FILE: 'Missing file in request',
  MISSING_ISSUE_KEY: 'Missing issueKey in request payload',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  CREATE_FAILED: 'Failed to create Jira issue',
  UPLOAD_FAILED: 'Failed to upload image to Jira',
  FETCH_FAILED: 'Failed to fetch Jira issue',
  PREVIEW_FAILED: 'Failed to generate issue preview',
};
