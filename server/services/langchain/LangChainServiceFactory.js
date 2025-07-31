import { BaseLangChainService } from './BaseLangChainService.js';
import jiraLangChainService from './JiraLangChainService.js';
import prLangChainService from './PRLangChainService.js';
import chatLangChainService from './ChatLangChainService.js';
import logger from "../../logger.js";

/**
 * Factory service for managing different LangChain service implementations
 */
class LangChainServiceFactory {
  constructor() {
    this.services = {
      base: new BaseLangChainService(),
      jira: jiraLangChainService,
      pr: prLangChainService,
      chat: chatLangChainService
    };
    
    this.initialized = false;
  }

  /**
   * Initialize all services with providers
   */
  initializeProviders() {
    Object.values(this.services).forEach(service => {
      service.initializeProviders();
    });
    this.initialized = true;
    logger.info('All LangChain services initialized');
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
