import { BaseLangChainService } from './BaseLangChainService.ts';
import jiraLangChainService, { JiraLangChainService } from './JiraLangChainService.ts';
import prLangChainService, { PRLangChainService } from './PRLangChainService.ts';
import chatLangChainService from './ChatLangChainService.ts';
import logger from '../../logger.ts';

class LangChainServiceFactory {
  services: {
    base: BaseLangChainService;
    jira: JiraLangChainService;
    pr: PRLangChainService;
    chat: typeof chatLangChainService;
    [key: string]: any;
  };
  initialized: boolean;

  constructor() {
    this.services = {
      base: new BaseLangChainService(),
      jira: jiraLangChainService,
      pr: prLangChainService,
      chat: chatLangChainService,
    };

    this.initialized = false;
  }

  async initializeProviders(): Promise<void> {
    const initPromises = Object.values(this.services).map((service: any) =>
      service.initializeProviders()
    );
    await Promise.all(initPromises);
    this.initialized = true;
    logger.info('All LangChain services initialized');
  }

  async updateTemperatureSettings(temperatureSettings: Record<string, any> | null = null): Promise<void> {
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
    } catch (error: any) {
      logger.error('Failed to update temperature settings across services:', error);
      throw error;
    }
  }

  getCurrentTemperatureSettings(): Record<string, any> {
    const allTemperatures: Record<string, any> = {};

    Object.entries(this.services).forEach(([serviceName, service]) => {
      if (typeof service.getCurrentTemperatureSettings === 'function') {
        allTemperatures[serviceName] = service.getCurrentTemperatureSettings();
      }
    });

    return allTemperatures;
  }

  getJiraService(): JiraLangChainService {
    if (!this.initialized) {
      this.initializeProviders();
    }
    return this.services.jira;
  }

  getPRService(): PRLangChainService {
    if (!this.initialized) {
      this.initializeProviders();
    }
    return this.services.pr;
  }

  getChatService(): typeof chatLangChainService {
    if (!this.initialized) {
      this.initializeProviders();
    }
    return this.services.chat;
  }

  getBaseService(): BaseLangChainService {
    if (!this.initialized) {
      this.initializeProviders();
    }
    return this.services.base;
  }

  getService(type: string): any {
    if (!this.initialized) {
      this.initializeProviders();
    }

    if (this.services[type]) {
      return this.services[type];
    }

    logger.warn(`Unknown service type: ${type}, returning base service`);
    return this.services.base;
  }

  getAvailableProviders(): any {
    if (!this.initialized) {
      this.initializeProviders();
    }
    return this.services.base.getAvailableProviders();
  }

  hasProviders(): boolean {
    if (!this.initialized) {
      this.initializeProviders();
    }
    return Boolean(this.services.base.providers && this.services.base.providers.length > 0);
  }
}

export default new LangChainServiceFactory();
