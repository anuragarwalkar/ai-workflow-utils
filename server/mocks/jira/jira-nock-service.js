/**
 * Jira Nock Mock Service
 * Functional programming implementation using nock for HTTP request interception
 * Main service orchestrator for Jira API mocking
 */

import { createMockService } from '../core/nock-mock-service.js';
import {
  setupCommentInterceptors,
  setupIssueInterceptors,
  setupMetadataInterceptors,
  setupProjectInterceptors,
} from './jira-mock-interceptors.js';
import { 
  setupCreateMetaInterceptors, 
  setupTransitionInterceptors,
} from './jira-transition-interceptors.js';
import logger from '../../logger.js';

// Main setup function
const setupJiraInterceptors = (baseURL, config = {}) => {
  logger.info(`Setting up Jira mock interceptors for ${baseURL}`);
  
  const allInterceptors = [
    ...setupProjectInterceptors(baseURL),
    ...setupIssueInterceptors(baseURL),
    ...setupCommentInterceptors(baseURL),
    ...setupMetadataInterceptors(baseURL),
    ...setupTransitionInterceptors(baseURL),
    ...setupCreateMetaInterceptors(baseURL),
  ];

  // Add any custom interceptors from config
  if (config.customInterceptors) {
    allInterceptors.push(...config.customInterceptors);
  }

  logger.info(`Jira mock service: ${allInterceptors.length} interceptors active`);
  return allInterceptors;
};

// Export the Jira mock service
export const jiraMockService = createMockService(
  'jira',
  'https://mock-jira.atlassian.net',
  setupJiraInterceptors,
);

// Re-export everything for convenience
export * from './jira-mock-data.js';
export * from './jira-mock-helpers.js';
export * from './jira-mock-interceptors.js';
export * from './jira-transition-interceptors.js';
