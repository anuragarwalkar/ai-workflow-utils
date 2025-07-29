/**
 * Environment Module - Modular environment settings management system
 * 
 * This module follows the established modular architecture pattern with clear separation of concerns:
 * - Controllers: Orchestrate operations and handle HTTP requests/responses
 * - Services: Contain business logic and coordinate between different systems
 * - Processors: Transform and process data (configuration, validation, etc.)
 * - Models: Data validation, structure definition, and request handling
 * - Utils: Common utilities, configuration, error handling, and constants
 */

// Main Controller
export { default as EnvironmentController } from './environment-controller.js';

// Models
export { EnvironmentRequest } from './models/environment-request.js';

// Services
export { EnvironmentConfigService } from './services/environment-config-service.js';
export { ProviderConnectionService } from './services/provider-config-service.js';

// Processors
export { ConfigurationProcessor } from './processors/configuration-processor.js';

// Utils
export { ErrorHandler } from './utils/error-handler.js';
export * from './utils/constants.js';

// Backward compatibility - default export for existing usage
import EnvironmentController from './environment-controller.js';
export default new EnvironmentController();
