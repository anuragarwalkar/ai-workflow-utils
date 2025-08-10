import {
  deleteTemplate as deleteDbTemplate,
  duplicateTemplate as duplicateTemplateDb,
  getActiveTemplate as getActiveTemplateDb,
  getAllTemplates as getAllTemplatesDb,
  getAllTemplates as getAllTemplatesFromDb,
  getSettings as getDbSettings,
  getTemplatesByType as getTemplatesByTypeDb,
  importTemplates as importTemplatesDb,
  init as initDatabase,
  resetToDefaults as resetToDefaultsDb,
  setActiveTemplate as setActiveTemplateDb,
  updateSettings as updateDbSettings,
  updateTemplate as updateDbTemplate,
} from './services/template-database-service.js';

import {
  validateActiveTemplateSet,
  validateImportData,
  validateIssueTypeParameter,
  validateSettingsUpdate,
  validateTemplateCreation,
  validateTemplateDuplication,
  validateTemplateIdParameter,
  validateTemplateUpdate,
} from './services/template-validation-service.js';

import {
  processApiResponse,
  processExport,
  processImport,
  processSearch,
} from './processors/template-export-import-processor.js';

import { toApiFormat as templateToApiFormat } from './models/template.js';
import { toApiFormat as settingsToApiFormat } from './models/template-settings.js';
import TemplateErrorHandler from './utils/template-error-handler.js';
import { TEMPLATE_CONSTANTS } from './utils/constants.js';
import logger from '../../logger.js';

// Function-based template controller
export async function init(_req, _res) {
  try {
    await initDatabase();
    logger.info('Template controller initialized');
  } catch (error) {
    TemplateErrorHandler.logError(error, 'Template controller initialization');
    throw error;
  }
}

// GET /api/templates/type/:issueType - Get templates by issue type
export async function getTemplatesByType(req, res) {
  try {
    const { issueType } = req.params;
    validateIssueTypeParameter(issueType);
    const templates = await getTemplatesByTypeDb(issueType);
    const processedTemplates = processApiResponse(templates);
    res.json({ success: true, data: processedTemplates });
  } catch (error) {
    TemplateErrorHandler.handleApiError(
      error,
      'Getting templates by type',
      res,
    );
  }
}

// GET /api/templates/active/:issueType - Get active template for issue type
export async function getActiveTemplate(req, res) {
  try {
    const { issueType } = req.params;
    validateIssueTypeParameter(issueType);
    const template = await getActiveTemplateDb(issueType);
    if (!template) {
      return res.status(TEMPLATE_CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: `No active template found for issue type: ${issueType}`,
      });
    }
    res.json({ success: true, data: templateToApiFormat(template) });
  } catch (error) {
    TemplateErrorHandler.handleApiError(error, 'Getting active template', res);
  }
}

// GET /api/templates/search - Search templates (optional endpoint)

// PUT /api/templates/:id - Update template
export async function updateTemplate(req, res) {
  try {
    const { id } = req.params;
    validateTemplateIdParameter(id);
    const templates = await getAllTemplatesDb();
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
    validateTemplateUpdate(updates, existingTemplate);
    const template = await updateDbTemplate(id, updates);
    res.json({
      success: true,
      data: templateToApiFormat(template),
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
    validateTemplateIdParameter(id);
    const deletedTemplate = await deleteDbTemplate(id);
    res.json({
      success: true,
      data: templateToApiFormat(deletedTemplate),
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
    validateActiveTemplateSet(issueType, templateId);
    const template = await setActiveTemplateDb(issueType, templateId);
    res.json({
      success: true,
      data: templateToApiFormat(template),
      message: `${TEMPLATE_CONSTANTS.SUCCESS_MESSAGES.ACTIVE_TEMPLATE_SET} for ${issueType}`,
    });
  } catch (error) {
    TemplateErrorHandler.handleApiError(error, 'Setting active template', res);
  }
}

// GET /api/templates/settings - Get template settings
export async function getSettings(req, res) {
  try {
    const settings = await getDbSettings();
    res.json({ success: true, data: settingsToApiFormat(settings) });
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
    validateSettingsUpdate(updates);
    const settings = await updateDbSettings(updates);
    res.json({
      success: true,
      data: settingsToApiFormat(settings),
      message: TEMPLATE_CONSTANTS.SUCCESS_MESSAGES.SETTINGS_UPDATED,
    });
  } catch (error) {
    TemplateErrorHandler.handleApiError(error, 'Updating settings', res);
  }
}

// POST /api/templates/reset - Reset to default templates
export async function resetToDefaults(req, res) {
  try {
    const data = await resetToDefaultsDb();
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
    const templates = await getAllTemplatesDb();
    const settings = await getDbSettings();
    const exportData = processExport(templates, settings);
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
    validateImportData(importData);
    const processedData = processImport(importData);
    const importedTemplates = await importTemplatesDb(processedData);
    res.json({
      success: true,
      data: processApiResponse(importedTemplates),
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
    validateTemplateDuplication(id, name);
    const duplicate = await duplicateTemplateDb(id, name);
    res.status(TEMPLATE_CONSTANTS.HTTP_STATUS.CREATED).json({
      success: true,
      data: templateToApiFormat(duplicate),
      message: TEMPLATE_CONSTANTS.SUCCESS_MESSAGES.TEMPLATE_DUPLICATED,
    });
  } catch (error) {
    TemplateErrorHandler.handleApiError(error, 'Duplicating template', res);
  }
}

// GET /api/templates/search - Search templates (optional endpoint)
export async function searchTemplates(req, res) {
  try {
    const templates = await getAllTemplatesDb();
    const filters = req.query;
    const filteredTemplates = processSearch(templates, filters);
    const processedTemplates = processApiResponse(filteredTemplates);
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
    // eslint-disable-next-line max-lines
    validateTemplateCreation(templateData);
    // eslint-disable-next-line max-lines
    const template = await createTemplate(templateData);
    res.status(TEMPLATE_CONSTANTS.HTTP_STATUS.CREATED).json({
      success: true,
      data: templateToApiFormat(template),

      message: TEMPLATE_CONSTANTS.SUCCESS_MESSAGES.TEMPLATE_CREATED,
    });
  } catch (error) {
    TemplateErrorHandler.handleApiError(error, 'Creating template', res);
  }
}

// GET /api/templates - Get all templates
export async function getAllTemplates(_req, res) {
  try {
    const templates = await getAllTemplatesFromDb();
    const processedTemplates = processApiResponse(templates);
    res.json({ success: true, data: processedTemplates });
  } catch (error) {
    TemplateErrorHandler.handleApiError(error, 'Getting all templates', res);
  }
}
