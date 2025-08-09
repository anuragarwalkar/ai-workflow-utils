import * as Template from '../models/template.js';
import * as TemplateSettings from '../models/template-settings.js';
import logger from '../../../logger.js';

export function validateTemplateCreation(data) {
  try {
    Template.validateTemplate(data);
  } catch (error) {
    logger.warn('Template creation validation failed:', error.message);
    throw error;
  }
}

export function validateTemplateUpdate(updates, existingTemplate) {
  try {
    if (!Template.canBeModified(existingTemplate)) {
      throw new Error('Cannot modify default templates');
    }
    const tempData = {
      ...Template.toDbFormat(existingTemplate),
      ...updates,
    };
    Template.validateTemplate(tempData);
  } catch (error) {
    logger.warn('Template update validation failed:', error.message);
    throw error;
  }
}

export function validateTemplateDeletion(template) {
  try {
    if (!Template.canBeDeleted(template)) {
      throw new Error('Cannot delete default templates');
    }
  } catch (error) {
    logger.warn('Template deletion validation failed:', error.message);
    throw error;
  }
}

export function validateSettingsUpdate(updates) {
  try {
    TemplateSettings.validateSettings(updates);
  } catch (error) {
    logger.warn('Settings update validation failed:', error.message);
    throw error;
  }
}

export function validateImportData(importData) {
  try {
    if (!importData || typeof importData !== 'object') {
      throw new Error('Invalid import data format');
    }
    if (!Array.isArray(importData.templates)) {
      throw new Error('Import data must contain a templates array');
    }
    importData.templates.forEach((templateData, index) => {
      try {
        Template.validateTemplate(templateData);
      } catch (error) {
        throw new Error(`Invalid template at index ${index}: ${error.message}`);
      }
    });
    if (importData.settings) {
      TemplateSettings.validateSettings(importData.settings);
    }
  } catch (error) {
    logger.warn('Import data validation failed:', error.message);
    throw error;
  }
}

export function validateTemplateDuplication(id, newName) {
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

export function validateActiveTemplateSet(issueType, templateId) {
  try {
    if (!issueType || typeof issueType !== 'string') {
      throw new Error('Invalid issue type');
    }
    if (!templateId || typeof templateId !== 'string') {
      throw new Error('Invalid template ID');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(issueType)) {
      throw new Error('Issue type can only contain letters, numbers, underscores, and hyphens');
    }
  } catch (error) {
    logger.warn('Active template setting validation failed:', error.message);
    throw error;
  }
}

export function validateIssueTypeParameter(issueType) {
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

export function validateTemplateIdParameter(id) {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid template ID parameter');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      throw new Error('Template ID must contain only alphanumeric characters, dashes, and underscores');
    }
    if (id.length < 3) {
      throw new Error('Template ID must be at least 3 characters long');
    }
    if (id.length > 100) {
      throw new Error('Template ID must be less than 100 characters long');
    }
  } catch (error) {
    logger.warn('Template ID parameter validation failed:', error.message);
    throw error;
  }
}
