import { EnvironmentConfigService } from './services/environment-config-service.js';
import { ProviderConnectionService } from './services/provider-config-service.js';
import { EnvironmentRequest } from './models/environment-request.js';
import { ErrorHandler } from './utils/error-handler.js';
import logger from '../../logger.js';

/**
 * Environment Controller - Main orchestrator for environment settings workflow
 * Follows modular architecture with clear separation of concerns
 */
class EnvironmentController {
  constructor() {
    this.initializeService();
  }

  async initializeService() {
    try {
      await EnvironmentConfigService.initialize();
      logger.info('Environment settings controller initialized');
    } catch (error) {
      logger.error(
        'Failed to initialize environment settings controller:',
        error
      );
    }
  }

  /**
   * GET /api/environment-settings - Get current configuration
   */
  getSettings = async (req, res) => {
    try {
      const structuredConfig =
        await EnvironmentConfigService.getStructuredSettings();

      res.json({
        success: true,
        data: structuredConfig,
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'getting environment settings', res);
    }
  };

  /**
   * PUT /api/environment-settings - Update configuration
   */
  updateSettings = async (req, res) => {
    try {
      const environmentRequest = new EnvironmentRequest(req.body);
      const updates = environmentRequest.getValidUpdates();

      // If no valid updates after filtering, return current config
      if (Object.keys(updates).length === 0) {
        const currentConfig =
          await EnvironmentConfigService.getStructuredSettings();
        return res.json({
          success: true,
          data: currentConfig,
          message: 'No valid settings to update',
        });
      }

      // Validate the updates
      EnvironmentRequest.validate(updates);

      // Update settings
      await EnvironmentConfigService.updateSettings(updates);

      // Return the updated structured config
      const structuredConfig =
        await EnvironmentConfigService.getStructuredSettings();

      res.json({
        success: true,
        data: structuredConfig,
        message: 'Environment settings updated successfully',
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'updating environment settings', res);
    }
  };

  /**
   * GET /api/environment-settings/providers - Get available providers and their status
   */
  getProviders = async (req, res) => {
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

  /**
   * GET /api/environment-settings/config - Get provider configuration metadata
   */
  getProviderConfig = async (req, res) => {
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

  /**
   * POST /api/environment-settings/test - Test API connections
   */
  testConnection = async (req, res) => {
    try {
      const { provider, config: testConfig } = req.body;

      if (!provider) {
        return res.status(400).json({
          success: false,
          error: 'Provider is required',
        });
      }

      const testResult = await ProviderConnectionService.testConnection(
        provider,
        testConfig
      );

      res.json({
        success: true,
        data: testResult,
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'testing connection', res);
    }
  };

  /**
   * GET /api/environment-settings/defaults - Get default configuration
   */
  getDefaults = async (req, res) => {
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

  /**
   * POST /api/environment-settings/reset - Reset to default configuration
   */
  resetSettings = async (req, res) => {
    try {
      await EnvironmentConfigService.resetToDefaults();
      const structuredConfig =
        await EnvironmentConfigService.getStructuredSettings();

      res.json({
        success: true,
        data: structuredConfig,
        message: 'Environment settings reset to defaults successfully',
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'resetting environment settings', res);
    }
  };

  /**
   * GET /api/environment-settings/schema - Get configuration schema
   */
  getSchema = async (req, res) => {
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

  /**
   * POST /api/environment-settings/export - Export settings
   */
  exportSettings = async (req, res) => {
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

  /**
   * POST /api/environment-settings/import - Import settings
   */
  importSettings = async (req, res) => {
    try {
      const importData = req.body;

      if (!importData) {
        return res.status(400).json({
          success: false,
          error: 'Import data is required',
        });
      }

      await EnvironmentConfigService.importSettings(importData);
      const structuredConfig =
        await EnvironmentConfigService.getStructuredSettings();

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
