import templateDbService from '../../../services/templateDbService.js';
import Template from '../models/template.js';
import TemplateSettings from '../models/template-settings.js';
import logger from '../../../logger.js';

/**
 * Database service for template operations
 */
class TemplateDatabaseService {
  /**
   * Initialize the database service
   */
  static async init() {
    try {
      await templateDbService.init();
      logger.info('Template database service initialized');
    } catch (error) {
      logger.error('Failed to initialize template database service:', error);
      throw error;
    }
  }

  /**
   * Get all templates
   * @returns {Promise<Template[]>} Array of template instances
   */
  static async getAllTemplates() {
    try {
      const templates = await templateDbService.getAllTemplates();
      return templates.map(template => Template.fromDb(template));
    } catch (error) {
      logger.error('Error getting all templates:', error);
      throw error;
    }
  }

  /**
   * Get templates by issue type
   * @param {string} issueType - Issue type to filter by
   * @returns {Promise<Template[]>} Array of template instances
   */
  static async getTemplatesByType(issueType) {
    try {
      const templates = await templateDbService.getTemplatesByType(issueType);
      return templates.map(template => Template.fromDb(template));
    } catch (error) {
      logger.error('Error getting templates by type:', error);
      throw error;
    }
  }

  /**
   * Get active template for issue type
   * @param {string} issueType - Issue type
   * @returns {Promise<Template|null>} Active template or null
   */
  static async getActiveTemplate(issueType) {
    try {
      const template = await templateDbService.getActiveTemplate(issueType);
      return template ? Template.fromDb(template) : null;
    } catch (error) {
      logger.error('Error getting active template:', error);
      throw error;
    }
  }

  /**
   * Create a new template
   * @param {Object} templateData - Template data
   * @returns {Promise<Template>} Created template instance
   */
  static async createTemplate(templateData) {
    try {
      Template.validate(templateData);
      const template = new Template(templateData);
      const created = await templateDbService.createTemplate(
        template.toDbFormat(),
      );
      return Template.fromDb(created);
    } catch (error) {
      logger.error('Error creating template:', error);
      throw error;
    }
  }

  /**
   * Update a template
   * @param {string} id - Template ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Template>} Updated template instance
   */
  static async updateTemplate(id, updates) {
    try {
      // Get existing template first
      const templates = await templateDbService.getAllTemplates();
      const existingTemplate = templates.find(t => t.id === id);

      if (!existingTemplate) {
        throw new Error(`Template with ID ${id} not found`);
      }

      const template = Template.fromDb(existingTemplate);

      if (!template.canBeModified()) {
        throw new Error('Cannot modify default templates');
      }

      template.update(updates);
      Template.validate(template);

      const updated = await templateDbService.updateTemplate(
        id,
        template.toDbFormat(),
      );
      return Template.fromDb(updated);
    } catch (error) {
      logger.error('Error updating template:', error);
      throw error;
    }
  }

  /**
   * Delete a template
   * @param {string} id - Template ID
   * @returns {Promise<Template>} Deleted template instance
   */
  static async deleteTemplate(id) {
    try {
      const templates = await templateDbService.getAllTemplates();
      const existingTemplate = templates.find(t => t.id === id);

      if (!existingTemplate) {
        throw new Error(`Template with ID ${id} not found`);
      }

      const template = Template.fromDb(existingTemplate);

      if (!template.canBeDeleted()) {
        throw new Error('Cannot delete default templates');
      }

      const deleted = await templateDbService.deleteTemplate(id);
      return Template.fromDb(deleted);
    } catch (error) {
      logger.error('Error deleting template:', error);
      throw error;
    }
  }

  /**
   * Set active template for issue type
   * @param {string} issueType - Issue type
   * @param {string} templateId - Template ID
   * @returns {Promise<Template>} Updated template instance
   */
  static async setActiveTemplate(issueType, templateId) {
    try {
      const updated = await templateDbService.setActiveTemplate(
        issueType,
        templateId,
      );
      return Template.fromDb(updated);
    } catch (error) {
      logger.error('Error setting active template:', error);
      throw error;
    }
  }

  /**
   * Get template settings
   * @returns {Promise<TemplateSettings>} Settings instance
   */
  static async getSettings() {
    try {
      const settings = await templateDbService.getSettings();
      return TemplateSettings.fromDb(settings);
    } catch (error) {
      logger.error('Error getting settings:', error);
      throw error;
    }
  }

  /**
   * Update template settings
   * @param {Object} updates - Settings updates
   * @returns {Promise<TemplateSettings>} Updated settings instance
   */
  static async updateSettings(updates) {
    try {
      TemplateSettings.validate(updates);
      const updated = await templateDbService.updateSettings(updates);
      return TemplateSettings.fromDb(updated);
    } catch (error) {
      logger.error('Error updating settings:', error);
      throw error;
    }
  }

  /**
   * Reset templates to defaults
   * @returns {Promise<Object>} Reset operation result
   */
  static async resetToDefaults() {
    try {
      const result = await templateDbService.resetToDefaults();
      logger.info('Templates reset to defaults');
      return result;
    } catch (error) {
      logger.error('Error resetting to defaults:', error);
      throw error;
    }
  }

  /**
   * Export user templates
   * @returns {Promise<Object>} Export data
   */
  static async exportTemplates() {
    try {
      const exportData = await templateDbService.exportTemplates();
      logger.info('Templates exported successfully');
      return exportData;
    } catch (error) {
      logger.error('Error exporting templates:', error);
      throw error;
    }
  }

  /**
   * Import templates
   * @param {Object} importData - Import data
   * @returns {Promise<Template[]>} Imported template instances
   */
  static async importTemplates(importData) {
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

  /**
   * Duplicate a template
   * @param {string} id - Template ID to duplicate
   * @param {string} newName - Name for the duplicate
   * @returns {Promise<Template>} Duplicated template instance
   */
  static async duplicateTemplate(id, newName) {
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

      return await this.createTemplate(duplicateData);
    } catch (error) {
      logger.error('Error duplicating template:', error);
      throw error;
    }
  }
}

export default TemplateDatabaseService;
