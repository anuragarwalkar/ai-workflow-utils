/**
 * Jira Issue data model and validation
 */

import { ValidationUtils } from '../utils/validation-utils.js';
import { ISSUE_TYPE_MAPPING, PRIORITY_LEVELS } from '../utils/constants.js';

export class JiraIssue {
  constructor(data) {
    this.summary = data.summary;
    this.description = data.description;
    this.issueType = data.issueType;
    this.priority = data.priority || PRIORITY_LEVELS.MEDIUM;
    this.projectType = data.projectType;
    this.customFields = data.customFields || [];
  }

  /**
   * Validate issue data
   * @param {Object} data - Raw issue data
   * @throws {Error} If validation fails
   */
  static validate(data) {
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
  }

  /**
   * Create JiraIssue instance from request data
   * @param {Object} data - Request data
   * @returns {JiraIssue} JiraIssue instance
   */
  static fromRequest(data) {
    this.validate(data);
    return new JiraIssue(data);
  }

  /**
   * Convert to Jira API payload format
   * @returns {Object} Jira API payload
   */
  toJiraPayload() {
    // Process custom fields into Jira format
    const processedCustomFields = this.processCustomFields();

    return {
      fields: {
        project: { key: this.projectType },
        summary: this.summary,
        description: this.description,
        issuetype: { name: this.issueType },
        priority: { name: this.priority },
        ...processedCustomFields,
      },
    };
  }

  /**
   * Process custom fields for Jira API
   * @returns {Object} Processed custom fields
   */
  processCustomFields() {
    const processedFields = {};

    if (this.customFields && Array.isArray(this.customFields)) {
      this.customFields.forEach(field => {
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
  }

  /**
   * Get AI template type for this issue
   * @returns {string} Template type
   */
  getTemplateType() {
    return ISSUE_TYPE_MAPPING[this.issueType] || ISSUE_TYPE_MAPPING.Task;
  }

  /**
   * Convert to plain object
   * @returns {Object} Plain object representation
   */
  toObject() {
    return {
      summary: this.summary,
      description: this.description,
      issueType: this.issueType,
      priority: this.priority,
      projectType: this.projectType,
      customFields: this.customFields,
    };
  }

  /**
   * Get display-friendly representation
   * @returns {Object} Display object
   */
  toDisplay() {
    return {
      summary: this.summary,
      issueType: this.issueType,
      priority: this.priority,
      project: this.projectType,
      customFieldsCount: this.customFields.length,
    };
  }
}
