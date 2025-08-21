/**
 * Base Tool Class - Foundation for all AI Chat Assistant tools
 */

import { createLogger } from '../../../utils/log';

const logger = createLogger('BaseTool');

/**
 * Base tool interface that all tools must implement
 */
export class BaseTool {
  constructor({ name, description, parameters = {}, category = 'general' }) {
    this.name = name;
    this.description = description;
    this.parameters = parameters;
    this.category = category;
    this.icon = 'Tool';
    this.enabled = true;
    this.version = '1.0.0';

    // Auto-register with the global registry
    this.register();
  }

  /**
   * Execute the tool with given parameters
   * @param {Object} _params - Tool parameters
   * @param {Object} _context - Execution context (user, session, etc.)
   * @returns {Promise<Object>} Tool execution result
   */
  async execute(_params, _context) {
    throw new Error(`Tool ${this.name} must implement execute method`);
  }

  /**
   * Validate tool parameters
   * @param {Object} params - Parameters to validate
   * @returns {Object} Validation result
   */
  validate(params) {
    const errors = [];
    const requiredParams = Object.entries(this.parameters)
      .filter(([, config]) => config.required)
      .map(([name]) => name);

    for (const param of requiredParams) {
      if (!(param in params) || params[param] === null || params[param] === undefined) {
        errors.push(`Missing required parameter: ${param}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get tool schema for AI model
   * @returns {Object} OpenAI function calling schema
   */
  getSchema() {
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: {
          type: 'object',
          properties: this.parameters,
          required: Object.entries(this.parameters)
            .filter(([, config]) => config.required)
            .map(([name]) => name),
        },
      },
    };
  }

  /**
   * Auto-register this tool with the global registry
   */
  register() {
    // Import registry here to avoid circular dependency
    import('./ToolsRegistry').then(({ toolsRegistry }) => {
      toolsRegistry.register(this);
    }).catch(error => {
      logger.error('register', 'Failed to auto-register tool', { error: error.message });
    });
  }
}

export default BaseTool;
