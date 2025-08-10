/**
 * Jira Mock Issue Operations
 * Contains issue-related mock functions
 */

import { mockCreateIssueResponse, mockIssueGetResponse } from './mock-data.js';
import { mockErrorResponses } from './mock-metadata.js';

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
export const buildMockIssue = (issueData, issueKey, issueId) => ({
  ...mockCreateIssueResponse,
  id: issueId,
  key: issueKey,
  self: `https://mock-jira.atlassian.net/rest/api/2/issue/${issueId}`,
  fields: {
    ...mockCreateIssueResponse.fields,
    summary: issueData.fields.summary,
    description: issueData.fields.description || 'Mock issue description',
    issuetype: issueData.fields.issuetype || mockCreateIssueResponse.fields.issuetype,
    priority: issueData.fields.priority || mockCreateIssueResponse.fields.priority,
    project: issueData.fields.project || mockCreateIssueResponse.fields.project,
    assignee: issueData.fields.assignee || null,
    labels: issueData.fields.labels || [],
    components: issueData.fields.components || [],
    fixVersions: issueData.fields.fixVersions || [],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
});

/**
 * Get predefined mock issue
 * @param {string} issueKey - Issue key
 * @returns {object} Mock issue
 */
export const getPredefinedMockIssue = (issueKey) => ({
  ...mockIssueGetResponse,
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
