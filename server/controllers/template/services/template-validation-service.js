import Template from '../models/template.js';
import TemplateSettings from '../models/template-settings.js';
import logger from '../../../logger.js';

/**
 * Validation service for template operations
 */
class TemplateValidationService {
  /**
   * Validate template creation data
   * @param {Object} data - Template data to validate
   * @throws {Error} If validation fails
   */
  static validateTemplateCreation(data) {
    try {
      Template.validate(data);
    } catch (error) {
      logger.warn('Template creation validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate template update data
   * @param {Object} updates - Update data to validate
   * @param {Template} existingTemplate - Existing template instance
   * @throws {Error} If validation fails
   */
  static validateTemplateUpdate(updates, existingTemplate) {
    try {
      // Check if template can be modified
      if (!existingTemplate.canBeModified()) {
        throw new Error('Cannot modify default templates');
      }

      // Create a temporary template with updates to validate
      const tempData = {
        ...existingTemplate.toDbFormat(),
        ...updates
      };

      Template.validate(tempData);
    } catch (error) {
      logger.warn('Template update validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate template deletion
   * @param {Template} template - Template to delete
   * @throws {Error} If validation fails
   */
  static validateTemplateDeletion(template) {
    try {
      if (!template.canBeDeleted()) {
        throw new Error('Cannot delete default templates');
      }
    } catch (error) {
      logger.warn('Template deletion validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate settings update data
   * @param {Object} updates - Settings update data
   * @throws {Error} If validation fails
   */
  static validateSettingsUpdate(updates) {
    try {
      TemplateSettings.validate(updates);
    } catch (error) {
      logger.warn('Settings update validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate import data format
   * @param {Object} importData - Data to import
   * @throws {Error} If validation fails
   */
  static validateImportData(importData) {
    try {
      if (!importData || typeof importData !== 'object') {
        throw new Error('Invalid import data format');
      }

      if (!Array.isArray(importData.templates)) {
        throw new Error('Import data must contain a templates array');
      }

      // Validate each template in the import data
      importData.templates.forEach((templateData, index) => {
        try {
          Template.validate(templateData);
        } catch (error) {
          throw new Error(`Invalid template at index ${index}: ${error.message}`);
        }
      });

      // Validate settings if present
      if (importData.settings) {
        TemplateSettings.validate(importData.settings);
      }
    } catch (error) {
      logger.warn('Import data validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate duplicate template request
   * @param {string} id - Template ID to duplicate
   * @param {string} newName - New name for duplicate
   * @throws {Error} If validation fails
   */
  static validateTemplateDuplication(id, newName) {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid template ID for duplication');
      }

      if (newName && typeof newName !== 'string') {
        throw new Error('Invalid new name for duplicate template');
      }

      if (newName && newName.length > 100) {
        throw new Error('Template name must be 100 characters or less');
      }
    } catch (error) {
      logger.warn('Template duplication validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate active template setting
   * @param {string} issueType - Issue type
   * @param {string} templateId - Template ID
   * @throws {Error} If validation fails
   */
  static validateActiveTemplateSet(issueType, templateId) {
    try {
      if (!issueType || typeof issueType !== 'string') {
        throw new Error('Invalid issue type');
      }

      if (!templateId || typeof templateId !== 'string') {
        throw new Error('Invalid template ID');
      }

      // Validate issue type format
      if (!/^[a-zA-Z0-9_-]+$/.test(issueType)) {
        throw new Error('Issue type can only contain letters, numbers, underscores, and hyphens');
      }
    } catch (error) {
      logger.warn('Active template setting validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate request parameters for getting templates by type
   * @param {string} issueType - Issue type parameter
   * @throws {Error} If validation fails
   */
  static validateIssueTypeParameter(issueType) {
    try {
      if (!issueType || typeof issueType !== 'string') {
        throw new Error('Invalid issue type parameter');
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(issueType)) {
        throw new Error('Issue type can only contain letters, numbers, underscores, and hyphens');
      }
    } catch (error) {
      logger.warn('Issue type parameter validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate template ID parameter
   * @param {string} id - Template ID parameter
   * @throws {Error} If validation fails
   */
  static validateTemplateIdParameter(id) {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid template ID parameter');
      }

      // Check if it's a valid ID format (alphanumeric, dashes, underscores)
      if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
        throw new Error('Template ID must contain only alphanumeric characters, dashes, and underscores');
      }

      // Check minimum length
      if (id.length < 3) {
        throw new Error('Template ID must be at least 3 characters long');
      }

      // Check maximum length
      if (id.length > 100) {
        throw new Error('Template ID must be less than 100 characters long');
      }
    } catch (error) {
      logger.warn('Template ID parameter validation failed:', error.message);
      throw error;
    }
  }
}

export default TemplateValidationService;
