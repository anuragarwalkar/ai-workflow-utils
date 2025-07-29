// Main Template Controller (modular version)
export { default as TemplateController } from './template-controller.js';
export { default } from './template-controller.js';

// Services
export { default as TemplateDatabaseService } from './services/template-database-service.js';
export { default as TemplateValidationService } from './services/template-validation-service.js';

// Processors
export { default as TemplateExportImportProcessor } from './processors/template-export-import-processor.js';

// Models
export { default as Template } from './models/template.js';
export { default as TemplateSettings } from './models/template-settings.js';

// Utils
export { default as TemplateErrorHandler } from './utils/template-error-handler.js';
export * from './utils/constants.js';
