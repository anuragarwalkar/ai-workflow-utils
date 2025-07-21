import logger from '../logger.js'
import environmentDbService from './environmentDbService.js'

class ConfigBridge {
  constructor() {
    this.initialized = false
  }

  async loadConfigToEnv() {
    try {
      // Initialize the environment database service first
      await environmentDbService.init()
      
      // Get settings from database
      const settings = await environmentDbService.getSettings()
      
      if (!settings || Object.keys(settings).length === 0) {
        logger.info('No database configuration found, using existing environment variables')
        this.initialized = true
        return
      }

      // Load all database settings into process.env
      let loadedCount = 0
      Object.entries(settings).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          process.env[key] = value
          loadedCount++
        }
      })
      
      logger.info(`Configuration bridge: Loaded ${loadedCount} settings from database to environment variables`)
      this.initialized = true
      
    } catch (error) {
      logger.warn('Failed to load database config, using existing environment variables:', error.message)
      this.initialized = true // Continue with existing env vars
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.loadConfigToEnv()
    }
  }

  isInitialized() {
    return this.initialized
  }

  // Method to get current configuration status
  getConfigStatus() {
    return {
      initialized: this.initialized,
    }
  }
}

export default new ConfigBridge()
