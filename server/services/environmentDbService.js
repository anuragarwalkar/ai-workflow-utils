import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import os from 'os'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import logger from '../logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class EnvironmentDbService {
  constructor() {
    // Store in user's home directory like .env
    const homeDir = os.homedir()
    const configDir = path.join(homeDir, '.ai-workflow-utils')
    const dbPath = path.join(configDir, 'environment.json')
    
    // Ensure directory exists
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
      logger.info(`Created config directory: ${configDir}`)
    }
    
    this.adapter = new JSONFile(dbPath)
    this.db = new Low(this.adapter, {})
    logger.info(`Environment database initialized at: ${dbPath}`)
  }

  async loadDefaultConfig() {
    try {
      const defaultConfigPath = path.join(__dirname, '../data/config.json')
      const configSchema = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'))
      
      // Extract default values from schema
      const defaultSettings = {}
      for (const [sectionName, sectionConfig] of Object.entries(configSchema.sections)) {
        for (const [fieldKey, fieldConfig] of Object.entries(sectionConfig.fields)) {
          if (fieldConfig.default) {
            defaultSettings[fieldKey] = fieldConfig.default
          }
        }
      }

      // Set default provider selections
      const defaultProviders = {}
      for (const [providerType, providerConfig] of Object.entries(configSchema.providers)) {
        defaultProviders[`${providerType}_provider`] = providerConfig.default
      }
      
      return {
        schema: configSchema,
        settings: {
          ...defaultSettings,
          ...defaultProviders
        },
        metadata: {
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
      }
    } catch (error) {
      logger.error('Failed to load default config from file:', error)
      // Fallback to minimal default
      return {
        schema: { providers: {}, sections: {} },
        settings: {},
        metadata: {
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
      }
    }
  }

  async init() {
    try {
      await this.db.read()
      
      // If database is empty or doesn't exist, initialize with defaults
      if (!this.db.data || !this.db.data.schema) {
        const defaultData = await this.loadDefaultConfig()
        this.db.data = defaultData
        await this.db.write()
        logger.info('Environment database initialized with default configuration')
      }
      
      return true
    } catch (error) {
      logger.error('Failed to initialize environment database:', error)
      throw error
    }
  }

  async getSchema() {
    try {
      await this.db.read()
      return this.db.data.schema || { providers: {}, sections: {} }
    } catch (error) {
      logger.error('Failed to get schema:', error)
      throw error
    }
  }

  async getSettings() {
    try {
      await this.db.read()
      return this.db.data.settings || {}
    } catch (error) {
      logger.error('Failed to get settings:', error)
      throw error
    }
  }

  async updateSettings(updates) {
    try {
      await this.db.read()
      
      // Only update fields that are present in the updates object
      // This preserves other environment variables
      const updatedSettings = {}
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined && value !== null) {
          updatedSettings[key] = value
        }
      }
      
      this.db.data.settings = {
        ...this.db.data.settings,
        ...updatedSettings
      }
      
      this.db.data.metadata = {
        ...this.db.data.metadata,
        lastUpdated: new Date().toISOString()
      }
      
      await this.db.write()
      
      logger.info('Updated environment settings')
      return this.db.data.settings
    } catch (error) {
      logger.error('Failed to update settings:', error)
      throw error
    }
  }

  async getProviders() {
    try {
      await this.db.read()
      const schema = this.db.data.schema
      const settings = this.db.data.settings
      
      const providers = {}
      
      // Build provider status from schema and current settings
      for (const [providerType, providerConfig] of Object.entries(schema.providers || {})) {
        providers[providerType] = {
          ...providerConfig,
          currentSelection: this.getCurrentSelection(providerType, settings)
        }
      }
      
      return providers
    } catch (error) {
      logger.error('Failed to get providers:', error)
      throw error
    }
  }

  getCurrentSelection(providerType, settings) {
    const providerKey = `${providerType}_provider`
    return settings[providerKey] || this.db.data.schema.providers[providerType]?.default
  }

  async getProviderStatus() {
    try {
      await this.db.read()
      const schema = this.db.data.schema
      const settings = this.db.data.settings
      
      const status = {}
      
      // Check configuration status for each section
      for (const [sectionName, sectionConfig] of Object.entries(schema.sections || {})) {
        const requiredFields = Object.entries(sectionConfig.fields)
          .filter(([_, fieldConfig]) => fieldConfig.required || fieldConfig.sensitive)
          .map(([fieldKey, _]) => fieldKey)
        
        const configuredFields = requiredFields.filter(fieldKey => 
          settings[fieldKey] && settings[fieldKey].trim() !== ''
        )
        
        status[sectionName] = {
          name: sectionConfig.title,
          configured: requiredFields.length === 0 || configuredFields.length > 0,
          status: 'unknown'
        }
      }
      
      return status
    } catch (error) {
      logger.error('Failed to get provider status:', error)
      throw error
    }
  }

  async getStructuredSettings() {
    try {
      await this.db.read()
      const schema = this.db.data.schema
      const settings = this.db.data.settings
      
      const structured = {}
      
      for (const [sectionName, sectionConfig] of Object.entries(schema.sections || {})) {
        structured[sectionName] = {}
        
        for (const [fieldKey, fieldConfig] of Object.entries(sectionConfig.fields)) {
          const value = settings[fieldKey] || ''
          structured[sectionName][fieldKey] = {
            value: fieldConfig.sensitive ? this.maskSensitiveValue(value) : value,
            label: fieldConfig.label,
            description: fieldConfig.description,
            type: fieldConfig.type,
            required: fieldConfig.required,
            sensitive: fieldConfig.sensitive,
            default: fieldConfig.default
          }
        }
      }
      
      return structured
    } catch (error) {
      logger.error('Failed to get structured settings:', error)
      throw error
    }
  }

  maskSensitiveValue(value) {
    if (!value || value.trim() === '') {
      return ''
    }
    if (value.length <= 8) {
      return '*'.repeat(8)
    }
    return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4)
  }

  async validateSettings(settings) {
    try {
      await this.db.read()
      const schema = this.db.data.schema
      const errors = []
      
      for (const [key, value] of Object.entries(settings)) {
        const fieldConfig = this.findFieldConfig(key, schema)
        if (fieldConfig) {
          // Type validation
          if (fieldConfig.type === 'url' && value) {
            try {
              new URL(value)
            } catch {
              errors.push(`${key}: Invalid URL format`)
            }
          }
          
          if (fieldConfig.type === 'number' && value && isNaN(Number(value))) {
            errors.push(`${key}: Must be a valid number`)
          }
          
          // Required validation
          if (fieldConfig.required && (!value || value.trim() === '')) {
            errors.push(`${key}: This field is required`)
          }
        }
      }
      
      return {
        valid: errors.length === 0,
        errors
      }
    } catch (error) {
      logger.error('Failed to validate settings:', error)
      throw error
    }
  }

  findFieldConfig(fieldKey, schema) {
    for (const sectionConfig of Object.values(schema.sections || {})) {
      if (sectionConfig.fields[fieldKey]) {
        return sectionConfig.fields[fieldKey]
      }
    }
    return null
  }

  async resetToDefaults() {
    try {
      const defaultData = await this.loadDefaultConfig()
      this.db.data = defaultData
      await this.db.write()
      
      logger.info('Reset environment settings to defaults')
      return this.db.data.settings
    } catch (error) {
      logger.error('Failed to reset to defaults:', error)
      throw error
    }
  }

  async getDefaults() {
    try {
      const defaultData = await this.loadDefaultConfig()
      return defaultData.settings
    } catch (error) {
      logger.error('Failed to get defaults:', error)
      throw error
    }
  }

  async exportSettings() {
    try {
      await this.db.read()
      return {
        settings: this.db.data.settings,
        metadata: this.db.data.metadata,
        exportedAt: new Date().toISOString()
      }
    } catch (error) {
      logger.error('Failed to export settings:', error)
      throw error
    }
  }

  async importSettings(importData) {
    try {
      await this.db.read()
      
      if (!importData.settings || typeof importData.settings !== 'object') {
        throw new Error('Invalid import data format')
      }
      
      // Validate imported settings
      const validation = await this.validateSettings(importData.settings)
      if (!validation.valid) {
        throw new Error(`Invalid settings: ${validation.errors.join(', ')}`)
      }
      
      this.db.data.settings = {
        ...this.db.data.settings,
        ...importData.settings
      }
      
      this.db.data.metadata = {
        ...this.db.data.metadata,
        lastUpdated: new Date().toISOString()
      }
      
      await this.db.write()
      
      logger.info('Imported environment settings')
      return this.db.data.settings
    } catch (error) {
      logger.error('Failed to import settings:', error)
      throw error
    }
  }

  async getMetadata() {
    try {
      await this.db.read()
      return this.db.data.metadata || {}
    } catch (error) {
      logger.error('Failed to get metadata:', error)
      throw error
    }
  }
}

export default new EnvironmentDbService()
