import templateDbService from '../../../services/templateDbService.js';
import * as Template from '../models/template.js';
import * as TemplateSettings from '../models/template-settings.js';
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
    return templates.map(template => Template.fromDb(template));
  } catch (error) {
    logger.error('Error getting all templates:', error);
    throw error;
  }
}

export async function getTemplatesByType(issueType) {
  try {
    const templates = await templateDbService.getTemplatesByType(issueType);
    return templates.map(template => Template.fromDb(template));
  } catch (error) {
    logger.error('Error getting templates by type:', error);
    throw error;
  }
}

export async function getActiveTemplate(issueType) {
  try {
    const template = await templateDbService.getActiveTemplate(issueType);
    return template ? Template.fromDb(template) : null;
  } catch (error) {
    logger.error('Error getting active template:', error);
    throw error;
  }
}

export async function createTemplate(templateData) {
  try {
    Template.validateTemplate(templateData);
    const template = Template.createTemplate(templateData);
    const created = await templateDbService.createTemplate(Template.toDbFormat(template));
    return Template.fromDb(created);
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
    let template = Template.fromDb(existingTemplate);
    if (!Template.canBeModified(template)) {
      throw new Error('Cannot modify default templates');
    }
    template = Template.updateTemplate(template, updates);
    Template.validateTemplate(template);
    const updated = await templateDbService.updateTemplate(id, Template.toDbFormat(template));
    return Template.fromDb(updated);
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
    const template = Template.fromDb(existingTemplate);
    if (!Template.canBeDeleted(template)) {
      throw new Error('Cannot delete default templates');
    }
    const deleted = await templateDbService.deleteTemplate(id);
    return Template.fromDb(deleted);
  } catch (error) {
    logger.error('Error deleting template:', error);
    throw error;
  }
}

export async function setActiveTemplate(issueType, templateId) {
  try {
    const updated = await templateDbService.setActiveTemplate(issueType, templateId);
    return Template.fromDb(updated);
  } catch (error) {
    logger.error('Error setting active template:', error);
    throw error;
  }
}

export async function getSettings() {
  try {
    const settings = await templateDbService.getSettings();
    return TemplateSettings.fromDb(settings);
  } catch (error) {
    logger.error('Error getting settings:', error);
    throw error;
  }
}

export async function updateSettings(updates) {
  try {
    TemplateSettings.validateSettings(updates);
    const updated = await templateDbService.updateSettings(updates);
    return TemplateSettings.fromDb(updated);
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
    const templates = imported.map(template => Template.fromDb(template));
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
    const template = Template.fromDb(originalTemplate);
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
