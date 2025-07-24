import logger from '../logger.js'
import environmentDbService from '../services/environmentDbService.js'
import langchainService from '../services/langchainService.js'
import configBridge from '../services/configBridge.js';

class EnvironmentSettingsController {
  constructor() {
    // Initialize the database service
    this.initializeService()
  }

  async initializeService() {
    try {
      await environmentDbService.init()
      logger.info('Environment settings controller initialized')
    } catch (error) {
      logger.error('Failed to initialize environment settings controller:', error)
    }
  }

  // GET /api/environment-settings - Get current configuration
  getSettings = async (req, res) => {
    try {
      const structuredConfig = await environmentDbService.getStructuredSettings()
      
      res.json({
        success: true,
        data: structuredConfig
      })
    } catch (error) {
      logger.error('Error getting environment settings:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get environment settings',
        details: error.message
      })
    }
  }

  // PUT /api/environment-settings - Update configuration
  updateSettings = async (req, res) => {
    try {
      const rawUpdates = req.body

      // Filter out empty string values and undefined values
      const updates = Object.entries(rawUpdates).reduce((acc, [key, value]) => {
        // Only include values that are not empty strings and not undefined
        if (value !== undefined && value !== '') {
          acc[key] = value
        }
        return acc
      }, {})

      // If no valid updates after filtering, return current config
      if (Object.keys(updates).length === 0) {
        const currentConfig = await environmentDbService.getStructuredSettings()
        return res.json({
          success: true,
          data: currentConfig,
          message: 'No valid settings to update'
        })
      }

      // Validate the updates
      const validationResult = await environmentDbService.validateSettings(updates)
      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid configuration',
          details: validationResult.errors
        })
      }

      // Update settings in database
      await environmentDbService.updateSettings(updates)
      
      // Return the updated structured config
      const structuredConfig = await environmentDbService.getStructuredSettings();
      
      await configBridge.loadConfigToEnv();
      langchainService.initializeProviders();
      
      res.json({
        success: true,
        data: structuredConfig,
        message: 'Environment settings updated successfully'
      })
    } catch (error) {
      logger.error('Error updating environment settings:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update environment settings',
        details: error.message
      })
    }
  }

  // GET /api/environment-settings/providers - Get available providers and their status
  getProviders = async (req, res) => {
    try {
      const providers = await environmentDbService.getProviderStatus()
      
      res.json({
        success: true,
        data: providers
      })
    } catch (error) {
      logger.error('Error getting providers:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get providers',
        details: error.message
      })
    }
  }

  // GET /api/environment-settings/config - Get provider configuration metadata
  getProviderConfig = async (req, res) => {
    try {
      const providerConfig = await environmentDbService.getProviders()
      
      res.json({
        success: true,
        data: providerConfig
      })
    } catch (error) {
      logger.error('Error getting provider config:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get provider config',
        details: error.message
      })
    }
  }

  // POST /api/environment-settings/test - Test API connections
  testConnection = async (req, res) => {
    try {
      const { provider, config: testConfig } = req.body

      if (!provider) {
        return res.status(400).json({
          success: false,
          error: 'Provider is required'
        })
      }

      const testResult = await this.testProviderConnection(provider, testConfig)
      
      res.json({
        success: true,
        data: testResult
      })
    } catch (error) {
      logger.error('Error testing connection:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to test connection',
        details: error.message
      })
    }
  }

  // GET /api/environment-settings/defaults - Get default configuration
  getDefaults = async (req, res) => {
    try {
      const defaults = await environmentDbService.getDefaults()
      
      res.json({
        success: true,
        data: defaults
      })
    } catch (error) {
      logger.error('Error getting defaults:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get defaults',
        details: error.message
      })
    }
  }

  // POST /api/environment-settings/reset - Reset to default configuration
  resetSettings = async (req, res) => {
    try {
      await environmentDbService.resetToDefaults()
      const structuredConfig = await environmentDbService.getStructuredSettings()
      
      res.json({
        success: true,
        data: structuredConfig,
        message: 'Environment settings reset to defaults successfully'
      })
    } catch (error) {
      logger.error('Error resetting environment settings:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to reset environment settings',
        details: error.message
      })
    }
  }

  // GET /api/environment-settings/schema - Get configuration schema
  getSchema = async (req, res) => {
    try {
      const schema = await environmentDbService.getSchema()
      
      res.json({
        success: true,
        data: schema
      })
    } catch (error) {
      logger.error('Error getting schema:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get schema',
        details: error.message
      })
    }
  }

  // POST /api/environment-settings/export - Export settings
  exportSettings = async (req, res) => {
    try {
      const exportData = await environmentDbService.exportSettings()
      
      res.json({
        success: true,
        data: exportData,
        message: 'Settings exported successfully'
      })
    } catch (error) {
      logger.error('Error exporting settings:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to export settings',
        details: error.message
      })
    }
  }

  // POST /api/environment-settings/import - Import settings
  importSettings = async (req, res) => {
    try {
      const importData = req.body
      
      if (!importData) {
        return res.status(400).json({
          success: false,
          error: 'Import data is required'
        })
      }

      const settings = await environmentDbService.importSettings(importData)
      const structuredConfig = await environmentDbService.getStructuredSettings()
      
      res.json({
        success: true,
        data: structuredConfig,
        message: 'Settings imported successfully'
      })
    } catch (error) {
      logger.error('Error importing settings:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to import settings',
        details: error.message
      })
    }
  }

  // Helper method for testing provider connections
  async testProviderConnection(provider, testConfig) {
    // This is a placeholder for actual connection testing
    // In a real implementation, you would make actual API calls to test connectivity
    
    const result = {
      provider,
      status: 'success',
      message: 'Connection test not implemented yet',
      timestamp: new Date().toISOString()
    }
    
    // Simulate some basic validation
    switch (provider) {
      case 'openai':
        if (!testConfig.OPENAI_COMPATIBLE_API_KEY || !testConfig.OPENAI_COMPATIBLE_BASE_URL) {
          result.status = 'error'
          result.message = 'API key and base URL are required'
        }
        break
      case 'jira':
        if (!testConfig.JIRA_URL || !testConfig.JIRA_TOKEN) {
          result.status = 'error'
          result.message = 'Jira URL and token are required'
        }
        break
      case 'bitbucket':
        if (!testConfig.BIT_BUCKET_URL || !testConfig.BITBUCKET_AUTHORIZATION_TOKEN) {
          result.status = 'error'
          result.message = 'Bitbucket URL and token are required'
        }
        break
      case 'ollama':
        if (!testConfig.OLLAMA_BASE_URL) {
          result.status = 'error'
          result.message = 'Ollama base URL is required'
        }
        break
      default:
        result.status = 'warning'
        result.message = 'Connection testing not available for this provider'
    }
    
    return result
  }
}

export default new EnvironmentSettingsController()
