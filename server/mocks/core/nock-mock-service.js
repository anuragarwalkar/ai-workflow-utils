/**
 * Nock-based Mock Service
 * A comprehensive mocking service using nock for HTTP request interception
 * Uses functional programming principles with immutable state
 * Supports multiple services (Jira, Bitbucket, Email, etc.)
 */

import nock from 'nock';
import logger from '../../logger.js';

// Immutable state management
let mockState = {
  services: new Map(),
  globalMockMode: process.env.MOCK_MODE === 'true',
  activeMocks: new Set(),
  interceptors: new Map(),
};

// Pure function to get current state
const getMockState = () => ({ 
  ...mockState, 
  services: new Map(mockState.services),
  activeMocks: new Set(mockState.activeMocks),
  interceptors: new Map(mockState.interceptors),
});

// Pure function to update state
const updateMockState = (updates) => {
  mockState = { ...mockState, ...updates };
  return getMockState();
};

/**
 * Register a mock service
 * @param {string} serviceName - Name of the service (e.g., 'jira', 'bitbucket')
 * @param {Object} mockService - Mock service implementation
 * @returns {Object} Updated state
 */
export const registerService = (serviceName, mockService) => {
  const currentState = getMockState();
  const newServices = new Map(currentState.services);
  newServices.set(serviceName, mockService);
  
  updateMockState({ services: newServices });
  logger.debug(`Mock service registered: ${serviceName}`);
  return getMockState();
};

/**
 * Enable mocking for a specific service
 * @param {string} serviceName - Name of the service
 * @param {Object} config - Service-specific configuration
 * @returns {Object} Result of operation
 */
export const enableService = (serviceName, config = {}) => {
  const currentState = getMockState();
  const mockService = currentState.services.get(serviceName);
  
  if (!mockService) {
    throw new Error(`Mock service '${serviceName}' not found`);
  }

  if (currentState.activeMocks.has(serviceName)) {
    logger.warn(`Mock service '${serviceName}' is already active`);
    return { success: false, message: 'Service already active' };
  }

  const interceptors = mockService.enable(config);
  const newActiveMocks = new Set(currentState.activeMocks);
  const newInterceptors = new Map(currentState.interceptors);
  
  newActiveMocks.add(serviceName);
  newInterceptors.set(serviceName, interceptors);
  
  updateMockState({ 
    activeMocks: newActiveMocks,
    interceptors: newInterceptors,
  });
  
  logger.info(`Mock service enabled: ${serviceName}`);
  return { success: true, message: 'Service enabled', interceptors };
};

/**
 * Disable mocking for a specific service
 * @param {string} serviceName - Name of the service
 * @returns {Object} Result of operation
 */
export const disableService = (serviceName) => {
  const currentState = getMockState();
  const mockService = currentState.services.get(serviceName);
  
  if (!mockService) {
    throw new Error(`Mock service '${serviceName}' not found`);
  }

  if (!currentState.activeMocks.has(serviceName)) {
    logger.warn(`Mock service '${serviceName}' is not active`);
    return { success: false, message: 'Service not active' };
  }

  const interceptors = currentState.interceptors.get(serviceName);
  mockService.disable(interceptors);
  
  const newActiveMocks = new Set(currentState.activeMocks);
  const newInterceptors = new Map(currentState.interceptors);
  
  newActiveMocks.delete(serviceName);
  newInterceptors.delete(serviceName);
  
  updateMockState({ 
    activeMocks: newActiveMocks,
    interceptors: newInterceptors,
  });
  
  logger.info(`Mock service disabled: ${serviceName}`);
  return { success: true, message: 'Service disabled' };
};

/**
 * Enable all registered services
 * @param {Object} globalConfig - Global configuration for all services
 * @returns {Object} Result of operation
 */
export const enableAll = (globalConfig = {}) => {
  const currentState = getMockState();
  const results = [];
  
  for (const [serviceName] of currentState.services) {
    const serviceConfig = globalConfig[serviceName] || {};
    try {
      const result = enableService(serviceName, serviceConfig);
      results.push({ serviceName, ...result });
    } catch (error) {
      logger.error(`Failed to enable mock service '${serviceName}':`, error);
      results.push({ serviceName, success: false, error: error.message });
    }
  }
  
  return { success: true, results };
};

/**
 * Disable all active services
 * @returns {Object} Result of operation
 */
export const disableAll = () => {
  const currentState = getMockState();
  const results = [];
  
  for (const serviceName of currentState.activeMocks) {
    try {
      const result = disableService(serviceName);
      results.push({ serviceName, ...result });
    } catch (error) {
      logger.error(`Failed to disable mock service '${serviceName}':`, error);
      results.push({ serviceName, success: false, error: error.message });
    }
  }
  
  return { success: true, results };
};

/**
 * Clean all nock interceptors
 * @returns {Object} Result of operation
 */
export const cleanAll = () => {
  nock.cleanAll();
  updateMockState({ 
    activeMocks: new Set(), 
    interceptors: new Map(),
  });
  logger.info('All nock interceptors cleaned');
  return { success: true, message: 'All interceptors cleaned' };
};

/**
 * Check if a service is active
 * @param {string} serviceName - Name of the service
 * @returns {boolean} True if service is active
 */
export const isServiceActive = (serviceName) => {
  const currentState = getMockState();
  return currentState.activeMocks.has(serviceName);
};

/**
 * Get all active services
 * @returns {Array<string>} Array of active service names
 */
export const getActiveServices = () => {
  const currentState = getMockState();
  return Array.from(currentState.activeMocks);
};

/**
 * Check if global mock mode is enabled
 * @returns {boolean} True if global mock mode is enabled
 */
export const isGlobalMockMode = () => {
  const currentState = getMockState();
  return currentState.globalMockMode;
};

/**
 * Set global mock mode
 * @param {boolean} enabled - Enable/disable global mock mode
 * @returns {Object} Result of operation
 */
export const setGlobalMockMode = (enabled) => {
  updateMockState({ globalMockMode: enabled });
  
  if (enabled) {
    logger.info('Global mock mode enabled');
  } else {
    logger.info('Global mock mode disabled');
    disableAll();
  }
  
  return { success: true, globalMockMode: enabled };
};

/**
 * Get current mock state
 * @returns {Object} Current state
 */
export const getCurrentState = () => getMockState();

/**
 * Utility functions for creating mock services
 */

/**
 * Create a nock scope for a service
 * @param {string} baseURL - Base URL for the service
 * @returns {nock.Scope} Nock scope
 */
export const createScope = (baseURL) => nock(baseURL);

/**
 * Create a delay for async operations
 * @param {number} ms - Delay in milliseconds
 * @returns {Promise} Promise that resolves after delay
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generate a random ID
 * @param {string} prefix - ID prefix
 * @returns {string} Random ID
 */
export const generateId = (prefix = 'MOCK') => 
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

/**
 * Create a standard error response
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @returns {Object} Error response
 */
export const createErrorResponse = (statusCode, message, code = 'MOCK_ERROR') => ({
  errorMessages: [message],
  errors: {},
  code,
  status: statusCode,
});

/**
 * Create a standard success response
 * @param {*} data - Response data
 * @param {Object} meta - Optional metadata
 * @returns {Object} Success response
 */
export const createSuccessResponse = (data, meta = {}) => ({
  success: true,
  data,
  ...meta,
});

/**
 * Validate required fields in request data
 * @param {Object} data - Request data
 * @param {Array<string>} requiredFields - Required field names
 * @returns {Object} Validation result
 */
export const validateRequiredFields = (data, requiredFields) => {
  const missingFields = requiredFields.filter(field => !data[field]);
  return {
    isValid: missingFields.length === 0,
    missingFields,
    message: missingFields.length > 0 
      ? `Missing required fields: ${missingFields.join(', ')}`
      : 'Validation passed',
  };
};

/**
 * Factory function to create a mock service
 * @param {string} serviceName - Name of the service
 * @param {string} baseURL - Base URL for the service
 * @param {Function} setupInterceptors - Function to setup interceptors
 * @returns {Object} Mock service object
 */
export const createMockService = (serviceName, baseURL, setupInterceptors) => ({
  serviceName,
  baseURL,
  enable: (config = {}) => {
    logger.info(`Enabling ${serviceName} mock service`);
    return setupInterceptors(baseURL, config);
  },
  disable: (interceptors = []) => {
    logger.info(`Disabling ${serviceName} mock service`);
    interceptors.forEach(interceptor => {
      if (interceptor && typeof interceptor.done === 'function') {
        try {
          interceptor.done();
        } catch {
          // Interceptor might already be done
        }
      }
    });
  },
});

// Export nock for direct use
export { nock };
