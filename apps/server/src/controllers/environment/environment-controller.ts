import { Request, Response } from 'express';
import { EnvironmentConfigService } from './services/environment-config-service.js';
import { ProviderConnectionService } from './services/provider-config-service.js';
import { EnvironmentRequest } from './models/environment-request.js';
import { ErrorHandler } from './utils/error-handler.js';
import langChainServiceFactory from '../../services/langchain/LangChainServiceFactory.ts';
import logger from '../../logger.ts';

class EnvironmentController {
  constructor() {
    this.initializeService();
  }

  async initializeService(): Promise<void> {
    try {
      await EnvironmentConfigService.initialize();
      logger.info('Environment settings controller initialized');
    } catch (error) {
      logger.error('Failed to initialize environment settings controller:', error);
    }
  }

  getSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const structuredConfig = await EnvironmentConfigService.getStructuredSettings();

      res.json({
        success: true,
        data: structuredConfig,
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'getting environment settings', res);
    }
  };

  updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const environmentRequest = new EnvironmentRequest(req.body);
      const updates = environmentRequest.getValidUpdates();

      if (Object.keys(updates).length === 0) {
        const currentConfig = await EnvironmentConfigService.getStructuredSettings();
        res.json({
          success: true,
          data: currentConfig,
          message: 'No valid settings to update',
        });
        return;
      }

      EnvironmentRequest.validate(updates);

      await EnvironmentConfigService.updateSettings(updates);

      const temperatureKeys = [
        'OPENAI_TEMPERATURE',
        'OPENAI_COMPATIBLE_TEMPERATURE',
        'GOOGLE_TEMPERATURE',
        'OLLAMA_TEMPERATURE',
      ];
      const hasTemperatureUpdates = temperatureKeys.some(key =>
        Object.prototype.hasOwnProperty.call(updates, key)
      );

      if (hasTemperatureUpdates) {
        try {
          logger.info('Temperature settings detected in updates, updating LangChain services...');
          await langChainServiceFactory.updateTemperatureSettings();
          logger.info('LangChain services temperature settings updated successfully');
        } catch (temperatureError: any) {
          logger.warn('Failed to update LangChain temperature settings:', temperatureError.message);
        }
      }

      const structuredConfig = await EnvironmentConfigService.getStructuredSettings();

      res.json({
        success: true,
        data: structuredConfig,
        message: 'Environment settings updated successfully',
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'updating environment settings', res);
    }
  };

  getProviders = async (req: Request, res: Response): Promise<void> => {
    try {
      const providers = await EnvironmentConfigService.getProviderStatus();

      res.json({
        success: true,
        data: providers,
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'getting providers', res);
    }
  };

  getProviderConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const providerConfig = await EnvironmentConfigService.getProviders();

      res.json({
        success: true,
        data: providerConfig,
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'getting provider config', res);
    }
  };

  testConnection = async (req: Request, res: Response): Promise<void> => {
    try {
      const { provider, config: testConfig } = req.body;

      if (!provider) {
        res.status(400).json({
          success: false,
          error: 'Provider is required',
        });
        return;
      }

      const testResult = await ProviderConnectionService.testConnection(provider, testConfig);

      res.json({
        success: true,
        data: testResult,
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'testing connection', res);
    }
  };

  getDefaults = async (req: Request, res: Response): Promise<void> => {
    try {
      const defaults = await EnvironmentConfigService.getDefaults();

      res.json({
        success: true,
        data: defaults,
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'getting defaults', res);
    }
  };

  resetSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      await EnvironmentConfigService.resetToDefaults();
      const structuredConfig = await EnvironmentConfigService.getStructuredSettings();

      res.json({
        success: true,
        data: structuredConfig,
        message: 'Environment settings reset to defaults successfully',
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'resetting environment settings', res);
    }
  };

  getSchema = async (req: Request, res: Response): Promise<void> => {
    try {
      const schema = await EnvironmentConfigService.getSchema();

      res.json({
        success: true,
        data: schema,
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'getting schema', res);
    }
  };

  exportSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const exportData = await EnvironmentConfigService.exportSettings();

      res.json({
        success: true,
        data: exportData,
        message: 'Settings exported successfully',
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'exporting settings', res);
    }
  };

  importSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const importData = req.body;

      if (!importData) {
        res.status(400).json({
          success: false,
          error: 'Import data is required',
        });
        return;
      }

      await EnvironmentConfigService.importSettings(importData);
      const structuredConfig = await EnvironmentConfigService.getStructuredSettings();

      res.json({
        success: true,
        data: structuredConfig,
        message: 'Settings imported successfully',
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'importing settings', res);
    }
  };
}

export default EnvironmentController;
