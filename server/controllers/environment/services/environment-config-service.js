import environmentDbService from '../../../services/environmentDbService.js';
import configBridge from '../../../services/configBridge.js';
import langchainService from '../../../services/langchainService.js';
import logger from '../../../logger.js';

/**
 * Environment Configuration Service
 * Handles all environment configuration operations
 */
export class EnvironmentConfigService {
  /**
   * Initialize the environment configuration service
   */
  static async initialize() {
    await environmentDbService.init();
    logger.info('Environment configuration service initialized');
  }

  /**
   * Get structured settings from the database
   * @returns {Promise<Object>} Structured configuration
   */
  static async getStructuredSettings() {
    return await environmentDbService.getStructuredSettings();
  }

  /**
   * Update settings in the database and reinitialize services
   * @param {Object} updates - Settings to update
   */
  static async updateSettings(updates) {
    // Validate the updates
    const validationResult =
      await environmentDbService.validateSettings(updates);
    if (!validationResult.valid) {
      throw new Error(
        `Invalid configuration: ${validationResult.errors.join(', ')}`
      );
    }

    // Update settings in database
    await environmentDbService.updateSettings(updates);

    // Reload configuration and reinitialize providers
    await configBridge.loadConfigToEnv();
    langchainService.initializeProviders();

    logger.info('Environment settings updated successfully', {
      updatedKeys: Object.keys(updates),
    });
  }

  /**
   * Get provider status information
   * @returns {Promise<Object>} Provider status data
   */
  static async getProviderStatus() {
    return await environmentDbService.getProviderStatus();
  }

  /**
   * Get provider configuration metadata
   * @returns {Promise<Object>} Provider configuration
   */
  static async getProviders() {
    return await environmentDbService.getProviders();
  }

  /**
   * Get default configuration values
   * @returns {Promise<Object>} Default configuration
   */
  static async getDefaults() {
    return await environmentDbService.getDefaults();
  }

  /**
   * Reset settings to default values
   */
  static async resetToDefaults() {
    await environmentDbService.resetToDefaults();
    logger.info('Environment settings reset to defaults');
  }

  /**
   * Get configuration schema
   * @returns {Promise<Object>} Configuration schema
   */
  static async getSchema() {
    return await environmentDbService.getSchema();
  }

  /**
   * Export current settings
   * @returns {Promise<Object>} Export data
   */
  static async exportSettings() {
    return await environmentDbService.exportSettings();
  }

  /**
   * Import settings from data
   * @param {Object} importData - Data to import
   */
  static async importSettings(importData) {
    await environmentDbService.importSettings(importData);
    logger.info('Environment settings imported successfully');
  }
}
