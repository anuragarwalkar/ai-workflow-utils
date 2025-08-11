/**
 * Jira API service for external API interactions
 * Supports both real API calls and mock mode for testing
 * Uses nock-based mocking system for HTTP request interception
 */

import axios from 'axios';
import { EnvironmentConfig } from '../utils/environment-config.js';
import { ErrorHandler } from '../utils/error-handler.js';
import { JIRA_ENDPOINTS } from '../utils/constants.js';
import logger from '../../../logger.js';
import { JiraIssue } from '../models/jira-issue.js';

/**
 * Handle Jira issue creation request
 * @param {Object} payload - Jira issue payload
 * @param {string} url - API URL
 * @param {Object} headers - Request headers
 * @returns {Promise<Object>} Created issue data
 */
const performIssueCreation = async (payload, url, headers) => {
  const jiraPayload = new JiraIssue(payload);
  const response = await axios.post(url, jiraPayload.toJiraPayload(), {
    headers,
  });

  logger.info('Jira issue created successfully', {
    issueKey: response.data.key,
    issueId: response.data.id,
  });

  return response?.data;
};

/**
 * Handle Jira issue creation error
 * @param {Error} error - Error object
 * @throws {Error} Service error
 */
const handleIssueCreationError = (error) => {
  logger.error('Failed to create Jira issue', {
    error: error.message,
    status: error.response?.status,
    data: error.response?.data,
  });
  throw ErrorHandler.createServiceError(
    `Failed to create Jira issue: ${error.response?.data?.errorMessages?.join(', ') || error.message}`,
    error.response?.status || 500,
  );
};

/**
 * Create a Jira issue
 * @param {Object} payload - Jira issue payload
 * @returns {Promise<Object>} Created issue data
 */
export const createIssue = async (payload) => {
  try {
    const baseUrl = EnvironmentConfig.getBaseUrl();
    const headers = EnvironmentConfig.getAuthHeaders();
    const url = `${baseUrl}${JIRA_ENDPOINTS.ISSUE}`;

    logger.info('Creating Jira issue', { url });

    return await performIssueCreation(payload, url, headers);
  } catch (error) {
    handleIssueCreationError(error);
  }
};

/**
 * Fetch a single Jira issue
 * @param {string} issueId - Issue ID or key
 * @returns {Promise<Object>} Issue data
 */
export const fetchIssue = async (issueId) => {
  try {
    const baseUrl = EnvironmentConfig.getBaseUrl();
    const headers = EnvironmentConfig.getAuthHeaders();
    const url = `${baseUrl}${JIRA_ENDPOINTS.ISSUE}/${issueId}`;

    logger.info('Fetching Jira issue', { issueId, url });

    const response = await axios.get(url, { headers });

    logger.info('Jira issue fetched successfully', {
      issueKey: response.data.key,
      summary: response.data.fields?.summary,
    });

    return response.data;
  } catch (error) {
    logger.error('Failed to fetch Jira issue', {
      issueId,
      error: error.message,
      status: error.response?.status,
    });
    throw ErrorHandler.createServiceError(
      `Failed to fetch Jira issue: ${error.message}`,
      error.response?.status || 500,
    );
  }
};

/**
 * Upload attachment to Jira issue
 * @param {string} issueKey - Issue key
 * @param {Object} formData - FormData with file
 * @returns {Promise<Object>} Upload response
 */
export const uploadAttachment = async (issueKey, formData) => {
  try {
    const baseUrl = EnvironmentConfig.getBaseUrl();
    const attachmentHeaders = EnvironmentConfig.getAttachmentHeaders();
    const url = `${baseUrl}${JIRA_ENDPOINTS.ATTACHMENTS(issueKey)}`;

    // Merge form data headers with authentication headers
    const headers = {
      ...attachmentHeaders,
      ...formData.getHeaders(),
    };

    logger.info('Uploading attachment to Jira issue', { issueKey, url });

    const response = await axios.post(url, formData, { headers });

    logger.info('Attachment uploaded successfully', {
      issueKey,
      attachmentCount: response.data?.length || 0,
    });

    return response.data;
  } catch (error) {
    logger.error('Failed to upload attachment', {
      issueKey,
      error: error.message,
      status: error.response?.status,
    });
    throw ErrorHandler.createServiceError(
      `Failed to upload attachment: ${error.message}`,
      error.response?.status || 500,
    );
  }
};

/**
 * Search for Jira issues using JQL
 * @param {string} jql - JQL query string
 * @param {Array<string>} fields - Fields to include in response
 * @param {number} maxResults - Maximum number of results
 * @returns {Promise<Object>} Search results
 */
export const searchIssues = async (jql, fields = ['summary'], maxResults = 50) => {
  try {
    const baseUrl = EnvironmentConfig.getBaseUrl();
    const headers = EnvironmentConfig.getAuthHeaders();

    const params = new URLSearchParams({
      jql,
      fields: fields.join(','),
      maxResults: maxResults.toString(),
    });

    const url = `${baseUrl}${JIRA_ENDPOINTS.SEARCH}?${params}`;

    logger.info('Searching Jira issues', { jql, fields, maxResults });

    const response = await axios.get(url, { headers });

    logger.info('Jira search completed', {
      totalResults: response.data.total,
      returnedResults: response.data.issues?.length || 0,
    });

    return response.data;
  } catch (error) {
    logger.error('Failed to search Jira issues', {
      jql,
      error: error.message,
      status: error.response?.status,
    });
    throw ErrorHandler.createServiceError(
      `Failed to search Jira issues: ${error.message}`,
      error.response?.status || 500,
    );
  }
};

/**
 * Fetch summaries for multiple issues
 * @param {Array<string>} issueKeys - Array of issue keys
 * @returns {Promise<Object>} Map of issue key to summary
 */
export const fetchIssueSummaries = async (issueKeys) => {
  try {
    if (!issueKeys || issueKeys.length === 0) {
      return {};
    }

    const jql = `issueKey in (${issueKeys.join(',')})`;
    const searchResult = await searchIssues(
      jql,
      ['summary'],
      issueKeys.length,
    );

    const summariesMap = {};
    if (searchResult.issues) {
      searchResult.issues.forEach(issue => {
        summariesMap[issue.key] = issue.fields.summary;
      });
    }

    logger.info('Fetched issue summaries', {
      requestedCount: issueKeys.length,
      foundCount: Object.keys(summariesMap).length,
    });

    return summariesMap;
  } catch (error) {
    logger.error('Failed to fetch issue summaries', {
      issueKeys,
      error: error.message,
    });
    // Return empty object instead of throwing, to gracefully handle failures
    return {};
  }
};

/**
 * Test Jira connection
 * @returns {Promise<boolean>} True if connection successful
 */
export const testConnection = async () => {
  try {
    const baseUrl = EnvironmentConfig.getBaseUrl();
    const headers = EnvironmentConfig.getAuthHeaders();
    const url = `${baseUrl}/rest/api/2/myself`;

    await axios.get(url, { headers });
    return true;
  } catch (error) {
    logger.error('Jira connection test failed', { error: error.message });
    return false;
  }
};
