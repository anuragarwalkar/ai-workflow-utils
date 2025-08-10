import templateDbService from '../../../services/templateDbService.js';
import {
  canBeDeleted,
  canBeModified,
  createTemplate as createTemplateModel,
  fromDb as templateFromDb,
  toDbFormat,
  updateTemplate as updateTemplateModel,
  validateTemplate,
} from '../models/template.js';
import {
  fromDb as settingsFromDb,
  validateSettings,
} from '../models/template-settings.js';
import logger from '../../../logger.js';

export async function init() {
  try {
    await templateDbService.init();
    logger.info('Template database service initialized');
  } catch (error) {
    logger.error('Failed to initialize template database service:', error);
    throw error;
  }
}

export async function getAllTemplates() {
  try {
    const templates = await templateDbService.getAllTemplates();
    return templates.map(template => templateFromDb(template));
  } catch (error) {
    logger.error('Error getting all templates:', error);
    throw error;
  }
}

export async function getTemplatesByType(issueType) {
  try {
    const templates = await templateDbService.getTemplatesByType(issueType);
    return templates.map(template => templateFromDb(template));
  } catch (error) {
    logger.error('Error getting templates by type:', error);
    throw error;
  }
}

export async function getActiveTemplate(issueType) {
  try {
    const template = await templateDbService.getActiveTemplate(issueType);
    return template ? templateFromDb(template) : null;
  } catch (error) {
    logger.error('Error getting active template:', error);
    throw error;
  }
}

export async function createTemplate(templateData) {
  try {
    validateTemplate(templateData);
    const template = createTemplateModel(templateData);
    const created = await templateDbService.createTemplate(toDbFormat(template));
    return templateFromDb(created);
  } catch (error) {
    logger.error('Error creating template:', error);
    throw error;
  }
}

export async function updateTemplate(id, updates) {
  try {
    const templates = await templateDbService.getAllTemplates();
    const existingTemplate = templates.find(t => t.id === id);
    if (!existingTemplate) {
      throw new Error(`Template with ID ${id} not found`);
    }
    let template = templateFromDb(existingTemplate);
    if (!canBeModified(template)) {
      throw new Error('Cannot modify default templates');
    }
    template = updateTemplateModel(template, updates);
    validateTemplate(template);
    const updated = await templateDbService.updateTemplate(id, toDbFormat(template));
    return templateFromDb(updated);
  } catch (error) {
    logger.error('Error updating template:', error);
    throw error;
  }
}

export async function deleteTemplate(id) {
  try {
    const templates = await templateDbService.getAllTemplates();
    const existingTemplate = templates.find(t => t.id === id);
    if (!existingTemplate) {
      throw new Error(`Template with ID ${id} not found`);
    }
    const template = templateFromDb(existingTemplate);
    if (!canBeDeleted(template)) {
      throw new Error('Cannot delete default templates');
    }
    const deleted = await templateDbService.deleteTemplate(id);
    return templateFromDb(deleted);
  } catch (error) {
    logger.error('Error deleting template:', error);
    throw error;
  }
}

export async function setActiveTemplate(issueType, templateId) {
  try {
    const updated = await templateDbService.setActiveTemplate(issueType, templateId);
    return templateFromDb(updated);
  } catch (error) {
    logger.error('Error setting active template:', error);
    throw error;
  }
}

export async function getSettings() {
  try {
    const settings = await templateDbService.getSettings();
    return settingsFromDb(settings);
  } catch (error) {
    logger.error('Error getting settings:', error);
    throw error;
  }
}

export async function updateSettings(updates) {
  try {
    validateSettings(updates);
    const updated = await templateDbService.updateSettings(updates);
    return settingsFromDb(updated);
  } catch (error) {
    logger.error('Error updating settings:', error);
    throw error;
  }
}

export async function resetToDefaults() {
  try {
    const result = await templateDbService.resetToDefaults();
    logger.info('Templates reset to defaults');
    return result;
  } catch (error) {
    logger.error('Error resetting to defaults:', error);
    throw error;
  }
}

export async function exportTemplates() {
  try {
    const exportData = await templateDbService.exportTemplates();
    logger.info('Templates exported successfully');
    return exportData;
  } catch (error) {
    logger.error('Error exporting templates:', error);
    throw error;
  }
}

export async function importTemplates(importData) {
  try {
    const imported = await templateDbService.importTemplates(importData);
    const templates = imported.map(template => templateFromDb(template));
    logger.info(`Imported ${templates.length} templates`);
    return templates;
  } catch (error) {
    logger.error('Error importing templates:', error);
    throw error;
  }
}

export async function duplicateTemplate(id, newName) {
  try {
    const templates = await templateDbService.getAllTemplates();
    const originalTemplate = templates.find(t => t.id === id);
    if (!originalTemplate) {
      throw new Error(`Template with ID ${id} not found`);
    }
    const template = templateFromDb(originalTemplate);
    const duplicateData = {
      name: newName || `${template.name} (Copy)`,
      issueType: template.issueType,
      content: template.content,
    };
    return await createTemplate(duplicateData);
  } catch (error) {
    logger.error('Error duplicating template:', error);
    throw error;
  }
}
