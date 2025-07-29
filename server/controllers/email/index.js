/**
 * Email Module - Modular email generation system
 * 
 * This module follows the established modular architecture pattern with clear separation of concerns:
 * - Controllers: Orchestrate operations and handle HTTP requests/responses
 * - Services: Contain business logic and coordinate between different systems
 * - Processors: Transform and process data (HTML, tables, etc.)
 * - Models: Data validation, structure definition, and payload generation
 * - Utils: Common utilities, configuration, error handling, and constants
 */

// Main Controller
export { default as EmailController } from './emailController.js';

// Models
export { EmailRequest } from './models/email-request.js';

// Services
export { WikiService } from './services/wiki-service.js';
export { JiraIntegrationService } from './services/jira-integration-service.js';
export { EmailContentService } from './services/email-content-service.js';

// Processors
export { TableExtractor } from './processors/table-extractor.js';
export { HtmlFormatter } from './processors/html-formatter.js';

// Utils
export { ErrorHandler } from './utils/error-handler.js';
export { EMAIL_CONSTANTS } from './utils/constants.js';

// Backward compatibility - export the main controller as default
import EmailController from './emailController.js';
export default EmailController;
