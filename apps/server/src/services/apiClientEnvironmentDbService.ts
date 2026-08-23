/* eslint-disable max-lines */
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger.ts';

export interface ApiClientEnvVariable {
  key: string;
  value: string;
  enabled?: boolean;
  type?: string;
}

export interface ApiClientEnvironment {
  id: string;
  name: string;
  values: ApiClientEnvVariable[];
  _api_client_variable_scope?: string;
  _api_client_exported_at?: string;
  _api_client_exported_using?: string;
  [key: string]: any;
}

export interface EnvironmentIndexItem {
  id: string;
  name: string;
  filePath: string;
  createdAt: string;
  updatedAt: string;
  imported?: boolean;
  values?: ApiClientEnvVariable[];
  _api_client_variable_scope?: string;
  _api_client_exported_at?: string;
  _api_client_exported_using?: string;
}

export interface EnvironmentIndexData {
  environments: EnvironmentIndexItem[];
  activeEnvironmentId: string | null;
  metadata: {
    version: string;
    createdAt: string;
    lastUpdated: string;
  };
}

class ApiClientEnvironmentDbService {
  environmentsDir: string;
  indexPath: string;

  constructor() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.ai-workflow-utils');
    this.environmentsDir = path.join(configDir, 'api-client-environments');
    this.indexPath = path.join(this.environmentsDir, 'index.json');

    this.initDirectories();
    logger.info(`API Client Environment database initialized at: ${this.environmentsDir}`);
  }

  async initDirectories(): Promise<void> {
    try {
      if (!existsSync(this.environmentsDir)) {
        await fs.mkdir(this.environmentsDir, { recursive: true });
      }
      await this.initIndex();
    } catch (error: any) {
      logger.error('Failed to initialize directories:', error);
      throw error;
    }
  }

  async initIndex(): Promise<void> {
    try {
      if (!existsSync(this.indexPath)) {
        const indexData: EnvironmentIndexData = {
          environments: [],
          activeEnvironmentId: null,
          metadata: {
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
          },
        };
        await fs.writeFile(this.indexPath, JSON.stringify(indexData, null, 2));
      }
    } catch (error: any) {
      logger.error('Failed to initialize index:', error);
      throw error;
    }
  }

  async getIndex(): Promise<EnvironmentIndexData> {
    const data = await fs.readFile(this.indexPath, 'utf8');
    return JSON.parse(data);
  }

  async updateIndex(indexData: EnvironmentIndexData): Promise<void> {
    indexData.metadata.lastUpdated = new Date().toISOString();
    await fs.writeFile(this.indexPath, JSON.stringify(indexData, null, 2));
  }

  async createEnvironment(environmentData: { name: string; variables?: any }): Promise<ApiClientEnvironment> {
    try {
      const id = uuidv4();
      const timestamp = new Date().toISOString();

      let variables = environmentData.variables || [];

      if (variables && typeof variables === 'object' && !Array.isArray(variables)) {
        variables = Object.entries(variables).map(([key, value]) => ({
          key,
          value: String(value),
          enabled: true,
          type: 'default',
        }));
      }

      const apiClientEnvironment: ApiClientEnvironment = {
        name: environmentData.name,
        id,
        values: Array.isArray(variables)
          ? variables.map((v: any) => ({
              key: v.key || '',
              value: v.value || '',
              enabled: v.enabled !== false,
              type: v.type || 'default',
            }))
          : [],
        _api_client_variable_scope: 'environment',
        _api_client_exported_at: timestamp,
        _api_client_exported_using: 'AI Workflow Utils',
      };

      const environmentPath = path.join(this.environmentsDir, `${id}.json`);
      await fs.writeFile(environmentPath, JSON.stringify(apiClientEnvironment, null, 2));

      const indexData = await this.getIndex();
      indexData.environments.push({
        id,
        name: apiClientEnvironment.name,
        filePath: environmentPath,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      if (indexData.environments.length === 1) {
        indexData.activeEnvironmentId = id;
      }

      await this.updateIndex(indexData);
      return apiClientEnvironment;
    } catch (error: any) {
      logger.error('Failed to create environment:', error);
      throw error;
    }
  }

  async getEnvironments(): Promise<{ environments: EnvironmentIndexItem[]; activeEnvironmentId: string | null }> {
    const indexData = await this.getIndex();

    const environmentsWithData: EnvironmentIndexItem[] = await Promise.all(
      indexData.environments.map(async (envInfo: EnvironmentIndexItem) => {
        try {
          const envData = await fs.readFile(envInfo.filePath, 'utf8');
          const fullEnvironment = JSON.parse(envData);
          return {
            ...envInfo,
            values: fullEnvironment.values || [],
            _api_client_variable_scope: fullEnvironment._api_client_variable_scope,
            _api_client_exported_at: fullEnvironment._api_client_exported_at,
            _api_client_exported_using: fullEnvironment._api_client_exported_using,
          };
        } catch (error: any) {
          logger.warn(`Failed to load environment data for ${envInfo.id}:`, error.message);
          return {
            ...envInfo,
            values: [],
          };
        }
      })
    );

    return {
      environments: environmentsWithData,
      activeEnvironmentId: indexData.activeEnvironmentId,
    };
  }

  async getEnvironment(id: string): Promise<ApiClientEnvironment> {
    const indexData = await this.getIndex();
    const environmentInfo = indexData.environments.find(env => env.id === id);

    if (!environmentInfo) {
      throw new Error(`Environment not found: ${id}`);
    }

    const data = await fs.readFile(environmentInfo.filePath, 'utf8');
    return JSON.parse(data);
  }

  async updateEnvironment(id: string, updates: { name?: string; variables?: any }): Promise<ApiClientEnvironment> {
    try {
      const indexData = await this.getIndex();
      const environmentInfo = indexData.environments.find(env => env.id === id);

      if (!environmentInfo) {
        throw new Error(`Environment not found: ${id}`);
      }

      const currentData = await fs.readFile(environmentInfo.filePath, 'utf8');
      const currentEnvironment: ApiClientEnvironment = JSON.parse(currentData);

      let { variables } = updates;
      if (variables) {
        if (typeof variables === 'object' && !Array.isArray(variables)) {
          variables = Object.entries(variables).map(([key, value]) => ({
            key,
            value: String(value),
            enabled: true,
            type: 'default',
          }));
        }
      }

      const updatedEnvironment: ApiClientEnvironment = {
        ...currentEnvironment,
        name: updates.name || currentEnvironment.name,
        values: variables
          ? variables.map((variable: any) => ({
              key: variable.key || '',
              value: variable.value || '',
              enabled: variable.enabled !== false,
              type: variable.type || 'default',
            }))
          : currentEnvironment.values,
        _api_client_exported_at: new Date().toISOString(),
      };

      await fs.writeFile(environmentInfo.filePath, JSON.stringify(updatedEnvironment, null, 2));

      const envIndex = indexData.environments.findIndex(env => env.id === id);
      indexData.environments[envIndex] = {
        ...indexData.environments[envIndex],
        name: updatedEnvironment.name,
        updatedAt: new Date().toISOString(),
      };

      await this.updateIndex(indexData);
      return updatedEnvironment;
    } catch (error: any) {
      logger.error(`Failed to update environment ${id}:`, error);
      throw error;
    }
  }

  async deleteEnvironment(id: string): Promise<{ success: boolean }> {
    try {
      const indexData = await this.getIndex();
      const environmentInfo = indexData.environments.find(env => env.id === id);

      if (!environmentInfo) {
        throw new Error(`Environment not found: ${id}`);
      }

      await fs.unlink(environmentInfo.filePath);
      indexData.environments = indexData.environments.filter(env => env.id !== id);

      if (indexData.activeEnvironmentId === id) {
        indexData.activeEnvironmentId = indexData.environments.length > 0 ? indexData.environments[0].id : null;
      }

      await this.updateIndex(indexData);
      return { success: true };
    } catch (error: any) {
      logger.error(`Failed to delete environment ${id}:`, error);
      throw error;
    }
  }

  async setActiveEnvironment(id: string): Promise<{ success: boolean }> {
    const indexData = await this.getIndex();
    const environmentExists = indexData.environments.some(env => env.id === id);

    if (!environmentExists) {
      throw new Error(`Environment not found: ${id}`);
    }

    indexData.activeEnvironmentId = id;
    await this.updateIndex(indexData);
    return { success: true };
  }

  async getActiveEnvironment(): Promise<ApiClientEnvironment | null> {
    const indexData = await this.getIndex();

    if (!indexData.activeEnvironmentId) {
      return null;
    }

    return await this.getEnvironment(indexData.activeEnvironmentId);
  }

  async importEnvironment(apiClientEnvironment: any): Promise<ApiClientEnvironment> {
    logger.info('Importing environment:', {
      name: apiClientEnvironment?.name,
      hasValues: Array.isArray(apiClientEnvironment?.values),
    });

    if (!apiClientEnvironment.name) {
      throw new Error('Invalid environment format: name is required');
    }

    let values: any[] = [];

    if (Array.isArray(apiClientEnvironment.values)) {
      values = apiClientEnvironment.values;
      logger.info('Using API Client v2.1 format with values array');
    } else if (apiClientEnvironment.variables && typeof apiClientEnvironment.variables === 'object') {
      values = Object.entries(apiClientEnvironment.variables).map(([key, value]) => ({
        key,
        value: String(value),
        enabled: true,
        type: 'default',
      }));
      logger.info('Using simplified format with variables object');
    } else {
      throw new Error('Invalid environment format: must have either values array or variables object');
    }

    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const normalizedEnvironment: ApiClientEnvironment = {
      id,
      name: apiClientEnvironment.name,
      values: values.map(variable => ({
        key: variable.key || '',
        value: variable.value || '',
        enabled: variable.enabled !== false,
        type: variable.type || 'default',
      })),
      _api_client_variable_scope: 'environment',
      _api_client_exported_at: timestamp,
      _api_client_exported_using: 'AI Workflow Utils',
    };

    const environmentPath = path.join(this.environmentsDir, `${id}.json`);
    await fs.writeFile(environmentPath, JSON.stringify(normalizedEnvironment, null, 2));

    const indexData = await this.getIndex();
    indexData.environments.push({
      id,
      name: normalizedEnvironment.name,
      filePath: environmentPath,
      createdAt: timestamp,
      updatedAt: timestamp,
      imported: true,
    });

    await this.updateIndex(indexData);
    return normalizedEnvironment;
  }

  async exportEnvironment(id: string): Promise<ApiClientEnvironment> {
    return await this.getEnvironment(id);
  }

  async exportAllEnvironments(): Promise<{ environments: ApiClientEnvironment[]; metadata: Record<string, any> }> {
    const indexData = await this.getIndex();
    const environments: ApiClientEnvironment[] = [];

    for (const envInfo of indexData.environments) {
      const environment = await this.getEnvironment(envInfo.id);
      environments.push(environment);
    }

    return {
      environments,
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: 'AI Workflow Utils',
        totalCount: environments.length,
      },
    };
  }
}

export default new ApiClientEnvironmentDbService();
