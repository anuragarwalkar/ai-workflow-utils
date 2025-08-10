/**
 * Jira Mocking Service - Extended Functions
 * Contains metadata and transition operations
 */

import { mockProjectMetadata } from './mock-metadata.js';
import {
  getCreateMetaData,
  getStatusByTransitionId,
  getTransitionsData,
} from './metadata-helpers.js';
import { getMockState, isMockMode, updateMockState } from './jira-mocking-service-core.js';

/**
 * Get project metadata
 * @param {string} _projectKey - Project key (unused in mock)
 * @returns {Promise<object>} Project metadata response
 */
export const getProjectMetadata = async (_projectKey) => {
  if (!isMockMode()) {
    throw new Error('Mock mode is not enabled');
  }

  return {
    success: true,
    data: {
      ...mockProjectMetadata,
      key: _projectKey || mockProjectMetadata.key,
    },
  };
};

/**
 * Get available transitions for issue
 * @param {string} _issueKey - Issue key (unused in mock)
 * @returns {Promise<object>} Transitions response
 */
export const getTransitions = async (_issueKey) => {
  if (!isMockMode()) {
    throw new Error('Mock mode is not enabled');
  }

  return {
    success: true,
    data: getTransitionsData(),
  };
};

/**
 * Execute transition on issue
 * @param {string} issueKey - Issue key
 * @param {object} transitionData - Transition data
 * @returns {Promise<object>} Transition response
 */
export const doTransition = async (issueKey, transitionData) => {
  if (!isMockMode()) {
    throw new Error('Mock mode is not enabled');
  }

  const state = getMockState();

  if (state.createdIssues.has(issueKey)) {
    const issue = { ...state.createdIssues.get(issueKey) };
    const newStatus = getStatusByTransitionId(transitionData.transition?.id);
    
    if (newStatus) {
      issue.fields = {
        ...issue.fields,
        status: newStatus,
        updated: new Date().toISOString(),
      };
      
      const newCreatedIssues = new Map(state.createdIssues);
      newCreatedIssues.set(issueKey, issue);
      updateMockState({ createdIssues: newCreatedIssues });
    }
  }

  return {
    success: true,
    data: { message: 'Transition completed successfully' },
  };
};

/**
 * Get create metadata for project
 * @param {string} _projectKey - Project key (unused in mock)
 * @param {string} _issueTypeId - Issue type ID (unused in mock)
 * @returns {Promise<object>} Create meta response
 */
export const getCreateMeta = async (_projectKey, _issueTypeId) => {
  if (!isMockMode()) {
    throw new Error('Mock mode is not enabled');
  }

  return {
    success: true,
    data: getCreateMetaData(),
  };
};

/**
 * Simulate network delay
 * @param {number} ms - Delay in milliseconds
 * @returns {Promise<void>} Promise that resolves after delay
 */
export const simulateDelay = async (ms = 100) => {
  if (isMockMode()) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }
};
