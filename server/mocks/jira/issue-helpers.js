/**
 * Jira Mock Issue Operations
 * Contains issue-related mock functions
 */

import { mockData } from './jira-mock-data.js';
import { mockErrorResponses } from './mock-metadata.js';

/**
 * Get default issue response data
 * @returns {Object} Default issue response structure
 */
const getDefaultIssueResponse = () => ({
  id: '10001',
  key: 'MOCK-1',
  fields: {
    summary: 'Default Mock Issue',
    description: 'A mock issue for testing purposes',
    issuetype: mockData.issueTypes[0],
    priority: mockData.priorities[1], // High priority
    project: {
      id: '10000',
      key: 'MOCK',
      name: 'Mock Project',
    },
    status: mockData.statuses[0],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
});

/**
 * Validate issue data
 * @param {object} issueData - Issue data to validate
 * @returns {object} Validation result
 */
export const validateIssueData = (issueData) => {
  const errors = [];
  
  if (!issueData.fields?.summary) {
    errors.push('Summary is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Create error response object
 * @param {string} errorType - Type of error
 * @returns {object} Error response
 */
export const createErrorResponse = (errorType) => {
  const errorData = mockErrorResponses[errorType] || mockErrorResponses.serverError;
  return {
    success: false,
    error: errorData.data,
    status: errorData.status,
  };
};

/**
 * Build mock issue from data
 * @param {object} issueData - Issue creation data
 * @param {string} issueKey - Generated issue key
 * @param {string} issueId - Generated issue ID
 * @returns {object} Mock issue
 */
export const buildMockIssue = (issueData, issueKey, issueId) => {
  const defaultResponse = getDefaultIssueResponse();
  return {
    ...defaultResponse,
    id: issueId,
    key: issueKey,
    self: `https://mock-jira.atlassian.net/rest/api/2/issue/${issueId}`,
    fields: {
      ...defaultResponse.fields,
      summary: issueData.fields.summary,
      description: issueData.fields.description || 'Mock issue description',
      issuetype: issueData.fields.issuetype || defaultResponse.fields.issuetype,
      priority: issueData.fields.priority || defaultResponse.fields.priority,
      project: issueData.fields.project || defaultResponse.fields.project,
      assignee: issueData.fields.assignee || null,
      labels: issueData.fields.labels || [],
      components: issueData.fields.components || [],
      fixVersions: issueData.fields.fixVersions || [],
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    },
  };
};

/**
 * Get predefined mock issue
 * @param {string} issueKey - Issue key
 * @returns {object} Mock issue
 */
export const getPredefinedMockIssue = (issueKey) => ({
  key: issueKey,
});

/**
 * Expand issue data based on expand parameters
 * @param {object} issue - Issue object
 * @param {Array} expand - Expand parameters
 * @param {Map} comments - Comments map
 * @param {Map} attachments - Attachments map
 * @returns {object} Expanded issue object
 */
export const expandIssueData = (issue, expand = [], comments, attachments) => {
  const expandedIssue = { ...issue };

  if (expand.includes('comments')) {
    const issueComments = comments.get(issue.key) || [];
    expandedIssue.fields = {
      ...expandedIssue.fields,
      comment: {
        startAt: 0,
        maxResults: 50,
        total: issueComments.length,
        comments: issueComments,
      },
    };
  }

  if (expand.includes('attachments')) {
    expandedIssue.fields = {
      ...expandedIssue.fields,
      attachment: attachments.get(issue.key) || [],
    };
  }

  return expandedIssue;
};
