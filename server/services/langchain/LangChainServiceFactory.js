import { BaseLangChainService } from './BaseLangChainService.js';
import jiraLangChainService from './JiraLangChainService.js';
import prLangChainService from './PRLangChainService.js';
import chatLangChainService from './ChatLangChainService.js';
import logger from '../../logger.js';

/**
 * Factory service for managing different LangChain service implementations
 */
class LangChainServiceFactory {
  constructor() {
    this.services = {
      base: new BaseLangChainService(),
      jira: jiraLangChainService,
      pr: prLangChainService,
      chat: chatLangChainService,
    };

    this.initialized = false;
  }

  /**
   * Initialize all services with providers
   */
  async initializeProviders() {
    const initPromises = Object.values(this.services).map(service => 
      service.initializeProviders()
    );
    await Promise.all(initPromises);
    this.initialized = true;
    logger.info('All LangChain services initialized');
  }

  /**
   * Update temperature settings across all services
   * @param {Object} temperatureSettings - Optional temperature settings object
   */
  async updateTemperatureSettings(temperatureSettings = null) {
    try {
      if (!this.initialized) {
        await this.initializeProviders();
      }

      const updatePromises = Object.entries(this.services).map(async ([serviceName, service]) => {
        if (typeof service.updateTemperatureSettings === 'function') {
          await service.updateTemperatureSettings(temperatureSettings);
          logger.info(`Updated temperature settings for ${serviceName} service`);
        } else {
          logger.warn(`Service ${serviceName} does not support temperature updates`);
        }
      });

      await Promise.all(updatePromises);
      logger.info('Temperature settings updated across all LangChain services');
    } catch (error) {
      logger.error('Failed to update temperature settings across services:', error);
      throw error;
    }
  }

  /**
   * Get current temperature settings from all services
   * @returns {Object} Object containing temperature settings for each service
   */
  getCurrentTemperatureSettings() {
    const allTemperatures = {};
    
    Object.entries(this.services).forEach(([serviceName, service]) => {
      if (typeof service.getCurrentTemperatureSettings === 'function') {
        allTemperatures[serviceName] = service.getCurrentTemperatureSettings();
      }
    });
    
    return allTemperatures;
  }

  /**
   * Get Jira-specific service
   */
  getJiraService() {
    if (!this.initialized) {
      this.initializeProviders();
    }
    return this.services.jira;
  }

  /**
   * Get PR-specific service
   */
  getPRService() {
    if (!this.initialized) {
      this.initializeProviders();
    }
    return this.services.pr;
  }

  /**
   * Get Chat-specific service
   */
  getChatService() {
    if (!this.initialized) {
      this.initializeProviders();
    }
    return this.services.chat;
  }

  /**
   * Get base service for general use
   */
  getBaseService() {
    if (!this.initialized) {
      this.initializeProviders();
    }
    return this.services.base;
  }

  /**
   * Get service by type
   */
  getService(type) {
    if (!this.initialized) {
      this.initializeProviders();
    }

    if (this.services[type]) {
      return this.services[type];
    }

    logger.warn(`Unknown service type: ${type}, returning base service`);
    return this.services.base;
  }

  /**
   * Get available providers from any service (they all share the same providers)
   */
  getAvailableProviders() {
    if (!this.initialized) {
      this.initializeProviders();
    }
    return this.services.base.getAvailableProviders();
  }

  /**
   * Check if any service has providers configured
   */
  hasProviders() {
    if (!this.initialized) {
      this.initializeProviders();
    }
    return this.services.base.providers && this.services.base.providers.length > 0;
  }
}

// Export singleton factory instance
export default new LangChainServiceFactory();
