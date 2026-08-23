/**
 * Jira Custom Field service for metadata and field information retrieval
 */

import axios from 'axios';
import { EnvironmentConfig } from '../utils/environment-config.js';
import { ErrorHandler } from '../utils/error-handler.js';
import { JIRA_ENDPOINTS } from '../utils/constants.js';
import logger from '../../../logger.js';

/**
 * Format custom field data
 * @param {Object} field - Raw field data
 * @returns {Object} Formatted field data
 */
const formatCustomField = field => ({
  id: field.id,
  name: field.name,
  description: field.description || '',
  type: field.schema?.type || 'unknown',
  required: field.required || false,
  allowedValues: field.allowedValues || null,
  defaultValue: field.defaultValue || null,
  system: field.schema?.system || null,
});

/**
 * Fetch custom field values from actual Jira issues
 * @param {string} projectKey - Jira project key
 * @param {string} fieldId - Custom field ID (e.g., customfield_11400)
 * @param {number} maxResults - Maximum number of results to return
 * @returns {Promise<Object>} Field values data
 */
const fetchCustomFieldValues = async (projectKey, fieldId) => {
  try {
    const jiraUrl = EnvironmentConfig.getBaseUrl();
    const headers = EnvironmentConfig.getAuthHeaders();

    if (!jiraUrl || !headers) {
      throw new Error('Jira configuration missing');
    }

    const jql = `project=${projectKey}`;
    const fields = fieldId;

    const url = `${jiraUrl}/rest/api/2/search`;
    const params = {
      jql,
      fields,
    };

    logger.info(`Fetching custom field values for ${fieldId} in project ${projectKey}`);

    const response = await axios.get(url, {
      headers,
      params,
    });

    return {
      ...response?.data,
    };
  } catch (error) {
    logger.error(`Error fetching custom field values: ${error.message}`);
    throw ErrorHandler.createServiceError(
      `Failed to fetch custom field values: ${error.message}`,
      error.response?.status || 500
    );
  }
};

/**
 * Get safe field value with fallback
 * @param {any} value - Field value
 * @param {any} fallback - Fallback value
 * @returns {any} Safe value
 */
const getSafeValue = (value, fallback) => value || fallback;

/**
 * Process individual custom field
 * @param {string} fieldId - Field ID
 * @param {Object} field - Field data
 * @returns {Object} Processed field data
 */
const processIndividualCustomField = (fieldId, field) => ({
  id: fieldId,
  name: field.name,
  description: getSafeValue(field.description, ''),
  type: getSafeValue(field.schema?.type, 'unknown'),
  required: getSafeValue(field.required, false),
  allowedValues: getSafeValue(field.allowedValues, null),
  defaultValue: getSafeValue(field.defaultValue, null),
  system: getSafeValue(field.schema?.system, null),
  hasDefaultValue: getSafeValue(field.hasDefaultValue, false),
  operations: getSafeValue(field.operations, []),
});

/**
 * Process project custom fields
 * @param {Object} fields - Raw fields object
 * @returns {Object} Processed custom fields
 */
const processProjectCustomFields = fields => {
  const customFields = {};

  Object.keys(fields).forEach(fieldId => {
    if (!fieldId.startsWith('customfield_')) {
      return;
    }

    const field = fields[fieldId];
    customFields[fieldId] = processIndividualCustomField(fieldId, field);
  });

  return customFields;
};

/**
 * Fetch all custom fields from Jira
 * @returns {Promise<Array>} Array of custom field definitions
 */
export const fetchAllCustomFields = async () => {
  try {
    const baseUrl = EnvironmentConfig.getBaseUrl();
    const headers = EnvironmentConfig.getAuthHeaders();
    const url = `${baseUrl}${JIRA_ENDPOINTS.CUSTOM_FIELDS}`;

    logger.info('Fetching all custom fields from Jira', { url });

    const response = await axios.get(url, { headers });

    // Filter to only custom fields (they start with 'customfield_')
    const customFields = response.data.filter(field => field.id.startsWith('customfield_'));

    logger.info('Custom fields fetched successfully', {
      totalFields: response.data.length,
      customFields: customFields.length,
    });

    return customFields.map(formatCustomField);
  } catch (error) {
    logger.error('Failed to fetch custom fields', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw ErrorHandler.createServiceError(
      `Failed to fetch custom fields: ${error.response?.data?.errorMessages?.join(', ') || error.message}`,
      error.response?.status || 500
    );
  }
};

/**
 * Get create metadata from Jira API
 * @param {string} projectKey - Project key
 * @param {string} issueType - Issue type name
 * @returns {Promise<Object>} API response data
 */
const getCreateMetadata = async (projectKey, issueType) => {
  const baseUrl = EnvironmentConfig.getBaseUrl();
  const headers = EnvironmentConfig.getAuthHeaders();
  const url = `${baseUrl}${JIRA_ENDPOINTS.CREATE_META}`;
  const params = {
    projectKeys: projectKey,
    issuetypeNames: issueType,
    expand: 'projects.issuetypes.fields',
  };

  logger.info('Fetching project custom fields', {
    projectKey,
    issueType,
    url,
    params,
  });

  const response = await axios.get(url, {
    headers,
    params,
  });

  return response.data;
};

/**
 * Process create metadata response
 * @param {Object} data - API response data
 * @param {string} projectKey - Project key
 * @param {string} issueType - Issue type name
 * @returns {Object} Processed metadata
 */
const processCreateMetadata = (data, projectKey, issueType) => {
  const projects = data.projects || [];
  if (projects.length === 0) {
    logger.warn('No projects found in create metadata', { projectKey });
    return { fields: {}, issueTypes: [] };
  }

  const [project] = projects;
  const issueTypes = project.issuetypes || [];

  if (issueTypes.length === 0) {
    logger.warn('No issue types found for project', { projectKey, issueType });
    return { fields: {}, issueTypes: [] };
  }

  const targetIssueType =
    issueTypes.find(it => it.name.toLowerCase() === issueType.toLowerCase()) || issueTypes[0];

  const fields = targetIssueType.fields || {};
  const customFields = processProjectCustomFields(fields);

  return {
    projectKey,
    issueType: targetIssueType.name,
    fields: customFields,
    issueTypes: issueTypes.map(it => it.name),
  };
};

/**
 * Fetch custom fields for a specific project and issue type
 * @param {string} projectKey - Project key
 * @param {string} issueType - Issue type name
 * @returns {Promise<Object>} Create metadata for the project and issue type
 */
export const fetchProjectCustomFields = async (projectKey, issueType) => {
  try {
    const data = await getCreateMetadata(projectKey, issueType);
    const result = processCreateMetadata(data, projectKey, issueType);

    logger.info('Project custom fields fetched successfully', {
      projectKey,
      issueType,
      customFieldCount: Object.keys(result.fields).length,
    });

    return result;
  } catch (error) {
    logger.error('Failed to fetch project custom fields', {
      projectKey,
      issueType,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw ErrorHandler.createServiceError(
      `Failed to fetch project custom fields: ${error.response?.data?.errorMessages?.join(', ') || error.message}`,
      error.response?.status || 500
    );
  }
};

/**
 * Format detailed custom field data
 * @param {Object} field - Raw field data
 * @returns {Object} Formatted detailed field data
 */
const formatDetailedCustomField = field => ({
  id: field.id,
  name: field.name,
  description: getSafeValue(field.description, ''),
  type: getSafeValue(field.schema?.type, 'unknown'),
  required: getSafeValue(field.required, false),
  allowedValues: getSafeValue(field.allowedValues, null),
  defaultValue: getSafeValue(field.defaultValue, null),
  system: getSafeValue(field.schema?.system, null),
  searcherKey: getSafeValue(field.searcherKey, null),
  numericId: getSafeValue(field.numericId, null),
  isLocked: getSafeValue(field.isLocked, false),
  isUnscreenable: getSafeValue(field.isUnscreenable, false),
});

/**
 * Get detailed information about a specific custom field
 * @param {string} customFieldId - Custom field ID (e.g., 'customfield_10006')
 * @returns {Promise<Object>} Detailed custom field information
 */
export const getCustomFieldDetails = async customFieldId => {
  try {
    const baseUrl = EnvironmentConfig.getBaseUrl();
    const headers = EnvironmentConfig.getAuthHeaders();
    const url = `${baseUrl}${JIRA_ENDPOINTS.CUSTOM_FIELDS}/${customFieldId}`;

    logger.info('Fetching custom field details', { customFieldId, url });

    const response = await axios.get(url, { headers });
    const field = response.data;

    logger.info('Custom field details fetched successfully', {
      customFieldId,
      name: field.name,
      type: field.schema?.type,
    });

    return formatDetailedCustomField(field);
  } catch (error) {
    logger.error('Failed to fetch custom field details', {
      customFieldId,
      error: error.message,
      status: error.response?.status,
    });
    throw ErrorHandler.createServiceError(
      `Failed to fetch custom field details: ${error.message}`,
      error.response?.status || 500
    );
  }
};

/**
 * Export all functions for backward compatibility
 */
export const JiraCustomFieldService = {
  fetchAllCustomFields,
  fetchProjectCustomFields,
  getCustomFieldDetails,
  fetchCustomFieldValues,
};

export default JiraCustomFieldService;
