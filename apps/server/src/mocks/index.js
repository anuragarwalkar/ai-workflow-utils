/**
 * Mock Service Registry Setup
 * Example of how to register and use multiple mock services
 */

import {
  cleanAll,
  disableAll,
  disableService,
  enableAll,
  enableService,
  getActiveServices,
  getCurrentState,
  isGlobalMockMode,
  isServiceActive,
  registerService,
  setGlobalMockMode,
} from '../core/nock-mock-service.js';
import { jiraMockService } from '../jira/jira-nock-service.js';
import { emailMockService } from '../email/email-mock-service.js';
import logger from '../../logger.js';

/**
 * Initialize all mock services
 * Call this during application startup or test setup
 */
export const initializeMockServices = () => {
  logger.info('Initializing mock services...');

  // Register all available mock services
  registerService('jira', jiraMockService);
  registerService('email', emailMockService);

  logger.info('Mock services registered successfully');
};

/**
 * Enable mocking based on environment or feature flags
 * @param {Object} config - Configuration for each service
 */
export const enableMockingForEnvironment = (config = {}) => {
  const mockMode = process.env.MOCK_MODE === 'true';
  const specificServices = process.env.MOCK_SERVICES?.split(',') || [];

  if (mockMode) {
    logger.info('Global mock mode enabled');
    setGlobalMockMode(true);
    enableAll(config);
  } else if (specificServices.length > 0) {
    logger.info(`Enabling specific mock services: ${specificServices.join(', ')}`);
    specificServices.forEach(serviceName => {
      const serviceConfig = config[serviceName.trim()] || {};
      enableService(serviceName.trim(), serviceConfig);
    });
  }
};

/**
 * Feature-specific mock enabling
 * Use this in feature tests or development
 * @param {Array<string>} services - Services to enable
 * @param {Object} config - Service configurations
 */
export const enableMockingForFeature = (services, config = {}) => {
  logger.info(`Enabling mocking for feature: ${services.join(', ')}`);

  services.forEach(serviceName => {
    const serviceConfig = config[serviceName] || {};
    enableService(serviceName, serviceConfig);
  });

  return {
    disable: () => {
      services.forEach(serviceName => {
        disableService(serviceName);
      });
    },
    getActiveServices: () => getActiveServices(),
    isActive: serviceName => isServiceActive(serviceName),
  };
};

/**
 * Test utilities for mock management
 */
export const testUtils = {
  /**
   * Setup mocks for a test suite
   * @param {Array<string>} services - Services to mock
   * @param {Object} config - Service configurations
   */
  setupMocks: (services, config = {}) => {
    return enableMockingForFeature(services, config);
  },

  /**
   * Clean up all mocks after tests
   */
  teardownMocks: () => {
    disableAll();
    cleanAll();
  },

  /**
   * Get current mock state for debugging
   */
  getMockState: () => getCurrentState(),

  /**
   * Check if all expected services are active
   * @param {Array<string>} expectedServices - Expected active services
   */
  verifyMockState: expectedServices => {
    const activeServices = getActiveServices();
    const missingServices = expectedServices.filter(service => !activeServices.includes(service));
    const extraServices = activeServices.filter(service => !expectedServices.includes(service));

    return {
      isValid: missingServices.length === 0 && extraServices.length === 0,
      missingServices,
      extraServices,
      activeServices,
    };
  },
};

/**
 * Development utilities
 */
export const devUtils = {
  /**
   * Enable all mocks for development
   */
  enableAllForDev: () => {
    const devConfig = {
      jira: {
        customInterceptors: [], // Add custom dev interceptors if needed
      },
      email: {
        // Email-specific dev config
      },
    };

    enableAll(devConfig);
    logger.info('All mock services enabled for development');
  },

  /**
   * Toggle a specific service on/off
   * @param {string} serviceName - Service to toggle
   */
  toggleService: serviceName => {
    if (isServiceActive(serviceName)) {
      disableService(serviceName);
      logger.info(`Disabled mock service: ${serviceName}`);
    } else {
      enableService(serviceName);
      logger.info(`Enabled mock service: ${serviceName}`);
    }
  },

  /**
   * Get mock status for debugging
   */
  getStatus: () => {
    const state = getCurrentState();
    return {
      globalMockMode: isGlobalMockMode(),
      activeServices: getActiveServices(),
      totalServices: state.services.size,
      totalInterceptors: state.interceptors.size,
    };
  },
};

// Auto-initialize if this module is imported
initializeMockServices();

// Enable mocking based on environment
enableMockingForEnvironment();
