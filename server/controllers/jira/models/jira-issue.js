/**
 * Jira Issue data model and validation
 */

import { ValidationUtils } from '../utils/validation-utils.js';
import { ISSUE_TYPE_MAPPING, PRIORITY_LEVELS } from '../utils/constants.js';

/**
 * Create a Jira issue object
 * @param {Object} data - Issue data
 * @returns {Object} Jira issue object
 */
export const createJiraIssue = (data) => {
  return {
    summary: data.summary,
    description: data.description,
    issueType: data.issueType,
    priority: data.priority || PRIORITY_LEVELS.MEDIUM,
    projectType: data.projectType,
    customFields: data.customFields || [],
  };
};

/**
 * Validate issue data
 * @param {Object} data - Raw issue data
 * @throws {Error} If validation fails
 */
export const validate = (data) => {
  const validation = ValidationUtils.validateIssueData(data);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Validate custom fields if provided
  if (data.customFields) {
    const customFieldValidation = ValidationUtils.validateCustomFields(
      data.customFields,
    );
    if (!customFieldValidation.isValid) {
      throw new Error(
        `Custom field validation failed: ${customFieldValidation.errors.join(', ')}`,
      );
    }
  }
};

/**
 * Create JiraIssue instance from request data
 * @param {Object} data - Request data
 * @returns {Object} JiraIssue instance
 */
export const fromRequest = (data) => {
  validate(data);
  return createJiraIssue(data);
};

/**
 * Convert to Jira API payload format
 * @param {Object} issue - Jira issue object
 * @returns {Object} Jira API payload
 */
export const toJiraPayload = (issue) => {
  // Process custom fields into Jira format
  const processedCustomFields = processCustomFields(issue);

  return {
    fields: {
      project: { key: issue.projectType },
      summary: issue.summary,
      description: issue.description,
      issuetype: { name: issue.issueType },
      priority: { name: issue.priority },
      ...processedCustomFields,
    },
  };
};

/**
 * Process custom fields for Jira API
 * @param {Object} issue - Jira issue object
 * @returns {Object} Processed custom fields
 */
export const processCustomFields = (issue) => {
  const processedFields = {};

  if (issue.customFields && Array.isArray(issue.customFields)) {
    issue.customFields.forEach(field => {
      if (field.key && field.value !== undefined && field.value !== null) {
        const val = field.value;

        // Check if the value is a string that looks like JSON
        const isLikelyJson =
          (typeof val === 'string' &&
            val.trim().startsWith('{') &&
            val.trim().endsWith('}')) ||
          (val.trim().startsWith('[') && val.trim().endsWith(']'));

        if (isLikelyJson) {
          try {
            // Sanitize object keys like { id: "007" }
            const sanitized = val.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
            processedFields[field.key] = JSON.parse(sanitized);
          } catch (parseError) {
            // Fallback to string if JSON parsing fails
            console.warn(
              `Failed to parse JSON for field ${field.key}:`,
              parseError.message,
            );
            processedFields[field.key] = val;
          }
        } else {
          processedFields[field.key] = val;
        }
      }
    });
  }

  return processedFields;
};

/**
 * Get AI template type for this issue
 * @param {Object} issue - Jira issue object
 * @returns {string} Template type
 */
export const getTemplateType = (issue) => {
  return ISSUE_TYPE_MAPPING[issue.issueType] || ISSUE_TYPE_MAPPING.Task;
};

/**
 * Convert to plain object
 * @param {Object} issue - Jira issue object
 * @returns {Object} Plain object representation
 */
export const toObject = (issue) => {
  return {
    summary: issue.summary,
    description: issue.description,
    issueType: issue.issueType,
    priority: issue.priority,
    projectType: issue.projectType,
    customFields: issue.customFields,
  };
};

/**
 * Get display-friendly representation
 * @param {Object} issue - Jira issue object
 * @returns {Object} Display object
 */
export const toDisplay = (issue) => {
  return {
    summary: issue.summary,
    issueType: issue.issueType,
    priority: issue.priority,
    project: issue.projectType,
    customFieldsCount: issue.customFields.length,
  };
};

// Class-like constructor function for backward compatibility
export const JiraIssue = function (data) {
  const issue = createJiraIssue(data);
  
  // Add methods to the instance
  issue.toJiraPayload = () => toJiraPayload(issue);
  issue.processCustomFields = () => processCustomFields(issue);
  issue.getTemplateType = () => getTemplateType(issue);
  issue.toObject = () => toObject(issue);
  issue.toDisplay = () => toDisplay(issue);
  
  return issue;
};

// Add static methods to the constructor function
JiraIssue.validate = validate;
JiraIssue.fromRequest = fromRequest;

// Export all functions and the constructor for backward compatibility
export default JiraIssue;
