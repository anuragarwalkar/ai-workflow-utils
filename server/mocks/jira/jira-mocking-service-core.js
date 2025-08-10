/**
 * Jira Mocking Service
 * Provides mock responses for Jira API calls when JIRA_MOCK_MODE is enabled
 * Follows functional programming principles with immutable state management
 */

import { mockIssueGetResponse, mockSearchResponse } from './mock-data.js';
import { mockUsers } from './mock-metadata.js';
import {
  buildMockIssue,
  createErrorResponse,
  expandIssueData,
  getPredefinedMockIssue,
  validateIssueData,
} from './issue-helpers.js';

// State management using functional approach
let mockState = {
  mockMode: process.env.MOCK_MODE === 'true',
  mockIssueCounter: 1000,
  createdIssues: new Map(),
  comments: new Map(),
  attachments: new Map(),
};

// Pure function to get current state
export const getMockState = () => ({ ...mockState });

// Pure function to update state
export const updateMockState = (updates) => {
  mockState = { ...mockState, ...updates };
  return getMockState();
};

/**
 * Check if mock mode is enabled
 * @returns {boolean} Mock mode status
 */
export const isMockMode = () => getMockState().mockMode;

/**
 * Enable or disable mock mode
 * @param {boolean} enabled - Mock mode status
 * @returns {object} Updated state
 */
export const setMockMode = (enabled) => updateMockState({ mockMode: enabled });

/**
 * Generate a unique mock issue key
 * @returns {string} Mock issue key
 */
export const generateMockIssueKey = () => {
  const state = getMockState();
  const newCounter = state.mockIssueCounter + 1;
  updateMockState({ mockIssueCounter: newCounter });
  return `MOCK-${newCounter}`;
};

/**
 * Create a new mock issue
 * @param {object} issueData - Issue creation data
 * @returns {Promise<object>} Created issue response
 */
export const createIssue = async (issueData) => {
  if (!isMockMode()) {
    throw new Error('Mock mode is not enabled');
  }

  const validation = validateIssueData(issueData);
  if (!validation.isValid) {
    return createErrorResponse('badRequest');
  }

  const issueKey = generateMockIssueKey();
  const state = getMockState();
  const issueId = (parseInt(state.mockIssueCounter, 10) + 10000).toString();

  const mockIssue = buildMockIssue(issueData, issueKey, issueId);

  const newCreatedIssues = new Map(state.createdIssues);
  newCreatedIssues.set(issueKey, mockIssue);
  updateMockState({ createdIssues: newCreatedIssues });

  return {
    success: true,
    data: mockIssue,
  };
};

/**
 * Get issue by key
 * @param {string} issueKey - Issue key
 * @param {Array} expand - Expand parameters
 * @returns {Promise<object>} Issue response
 */
export const getIssue = async (issueKey, expand = []) => {
  if (!isMockMode()) {
    throw new Error('Mock mode is not enabled');
  }

  const state = getMockState();

  if (state.createdIssues.has(issueKey)) {
    const issue = state.createdIssues.get(issueKey);
    return {
      success: true,
      data: expandIssueData(issue, expand, state.comments, state.attachments),
    };
  }

  if (issueKey.startsWith('MOCK-')) {
    const issue = getPredefinedMockIssue(issueKey);
    return {
      success: true,
      data: expandIssueData(issue, expand, state.comments, state.attachments),
    };
  }

  return createErrorResponse('notFound');
};

/**
 * Filter issues based on JQL
 * @param {Array} issues - Array of issues
 * @param {string} jql - JQL query string
 * @returns {Array} Filtered issues
 */
export const filterIssuesByJQL = (issues, jql) => {
  let filteredIssues = [...issues];
  
  if (jql.includes('project = ')) {
    const projectMatch = jql.match(/project\s*=\s*["']?([^"'\s]+)["']?/i);
    if (projectMatch) {
      const [, projectKey] = projectMatch;
      filteredIssues = filteredIssues.filter(issue => 
        issue.fields.project.key === projectKey,
      );
    }
  }

  if (jql.includes('status = ')) {
    const statusMatch = jql.match(/status\s*=\s*["']?([^"'\s]+)["']?/i);
    if (statusMatch) {
      const [, statusName] = statusMatch;
      filteredIssues = filteredIssues.filter(issue => 
        issue.fields.status.name.toLowerCase() === statusName.toLowerCase(),
      );
    }
  }

  return filteredIssues;
};

/**
 * Search issues with JQL
 * @param {string} jql - JQL query
 * @param {number} startAt - Start index
 * @param {number} maxResults - Maximum results
 * @param {Array} expand - Expand parameters
 * @returns {Promise<object>} Search response
 */
export const searchIssues = async (jql, startAt = 0, maxResults = 50, expand = []) => {
  if (!isMockMode()) {
    throw new Error('Mock mode is not enabled');
  }

  const state = getMockState();
  const allIssues = [
    ...Array.from(state.createdIssues.values()),
    mockIssueGetResponse,
  ];

  const filteredIssues = filterIssuesByJQL(allIssues, jql);
  const paginatedIssues = filteredIssues.slice(startAt, startAt + maxResults);

  return {
    success: true,
    data: {
      ...mockSearchResponse,
      startAt,
      maxResults,
      total: filteredIssues.length,
      issues: paginatedIssues.map(issue => 
        expandIssueData(issue, expand, state.comments, state.attachments),
      ),
    },
  };
};

/**
 * Update issue
 * @param {string} issueKey - Issue key
 * @param {object} updateData - Update data
 * @returns {Promise<object>} Update response
 */
export const updateIssue = async (issueKey, updateData) => {
  if (!isMockMode()) {
    throw new Error('Mock mode is not enabled');
  }

  const state = getMockState();

  if (!state.createdIssues.has(issueKey) && !issueKey.startsWith('MOCK-')) {
    return createErrorResponse('notFound');
  }

  if (state.createdIssues.has(issueKey)) {
    const issue = { ...state.createdIssues.get(issueKey) };
    
    if (updateData.fields) {
      issue.fields = {
        ...issue.fields,
        ...updateData.fields,
        updated: new Date().toISOString(),
      };
    }
    
    const newCreatedIssues = new Map(state.createdIssues);
    newCreatedIssues.set(issueKey, issue);
    updateMockState({ createdIssues: newCreatedIssues });
  }

  return {
    success: true,
    data: { message: 'Issue updated successfully' },
  };
};

/**
 * Delete issue
 * @param {string} issueKey - Issue key
 * @returns {Promise<object>} Delete response
 */
export const deleteIssue = async (issueKey) => {
  if (!isMockMode()) {
    throw new Error('Mock mode is not enabled');
  }

  const state = getMockState();
  
  if (state.createdIssues.has(issueKey)) {
    const newCreatedIssues = new Map(state.createdIssues);
    newCreatedIssues.delete(issueKey);
    updateMockState({ createdIssues: newCreatedIssues });
  }

  return {
    success: true,
    data: { message: 'Issue deleted successfully' },
  };
};

/**
 * Add comment to issue
 * @param {string} issueKey - Issue key
 * @param {object} commentData - Comment data
 * @returns {Promise<object>} Comment response
 */
export const addComment = async (issueKey, commentData) => {
  if (!isMockMode()) {
    throw new Error('Mock mode is not enabled');
  }

  const state = getMockState();
  const commentId = Date.now().toString();
  const comment = {
    self: `https://mock-jira.atlassian.net/rest/api/2/issue/${issueKey}/comment/${commentId}`,
    id: commentId,
    author: mockUsers['mock-reporter-id'],
    body: commentData.body,
    updateAuthor: mockUsers['mock-reporter-id'],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };

  const newComments = new Map(state.comments);
  const issueComments = newComments.get(issueKey) || [];
  newComments.set(issueKey, [...issueComments, comment]);
  updateMockState({ comments: newComments });

  return {
    success: true,
    data: comment,
  };
};

/**
 * Get comments for issue
 * @param {string} issueKey - Issue key
 * @returns {Promise<object>} Comments response
 */
export const getComments = async (issueKey) => {
  if (!isMockMode()) {
    throw new Error('Mock mode is not enabled');
  }

  const state = getMockState();
  const comments = state.comments.get(issueKey) || [];

  return {
    success: true,
    data: {
      startAt: 0,
      maxResults: 50,
      total: comments.length,
      comments,
    },
  };
};
