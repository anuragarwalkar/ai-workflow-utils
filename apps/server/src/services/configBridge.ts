import logger from '../logger.ts';
import environmentDbService from './environmentDbService.ts';

export interface ConfigStatus {
  initialized: boolean;
}

class ConfigBridge {
  initialized: boolean;

  constructor() {
    this.initialized = false;
  }

  async loadConfigToEnv(): Promise<void> {
    try {
      await environmentDbService.init();
      const settings = await environmentDbService.getSettings();

      if (!settings || Object.keys(settings).length === 0) {
        logger.info('No database configuration found, using existing environment variables');
        this.initialized = true;
        return;
      }

      let loadedCount = 0;
      Object.entries(settings).forEach(([key, value]) => {
        if (value && typeof value === 'string' && value.trim() !== '') {
          process.env[key] = value;
          loadedCount++;
        }
      });

      logger.info(
        `Configuration bridge: Loaded ${loadedCount} settings from database to environment variables`
      );
      this.initialized = true;
    } catch (error: any) {
      logger.warn(
        'Failed to load database config, using existing environment variables:',
        error.message
      );
      this.initialized = true;
    }
  }

  async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.loadConfigToEnv();
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getConfigStatus(): ConfigStatus {
    return {
      initialized: this.initialized,
    };
  }
}

export default new ConfigBridge();
