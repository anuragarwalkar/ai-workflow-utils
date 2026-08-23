import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import os from 'os';
import path from 'path';
import fs from 'fs';
import logger from '../logger.ts';
import { config as fallbackConfig } from '@ai-workflow-utils/data';

export interface FieldConfig {
  type?: string;
  required?: boolean;
  sensitive?: boolean;
  default?: any;
  label?: string;
  description?: string;
}

export interface SectionConfig {
  title: string;
  fields: Record<string, FieldConfig>;
}

export interface EnvironmentSchema {
  providers: Record<string, any>;
  sections: Record<string, SectionConfig>;
}

export interface EnvironmentMetadata {
  version: string;
  lastUpdated: string;
  createdAt: string;
}

export interface EnvironmentDbData {
  schema: EnvironmentSchema;
  settings: Record<string, any>;
  metadata: EnvironmentMetadata;
}

class EnvironmentDbService {
  adapter: JSONFile<EnvironmentDbData>;
  db: Low<EnvironmentDbData>;

  constructor() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.ai-workflow-utils');
    const dbPath = path.join(configDir, 'environment.json');

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
      logger.info(`Created config directory: ${configDir}`);
    }

    this.adapter = new JSONFile<EnvironmentDbData>(dbPath);
    this.db = new Low<EnvironmentDbData>(this.adapter, {
      schema: { providers: {}, sections: {} },
      settings: {},
      metadata: {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    });
    logger.info(`Environment database initialized at: ${dbPath}`);
  }

  async loadDefaultConfig(): Promise<EnvironmentDbData> {
    try {
      const candidates = [
        path.join(process.cwd(), './libs/data/src/config.json'),
        path.join(process.cwd(), './dist/libs/data/config.json'),
        path.join(process.cwd(), './data/config.json'),
      ];

      let configSchema: any = null;
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          configSchema = JSON.parse(fs.readFileSync(candidate, 'utf8'));
          break;
        }
      }

      if (!configSchema) {
        configSchema = fallbackConfig;
      }

      const defaultSettings: Record<string, any> = {};
      for (const [_, sectionConfig] of Object.entries(configSchema.sections || {})) {
        for (const [fieldKey, fieldConfig] of Object.entries((sectionConfig as any).fields || {})) {
          if ((fieldConfig as any).default) {
            defaultSettings[fieldKey] = (fieldConfig as any).default;
          }
        }
      }

      const defaultProviders: Record<string, any> = {};
      for (const [providerType, providerConfig] of Object.entries(configSchema.providers || {})) {
        defaultProviders[`${providerType}_provider`] = (providerConfig as any).default;
      }

      return {
        schema: configSchema,
        settings: {
          ...defaultSettings,
          ...defaultProviders,
        },
        metadata: {
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      logger.error('Failed to load default config from file:', error);
      return {
        schema: { providers: {}, sections: {} },
        settings: {},
        metadata: {
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      };
    }
  }

  async init(): Promise<boolean> {
    try {
      await this.db.read();

      const defaultData = await this.loadDefaultConfig();

      if (!this.db.data || !this.db.data.schema) {
        this.db.data = defaultData;
        logger.info('Environment database initialized with default configuration');
      } else {
        this.db.data.schema = defaultData.schema;
      }

      await this.db.write();
      return true;
    } catch (error: any) {
      logger.error('Failed to initialize environment database:', error);
      throw error;
    }
  }

  async getSchema(): Promise<EnvironmentSchema> {
    try {
      await this.db.read();
      return this.db.data.schema || { providers: {}, sections: {} };
    } catch (error: any) {
      logger.error('Failed to get schema:', error);
      throw error;
    }
  }

  async getSettings(): Promise<Record<string, any>> {
    try {
      await this.db.read();
      return this.db.data.settings || {};
    } catch (error: any) {
      logger.error('Failed to get settings:', error);
      throw error;
    }
  }

  async updateSettings(updates: Record<string, any>): Promise<Record<string, any>> {
    try {
      await this.db.read();

      const updatedSettings: Record<string, any> = {};
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined && value !== null) {
          updatedSettings[key] = value;
        }
      }

      this.db.data.settings = {
        ...this.db.data.settings,
        ...updatedSettings,
      };

      this.db.data.metadata = {
        ...this.db.data.metadata,
        lastUpdated: new Date().toISOString(),
      };

      await this.db.write();

      logger.info('Updated environment settings');
      return this.db.data.settings;
    } catch (error: any) {
      logger.error('Failed to update settings:', error);
      throw error;
    }
  }

  async getProviders(): Promise<Record<string, any>> {
    try {
      await this.db.read();
      const { schema } = this.db.data;
      const { settings } = this.db.data;

      const providers: Record<string, any> = {};

      for (const [providerType, providerConfig] of Object.entries(schema.providers || {})) {
        providers[providerType] = {
          ...providerConfig,
          currentSelection: this.getCurrentSelection(providerType, settings),
        };
      }

      return providers;
    } catch (error: any) {
      logger.error('Failed to get providers:', error);
      throw error;
    }
  }

  getCurrentSelection(providerType: string, settings: Record<string, any>): any {
    const providerKey = `${providerType}_provider`;
    return settings[providerKey] || this.db.data.schema.providers[providerType]?.default;
  }

  async getProviderStatus(): Promise<Record<string, any>> {
    try {
      await this.db.read();
      const { schema } = this.db.data;
      const { settings } = this.db.data;

      const status: Record<string, any> = {};

      for (const [sectionName, sectionConfig] of Object.entries(schema.sections || {})) {
        const requiredFields = Object.entries(sectionConfig.fields)
          .filter(([_, fieldConfig]) => fieldConfig.required || fieldConfig.sensitive)
          .map(([fieldKey, _]) => fieldKey);

        const configuredFields = requiredFields.filter(
          fieldKey => settings[fieldKey] && String(settings[fieldKey]).trim() !== ''
        );

        status[sectionName] = {
          name: sectionConfig.title,
          configured: requiredFields.length === 0 || configuredFields.length > 0,
          status: 'unknown',
        };
      }

      return status;
    } catch (error: any) {
      logger.error('Failed to get provider status:', error);
      throw error;
    }
  }

  async getStructuredSettings(): Promise<Record<string, any>> {
    try {
      await this.db.read();
      const { schema } = this.db.data;
      const { settings } = this.db.data;

      const structured: Record<string, any> = {};

      for (const [sectionName, sectionConfig] of Object.entries(schema.sections || {})) {
        structured[sectionName] = {};

        for (const [fieldKey, fieldConfig] of Object.entries(sectionConfig.fields)) {
          const value = settings[fieldKey] || '';
          structured[sectionName][fieldKey] = {
            value: fieldConfig.sensitive ? this.maskSensitiveValue(value) : value,
            label: fieldConfig.label,
            description: fieldConfig.description,
            type: fieldConfig.type,
            required: fieldConfig.required,
            sensitive: fieldConfig.sensitive,
            default: fieldConfig.default,
          };
        }
      }

      return structured;
    } catch (error: any) {
      logger.error('Failed to get structured settings:', error);
      throw error;
    }
  }

  maskSensitiveValue(value: string): string {
    if (!value || typeof value !== 'string' || value.trim() === '') {
      return '';
    }
    if (value.length <= 8) {
      return '*'.repeat(8);
    }
    return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
  }

  async validateSettings(settings: Record<string, any>): Promise<{ valid: boolean; errors: string[] }> {
    try {
      await this.db.read();
      const { schema } = this.db.data;
      const errors: string[] = [];

      for (const [key, value] of Object.entries(settings)) {
        const fieldConfig = this.findFieldConfig(key, schema);
        if (fieldConfig) {
          if (fieldConfig.type === 'url' && value) {
            try {
              new URL(value);
            } catch {
              errors.push(`${key}: Invalid URL format`);
            }
          }

          if (fieldConfig.type === 'number' && value && isNaN(Number(value))) {
            errors.push(`${key}: Must be a valid number`);
          }

          if (fieldConfig.required && (!value || String(value).trim() === '')) {
            errors.push(`${key}: This field is required`);
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error: any) {
      logger.error('Failed to validate settings:', error);
      throw error;
    }
  }

  findFieldConfig(fieldKey: string, schema: EnvironmentSchema): FieldConfig | null {
    for (const sectionConfig of Object.values(schema.sections || {})) {
      if (sectionConfig.fields[fieldKey]) {
        return sectionConfig.fields[fieldKey];
      }
    }
    return null;
  }

  async resetToDefaults(): Promise<Record<string, any>> {
    try {
      const defaultData = await this.loadDefaultConfig();
      this.db.data = defaultData;
      await this.db.write();

      logger.info('Reset environment settings to defaults');
      return this.db.data.settings;
    } catch (error: any) {
      logger.error('Failed to reset to defaults:', error);
      throw error;
    }
  }

  async getDefaults(): Promise<Record<string, any>> {
    try {
      const defaultData = await this.loadDefaultConfig();
      return defaultData.settings;
    } catch (error: any) {
      logger.error('Failed to get defaults:', error);
      throw error;
    }
  }

  async exportSettings(): Promise<{ settings: Record<string, any>; metadata: EnvironmentMetadata; exportedAt: string }> {
    try {
      await this.db.read();
      return {
        settings: this.db.data.settings,
        metadata: this.db.data.metadata,
        exportedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('Failed to export settings:', error);
      throw error;
    }
  }

  async importSettings(importData: { settings: Record<string, any> }): Promise<Record<string, any>> {
    try {
      await this.db.read();

      if (!importData.settings || typeof importData.settings !== 'object') {
        throw new Error('Invalid import data format');
      }

      const validation = await this.validateSettings(importData.settings);
      if (!validation.valid) {
        throw new Error(`Invalid settings: ${validation.errors.join(', ')}`);
      }

      this.db.data.settings = {
        ...this.db.data.settings,
        ...importData.settings,
      };

      this.db.data.metadata = {
        ...this.db.data.metadata,
        lastUpdated: new Date().toISOString(),
      };

      await this.db.write();

      logger.info('Imported environment settings');
      return this.db.data.settings;
    } catch (error: any) {
      logger.error('Failed to import settings:', error);
      throw error;
    }
  }

  async getMetadata(): Promise<EnvironmentMetadata | Record<string, any>> {
    try {
      await this.db.read();
      return this.db.data.metadata || {};
    } catch (error: any) {
      logger.error('Failed to get metadata:', error);
      throw error;
    }
  }
}

export default new EnvironmentDbService();
