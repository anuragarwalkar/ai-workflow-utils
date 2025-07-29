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
export { EmailRequest } from './models/EmailRequest.js';

// Services
export { WikiService } from './services/wikiService.js';
export { JiraIntegrationService } from './services/jiraIntegrationService.js';
export { EmailContentService } from './services/emailContentService.js';

// Processors
export { TableExtractor } from './processors/tableExtractor.js';
export { HtmlFormatter } from './processors/htmlFormatter.js';

// Utils
export { ErrorHandler } from './utils/errorHandler.js';
export { EMAIL_CONSTANTS } from './utils/constants.js';

// Backward compatibility - export the main controller as default
import EmailController from './emailController.js';
export default EmailController;
