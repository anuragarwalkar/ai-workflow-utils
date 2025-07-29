import TemplateDatabaseService from './services/template-database-service.js';
import TemplateValidationService from './services/template-validation-service.js';
import TemplateExportImportProcessor from './processors/template-export-import-processor.js';
import TemplateErrorHandler from './utils/template-error-handler.js';
import { TEMPLATE_CONSTANTS } from './utils/constants.js';
import logger from '../../logger.js';

/**
 * Main template controller (modular version)
 * Orchestrates template operations by delegating to services and processors
 */
class TemplateController {
  /**
   * Initialize the template controller
   */
  async init() {
    try {
      await TemplateDatabaseService.init();
      logger.info('Template controller initialized');
    } catch (error) {
      TemplateErrorHandler.logError(error, 'Template controller initialization');
      throw error;
    }
  }

  /**
   * GET /api/templates - Get all templates
   */
  async getAllTemplates(req, res) {
    try {
      const templates = await TemplateDatabaseService.getAllTemplates();
      const processedTemplates = TemplateExportImportProcessor.processApiResponse(templates);

      res.json({
        success: true,
        data: processedTemplates
      });
    } catch (error) {
      TemplateErrorHandler.handleApiError(error, 'Getting all templates', res);
    }
  }

  /**
   * GET /api/templates/type/:issueType - Get templates by issue type
   */
  async getTemplatesByType(req, res) {
    try {
      const { issueType } = req.params;
      TemplateValidationService.validateIssueTypeParameter(issueType);

      const templates = await TemplateDatabaseService.getTemplatesByType(issueType);
      const processedTemplates = TemplateExportImportProcessor.processApiResponse(templates);

      res.json({
        success: true,
        data: processedTemplates
      });
    } catch (error) {
      TemplateErrorHandler.handleApiError(error, 'Getting templates by type', res);
    }
  }

  /**
   * GET /api/templates/active/:issueType - Get active template for issue type
   */
  async getActiveTemplate(req, res) {
    try {
      const { issueType } = req.params;
      TemplateValidationService.validateIssueTypeParameter(issueType);

      const template = await TemplateDatabaseService.getActiveTemplate(issueType);
      
      if (!template) {
        return res.status(TEMPLATE_CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: `No active template found for issue type: ${issueType}`
        });
      }

      res.json({
        success: true,
        data: template.toApiFormat()
      });
    } catch (error) {
      TemplateErrorHandler.handleApiError(error, 'Getting active template', res);
    }
  }

  /**
   * POST /api/templates - Create new template
   */
  async createTemplate(req, res) {
    try {
      const templateData = TemplateErrorHandler.validateInput(req.body, {
        name: { required: true, type: 'string', maxLength: TEMPLATE_CONSTANTS.MAX_NAME_LENGTH },
        issueType: { required: true, type: 'string', pattern: TEMPLATE_CONSTANTS.ISSUE_TYPE_PATTERN },
        content: { required: true, type: 'string', maxLength: TEMPLATE_CONSTANTS.MAX_CONTENT_LENGTH }
      });

      TemplateValidationService.validateTemplateCreation(templateData);

      const template = await TemplateDatabaseService.createTemplate(templateData);

      res.status(TEMPLATE_CONSTANTS.HTTP_STATUS.CREATED).json({
        success: true,
        data: template.toApiFormat(),
        message: TEMPLATE_CONSTANTS.SUCCESS_MESSAGES.TEMPLATE_CREATED
      });
    } catch (error) {
      TemplateErrorHandler.handleApiError(error, 'Creating template', res);
    }
  }

  /**
   * PUT /api/templates/:id - Update template
   */
  async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      TemplateValidationService.validateTemplateIdParameter(id);

      // Get existing template first
      const templates = await TemplateDatabaseService.getAllTemplates();
      const existingTemplate = templates.find(t => t.id === id);

      if (!existingTemplate) {
        return res.status(TEMPLATE_CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: TEMPLATE_CONSTANTS.ERROR_MESSAGES.TEMPLATE_NOT_FOUND
        });
      }

      // Validate updates
      const updates = { ...req.body };
      delete updates.id;
      delete updates.createdAt;
      delete updates.variables; // Auto-generated

      TemplateValidationService.validateTemplateUpdate(updates, existingTemplate);

      const template = await TemplateDatabaseService.updateTemplate(id, updates);

      res.json({
        success: true,
        data: template.toApiFormat(),
        message: TEMPLATE_CONSTANTS.SUCCESS_MESSAGES.TEMPLATE_UPDATED
      });
    } catch (error) {
      TemplateErrorHandler.handleApiError(error, 'Updating template', res);
    }
  }

  /**
   * DELETE /api/templates/:id - Delete template
   */
  async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      TemplateValidationService.validateTemplateIdParameter(id);

      const deletedTemplate = await TemplateDatabaseService.deleteTemplate(id);

      res.json({
        success: true,
        data: deletedTemplate.toApiFormat(),
        message: TEMPLATE_CONSTANTS.SUCCESS_MESSAGES.TEMPLATE_DELETED
      });
    } catch (error) {
      TemplateErrorHandler.handleApiError(error, 'Deleting template', res);
    }
  }

  /**
   * PUT /api/templates/active/:issueType/:templateId - Set active template
   */
  async setActiveTemplate(req, res) {
    try {
      const { issueType, templateId } = req.params;
      TemplateValidationService.validateActiveTemplateSet(issueType, templateId);

      const template = await TemplateDatabaseService.setActiveTemplate(issueType, templateId);

      res.json({
        success: true,
        data: template.toApiFormat(),
        message: `${TEMPLATE_CONSTANTS.SUCCESS_MESSAGES.ACTIVE_TEMPLATE_SET} for ${issueType}`
      });
    } catch (error) {
      TemplateErrorHandler.handleApiError(error, 'Setting active template', res);
    }
  }

  /**
   * GET /api/templates/settings - Get template settings
   */
  async getSettings(req, res) {
    try {
      const settings = await TemplateDatabaseService.getSettings();
      
      res.json({
        success: true,
        data: settings.toApiFormat()
      });
    } catch (error) {
      TemplateErrorHandler.handleApiError(error, 'Getting settings', res);
    }
  }

  /**
   * PUT /api/templates/settings - Update template settings
   */
  async updateSettings(req, res) {
    try {
      const updates = { ...req.body };
      delete updates.version;
      delete updates.lastUpdated;

      TemplateValidationService.validateSettingsUpdate(updates);

      const settings = await TemplateDatabaseService.updateSettings(updates);

      res.json({
        success: true,
        data: settings.toApiFormat(),
        message: TEMPLATE_CONSTANTS.SUCCESS_MESSAGES.SETTINGS_UPDATED
      });
    } catch (error) {
      TemplateErrorHandler.handleApiError(error, 'Updating settings', res);
    }
  }

  /**
   * POST /api/templates/reset - Reset to default templates
   */
  async resetToDefaults(req, res) {
    try {
      const data = await TemplateDatabaseService.resetToDefaults();
      
      res.json({
        success: true,
        data: data,
        message: TEMPLATE_CONSTANTS.SUCCESS_MESSAGES.TEMPLATES_RESET
      });
    } catch (error) {
      TemplateErrorHandler.handleApiError(error, 'Resetting to defaults', res);
    }
  }

  /**
   * GET /api/templates/export - Export user templates
   */
  async exportTemplates(req, res) {
    try {
      const templates = await TemplateDatabaseService.getAllTemplates();
      const settings = await TemplateDatabaseService.getSettings();
      
      const exportData = TemplateExportImportProcessor.processExport(templates, settings);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition', 
        `attachment; filename="templates-export-${new Date().toISOString().split('T')[0]}.json"`
      );
      
      res.json(exportData);
    } catch (error) {
      TemplateErrorHandler.handleApiError(error, 'Exporting templates', res);
    }
  }

  /**
   * POST /api/templates/import - Import templates
   */
  async importTemplates(req, res) {
    try {
      const importData = req.body;
      
      TemplateValidationService.validateImportData(importData);
      
      const processedData = TemplateExportImportProcessor.processImport(importData);
      const importedTemplates = await TemplateDatabaseService.importTemplates(processedData);

      res.json({
        success: true,
        data: TemplateExportImportProcessor.processApiResponse(importedTemplates),
        message: `${TEMPLATE_CONSTANTS.SUCCESS_MESSAGES.TEMPLATES_IMPORTED}: ${importedTemplates.length} templates`
      });
    } catch (error) {
      TemplateErrorHandler.handleApiError(error, 'Importing templates', res);
    }
  }

  /**
   * POST /api/templates/duplicate/:id - Duplicate template
   */
  async duplicateTemplate(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      TemplateValidationService.validateTemplateDuplication(id, name);

      const duplicateTemplate = await TemplateDatabaseService.duplicateTemplate(id, name);

      res.status(TEMPLATE_CONSTANTS.HTTP_STATUS.CREATED).json({
        success: true,
        data: duplicateTemplate.toApiFormat(),
        message: TEMPLATE_CONSTANTS.SUCCESS_MESSAGES.TEMPLATE_DUPLICATED
      });
    } catch (error) {
      TemplateErrorHandler.handleApiError(error, 'Duplicating template', res);
    }
  }

  /**
   * GET /api/templates/search - Search templates (optional endpoint)
   */
  async searchTemplates(req, res) {
    try {
      const templates = await TemplateDatabaseService.getAllTemplates();
      const filters = req.query;
      
      const filteredTemplates = TemplateExportImportProcessor.processSearch(templates, filters);
      const processedTemplates = TemplateExportImportProcessor.processApiResponse(filteredTemplates);

      res.json({
        success: true,
        data: processedTemplates,
        pagination: {
          total: processedTemplates.length,
          filters: filters
        }
      });
    } catch (error) {
      TemplateErrorHandler.handleApiError(error, 'Searching templates', res);
    }
  }
}

export default new TemplateController();
