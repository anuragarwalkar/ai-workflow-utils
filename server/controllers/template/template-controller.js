import * as TemplateDatabaseService from './services/template-database-service.js';
import * as TemplateValidationService from './services/template-validation-service.js';
import * as TemplateExportImportProcessor from './processors/template-export-import-processor.js';
import * as Template from './models/template.js';
import * as TemplateSettings from './models/template-settings.js';
import TemplateErrorHandler from './utils/template-error-handler.js';
import { TEMPLATE_CONSTANTS } from './utils/constants.js';
import logger from '../../logger.js';

// Function-based template controller
export async function init() {
  try {
    await TemplateDatabaseService.init();
    logger.info('Template controller initialized');
  } catch (error) {
    TemplateErrorHandler.logError(error, 'Template controller initialization');
    throw error;
  }
}

// GET /api/templates - Get all templates
export async function getAllTemplates(req, res) {
  try {
    const templates = await TemplateDatabaseService.getAllTemplates();
    const processedTemplates = TemplateExportImportProcessor.processApiResponse(templates);
    res.json({ success: true, data: processedTemplates });
  } catch (error) {
    TemplateErrorHandler.handleApiError(error, 'Getting all templates', res);
  }
}

// GET /api/templates/type/:issueType - Get templates by issue type
export async function getTemplatesByType(req, res) {
  try {
    const { issueType } = req.params;
    TemplateValidationService.validateIssueTypeParameter(issueType);
    const templates = await TemplateDatabaseService.getTemplatesByType(issueType);
    const processedTemplates = TemplateExportImportProcessor.processApiResponse(templates);
    res.json({ success: true, data: processedTemplates });
  } catch (error) {
    TemplateErrorHandler.handleApiError(error, 'Getting templates by type', res);
  }
}

// GET /api/templates/active/:issueType - Get active template for issue type
export async function getActiveTemplate(req, res) {
  try {
    const { issueType } = req.params;
    TemplateValidationService.validateIssueTypeParameter(issueType);
    const template = await TemplateDatabaseService.getActiveTemplate(issueType);
    if (!template) {
      return res.status(TEMPLATE_CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: `No active template found for issue type: ${issueType}`,
      });
    }
    res.json({ success: true, data: Template.toApiFormat(template) });
  } catch (error) {
    TemplateErrorHandler.handleApiError(error, 'Getting active template', res);
  }
}

// POST /api/templates - Create new template
export async function createTemplate(req, res) {
  try {
    const templateData = TemplateErrorHandler.validateInput(req.body, {
      name: {
        required: true,
        type: 'string',
        maxLength: TEMPLATE_CONSTANTS.MAX_NAME_LENGTH,
      },
      issueType: {
        required: true,
        type: 'string',
        pattern: TEMPLATE_CONSTANTS.ISSUE_TYPE_PATTERN,
      },
      content: {
        required: true,
        type: 'string',
        maxLength: TEMPLATE_CONSTANTS.MAX_CONTENT_LENGTH,
      },
    });
    TemplateValidationService.validateTemplateCreation(templateData);
    const template = await TemplateDatabaseService.createTemplate(templateData);
    res.status(TEMPLATE_CONSTANTS.HTTP_STATUS.CREATED).json({
      success: true,
      data: Template.toApiFormat(template),
      message: TEMPLATE_CONSTANTS.SUCCESS_MESSAGES.TEMPLATE_CREATED,
    });
  } catch (error) {
    TemplateErrorHandler.handleApiError(error, 'Creating template', res);
  }
}

// PUT /api/templates/:id - Update template
export async function updateTemplate(req, res) {
  try {
    const { id } = req.params;
    TemplateValidationService.validateTemplateIdParameter(id);
    const templates = await TemplateDatabaseService.getAllTemplates();
    const existingTemplate = templates.find(t => t.id === id);
    if (!existingTemplate) {
      return res.status(TEMPLATE_CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: TEMPLATE_CONSTANTS.ERROR_MESSAGES.TEMPLATE_NOT_FOUND,
      });
    }
    const updates = { ...req.body };
    delete updates.id;
    delete updates.createdAt;
    delete updates.variables;
    TemplateValidationService.validateTemplateUpdate(updates, existingTemplate);
    const template = await TemplateDatabaseService.updateTemplate(id, updates);
    res.json({
      success: true,
      data: Template.toApiFormat(template),
      message: TEMPLATE_CONSTANTS.SUCCESS_MESSAGES.TEMPLATE_UPDATED,
    });
  } catch (error) {
    TemplateErrorHandler.handleApiError(error, 'Updating template', res);
  }
}

// DELETE /api/templates/:id - Delete template
export async function deleteTemplate(req, res) {
  try {
    const { id } = req.params;
    TemplateValidationService.validateTemplateIdParameter(id);
    const deletedTemplate = await TemplateDatabaseService.deleteTemplate(id);
    res.json({
      success: true,
      data: Template.toApiFormat(deletedTemplate),
      message: TEMPLATE_CONSTANTS.SUCCESS_MESSAGES.TEMPLATE_DELETED,
    });
  } catch (error) {
    TemplateErrorHandler.handleApiError(error, 'Deleting template', res);
  }
}

// PUT /api/templates/active/:issueType/:templateId - Set active template
export async function setActiveTemplate(req, res) {
  try {
    const { issueType, templateId } = req.params;
    TemplateValidationService.validateActiveTemplateSet(issueType, templateId);
    const template = await TemplateDatabaseService.setActiveTemplate(issueType, templateId);
    res.json({
      success: true,
      data: Template.toApiFormat(template),
      message: `${TEMPLATE_CONSTANTS.SUCCESS_MESSAGES.ACTIVE_TEMPLATE_SET} for ${issueType}`,
    });
  } catch (error) {
    TemplateErrorHandler.handleApiError(error, 'Setting active template', res);
  }
}

// GET /api/templates/settings - Get template settings
export async function getSettings(req, res) {
  try {
    const settings = await TemplateDatabaseService.getSettings();
    res.json({ success: true, data: TemplateSettings.toApiFormat(settings) });
  } catch (error) {
    TemplateErrorHandler.handleApiError(error, 'Getting settings', res);
  }
}

// PUT /api/templates/settings - Update template settings
export async function updateSettings(req, res) {
  try {
    const updates = { ...req.body };
    delete updates.version;
    delete updates.lastUpdated;
    TemplateValidationService.validateSettingsUpdate(updates);
    const settings = await TemplateDatabaseService.updateSettings(updates);
    res.json({
      success: true,
      data: TemplateSettings.toApiFormat(settings),
      message: TEMPLATE_CONSTANTS.SUCCESS_MESSAGES.SETTINGS_UPDATED,
    });
  } catch (error) {
    TemplateErrorHandler.handleApiError(error, 'Updating settings', res);
  }
}

// POST /api/templates/reset - Reset to default templates
export async function resetToDefaults(req, res) {
  try {
    const data = await TemplateDatabaseService.resetToDefaults();
    res.json({
      success: true,
      data,
      message: TEMPLATE_CONSTANTS.SUCCESS_MESSAGES.TEMPLATES_RESET,
    });
  } catch (error) {
    TemplateErrorHandler.handleApiError(error, 'Resetting to defaults', res);
  }
}

// GET /api/templates/export - Export user templates
export async function exportTemplates(req, res) {
  try {
    const templates = await TemplateDatabaseService.getAllTemplates();
    const settings = await TemplateDatabaseService.getSettings();
    const exportData = TemplateExportImportProcessor.processExport(templates, settings);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="templates-export-${new Date().toISOString().split('T')[0]}.json"`,
    );
    res.json(exportData);
  } catch (error) {
    TemplateErrorHandler.handleApiError(error, 'Exporting templates', res);
  }
}

// POST /api/templates/import - Import templates
export async function importTemplates(req, res) {
  try {
    const importData = req.body;
    TemplateValidationService.validateImportData(importData);
    const processedData = TemplateExportImportProcessor.processImport(importData);
    const importedTemplates = await TemplateDatabaseService.importTemplates(processedData);
    res.json({
      success: true,
      data: TemplateExportImportProcessor.processApiResponse(importedTemplates),
      message: `${TEMPLATE_CONSTANTS.SUCCESS_MESSAGES.TEMPLATES_IMPORTED}: ${importedTemplates.length} templates`,
    });
  } catch (error) {
    TemplateErrorHandler.handleApiError(error, 'Importing templates', res);
  }
}

// POST /api/templates/duplicate/:id - Duplicate template
export async function duplicateTemplate(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    TemplateValidationService.validateTemplateDuplication(id, name);
    const duplicateTemplate = await TemplateDatabaseService.duplicateTemplate(id, name);
    res.status(TEMPLATE_CONSTANTS.HTTP_STATUS.CREATED).json({
      success: true,
      data: Template.toApiFormat(duplicateTemplate),
      message: TEMPLATE_CONSTANTS.SUCCESS_MESSAGES.TEMPLATE_DUPLICATED,
    });
  } catch (error) {
    TemplateErrorHandler.handleApiError(error, 'Duplicating template', res);
  }
}

// GET /api/templates/search - Search templates (optional endpoint)
export async function searchTemplates(req, res) {
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
        filters,
      },
    });
  } catch (error) {
    TemplateErrorHandler.handleApiError(error, 'Searching templates', res);
  }
}
