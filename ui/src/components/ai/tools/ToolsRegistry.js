/**
 * Tools Registry - Central management for AI Chat Assistant tools
 * Provides a modular system for registering and executing tools
 */

import { createLogger } from '../../../utils/log';
import { BaseTool } from './BaseTool';

const logger = createLogger('ToolsRegistry');

/**
 * Tools Registry - Manages all available tools
 */
class ToolsRegistry {
  constructor() {
    this.tools = new Map();
    this.categories = new Set();
    this.executionHistory = [];
  }

  /**
   * Register a new tool
   * @param {BaseTool} tool - Tool instance to register
   */
  register(tool) {
    if (!(tool instanceof BaseTool)) {
      throw new Error('Tool must extend BaseTool class');
    }

    if (this.tools.has(tool.name)) {
      logger.info('register', `Tool ${tool.name} is already registered. Overwriting...`);
    }

    this.tools.set(tool.name, tool);
    this.categories.add(tool.category);
    
    logger.info('register', `Registered tool: ${tool.name}`);
  }

  /**
   * Unregister a tool
   * @param {string} name - Tool name to unregister
   */
  unregister(name) {
    const removed = this.tools.delete(name);
    if (removed) {
      logger.info('unregister', `Unregistered tool: ${name}`);
    }
    return removed;
  }

  /**
   * Get a tool by name
   * @param {string} name - Tool name
   * @returns {BaseTool|null} Tool instance or null
   */
  getTool(name) {
    return this.tools.get(name) || null;
  }

  /**
   * Get all registered tools
   * @param {Object} filters - Optional filters
   * @returns {Array<BaseTool>} Array of tools
   */
  getTools(filters = {}) {
    let tools = Array.from(this.tools.values());

    if (filters.category) {
      tools = tools.filter(tool => tool.category === filters.category);
    }

    if (filters.enabled !== undefined) {
      tools = tools.filter(tool => tool.enabled === filters.enabled);
    }

    return tools;
  }

  /**
   * Get all registered tools (alias for getTools())
   * @returns {Array<BaseTool>} Array of all tools
   */
  getAllTools() {
    return this.getTools();
  }

  /**
   * Get all tool schemas for AI model
   * @returns {Array<Object>} Array of OpenAI function schemas
   */
  getSchemas() {
    return this.getTools({ enabled: true }).map(tool => tool.getSchema());
  }

  /**
   * Execute a tool by name
   * @param {string} name - Tool name
   * @param {Object} params - Tool parameters
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Execution result
   */
  async execute(name, params = {}, context = {}) {
    const tool = this.getTool(name);
    
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }

    if (!tool.enabled) {
      throw new Error(`Tool ${name} is disabled`);
    }

    // Validate parameters
    const validation = tool.validate(params);
    if (!validation.valid) {
      throw new Error(`Tool validation failed: ${validation.errors.join(', ')}`);
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const result = await this._executeToolSafely({ tool, params, context, executionId });
      return result;
    } catch (error) {
      return this._handleExecutionError({ error, toolName: name, params, executionId });
    }
  }

  /**
   * Safely execute a tool and record success
   * @private
   */
  async _executeToolSafely({ tool, params, context, executionId }) {
    const startTime = Date.now();
    
    logger.info('execute', `Executing tool: ${tool.name} with ID: ${executionId}`);
    
    const result = await tool.execute(params, context);
    const duration = Date.now() - startTime;

    // Record execution history
    this.executionHistory.push({
      id: executionId,
      toolName: tool.name,
      params,
      result,
      duration,
      timestamp: new Date().toISOString(),
      status: 'success',
    });

    logger.info('execute', `Tool ${tool.name} executed successfully in ${duration}ms`);
    
    return {
      success: true,
      data: result,
      executionId,
      duration,
      toolName: tool.name,
    };
  }

  /**
   * Handle tool execution errors
   * @private
   */
  _handleExecutionError({ error, toolName, params, executionId }) {
    const duration = Date.now() - this.executionHistory.length > 0 
      ? this.executionHistory[this.executionHistory.length - 1].duration 
      : 0;
    
    // Record execution history
    this.executionHistory.push({
      id: executionId,
      toolName,
      params,
      error: error.message,
      duration,
      timestamp: new Date().toISOString(),
      status: 'error',
    });

    logger.error('execute', `Tool ${toolName} execution failed`, { error: error.message });
    
    return {
      success: false,
      error: error.message,
      executionId,
      duration,
      toolName,
    };
  }

  /**
   * Get execution history
   * @param {Object} filters - Optional filters
   * @returns {Array<Object>} Execution history
   */
  getExecutionHistory(filters = {}) {
    let history = [...this.executionHistory];

    if (filters.toolName) {
      history = history.filter(record => record.toolName === filters.toolName);
    }

    if (filters.status) {
      history = history.filter(record => record.status === filters.status);
    }

    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    return history;
  }

  /**
   * Clear execution history
   */
  clearHistory() {
    this.executionHistory = [];
    logger.info('clearHistory', 'Execution history cleared');
  }

  /**
   * Get registry statistics
   * @returns {Object} Registry stats
   */
  getStats() {
    const tools = this.getTools();
    const categories = Array.from(this.categories);
    const executions = this.executionHistory;
    
    return {
      totalTools: tools.length,
      enabledTools: tools.filter(t => t.enabled).length,
      categories: categories.length,
      totalExecutions: executions.length,
      successfulExecutions: executions.filter(e => e.status === 'success').length,
      failedExecutions: executions.filter(e => e.status === 'error').length,
      categoriesBreakdown: categories.map(cat => ({
        category: cat,
        count: tools.filter(t => t.category === cat).length,
      })),
    };
  }
}

// Create global registry instance
export const toolsRegistry = new ToolsRegistry();

// Auto-import and register tools
import('./tools').then(() => {
  logger.info('Tools imported and registered');
}).catch(error => {
  logger.error('Failed to import tools', { error: error.message });
});

// Export utilities
export { ToolsRegistry };
