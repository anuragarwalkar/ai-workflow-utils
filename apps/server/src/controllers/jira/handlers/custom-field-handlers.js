/**
 * Jira Custom Field Handlers - Express route handlers for custom field operations
 */

import logger from '../../../logger.js';
import { withExpressErrorHandling } from '../../../utils/error-handling.js';
import { JiraCustomFieldService } from '../services/jira-custom-field-service.js';

// ============================================================================
// PURE BUSINESS LOGIC FUNCTIONS
// ============================================================================

/**
 * Core function for fetching all custom fields
 * @returns {Promise<Array>} Array of custom field definitions
 */
const fetchAllCustomFieldsCore = async () => {
  return await JiraCustomFieldService.fetchAllCustomFields();
};

/**
 * Core function for fetching custom field values from issues
 * @param {string} projectKey - Project key
 * @param {string} fieldId - Custom field ID
 * @param {number} maxResults - Maximum results
 * @returns {Promise<Object>} Custom field values data
 */
const fetchCustomFieldValuesCore = async (projectKey, fieldId, maxResults = 50) => {
  return await JiraCustomFieldService.fetchCustomFieldValues(projectKey, fieldId, maxResults);
};

/**
 * Core function for fetching project custom fields
 * @param {string} projectKey - Project key
 * @param {string} issueType - Issue type name
 * @returns {Promise<Object>} Project custom fields metadata
 */
const fetchProjectCustomFieldsCore = async (projectKey, issueType) => {
  return await JiraCustomFieldService.fetchProjectCustomFields(projectKey, issueType);
};

/**
 * Core function for getting custom field details
 * @param {string} customFieldId - Custom field ID
 * @returns {Promise<Object>} Custom field details
 */
const getCustomFieldDetailsCore = async customFieldId => {
  return await JiraCustomFieldService.getCustomFieldDetails(customFieldId);
};

// ============================================================================
// EXPRESS HANDLERS (HTTP REQUEST/RESPONSE)
// ============================================================================

/**
 * Express handler for fetching all custom fields
 */
export const fetchAllCustomFieldsHandler = withExpressErrorHandling(async (req, res) => {
  logger.info('Fetching all custom fields');

  const customFields = await fetchAllCustomFieldsCore();

  res.json({
    success: true,
    data: customFields,
    count: customFields.length,
  });
}, 'fetchAllCustomFieldsHandler');

/**
 * Express handler for fetching project-specific custom fields
 */
export const fetchProjectCustomFieldsHandler = withExpressErrorHandling(async (req, res) => {
  const { projectKey } = req.params;
  const { issueType = 'Task' } = req.query;

  if (!projectKey) {
    return res.status(400).json({
      success: false,
      error: 'projectKey is required',
    });
  }

  logger.info('Fetching project custom fields', { projectKey, issueType });

  const result = await fetchProjectCustomFieldsCore(projectKey, issueType);

  res.json({
    success: true,
    data: result,
  });
}, 'fetchProjectCustomFieldsHandler');

/**
 * Express handler for getting custom field details
 */
export const getCustomFieldDetailsHandler = withExpressErrorHandling(async (req, res) => {
  const { fieldId } = req.params;

  if (!fieldId) {
    return res.status(400).json({
      success: false,
      error: 'fieldId is required',
    });
  }

  logger.info('Getting custom field details', { fieldId });

  const fieldDetails = await getCustomFieldDetailsCore(fieldId);

  res.json({
    success: true,
    data: fieldDetails,
  });
}, 'getCustomFieldDetailsHandler');

// ============================================================================
// PURE FUNCTIONS (BUSINESS LOGIC EXPORTS)
// ============================================================================

/**
 * Fetch all custom fields (pure function)
 * @returns {Promise<Array>} Array of custom field definitions
 */
export const fetchAllCustomFields = fetchAllCustomFieldsCore;

/**
 * Fetch project custom fields (pure function)
 * @param {string} projectKey - Project key
 * @param {string} issueType - Issue type name
 * @returns {Promise<Object>} Project custom fields metadata
 */
export const fetchProjectCustomFields = fetchProjectCustomFieldsCore;

/**
 * Get custom field details (pure function)
 * @param {string} customFieldId - Custom field ID
 * @returns {Promise<Object>} Custom field details
 */
export const getCustomFieldDetails = getCustomFieldDetailsCore;

/**
 * Fetch custom field values from issues (pure function)
 * @param {string} projectKey - Project key
 * @param {string} fieldId - Custom field ID
 * @param {number} maxResults - Maximum results
 * @returns {Promise<Object>} Custom field values data
 */
export const fetchCustomFieldValues = fetchCustomFieldValuesCore;

// ============================================================================
// EXPRESS HANDLERS
// ============================================================================

/**
 * Express handler for fetching custom field values
 * GET /api/jira/custom-fields/:fieldId/values/:projectKey
 */
export const fetchCustomFieldValuesHandler = withExpressErrorHandling(async (req, res) => {
  const { fieldId, projectKey } = req.params;

  logger.info(`Fetching custom field values for ${fieldId} in project ${projectKey}`);

  const result = await fetchCustomFieldValuesCore(projectKey, fieldId);

  res.json({
    success: true,
    data: result,
  });
}, 'fetchCustomFieldValuesHandler');
