/* eslint-disable max-lines */
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger.js';

class ApiClientEnvironmentDbService {
  constructor() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.ai-workflow-utils');
    this.environmentsDir = path.join(configDir, 'api-client-environments');
    this.indexPath = path.join(this.environmentsDir, 'index.json');
    
    this.initDirectories();
    logger.info(`API Client Environment database initialized at: ${this.environmentsDir}`);
  }

  async initDirectories() {
    try {
      if (!existsSync(this.environmentsDir)) {
        await fs.mkdir(this.environmentsDir, { recursive: true });
      }
      await this.initIndex();
    } catch (error) {
      logger.error('Failed to initialize directories:', error);
      throw error;
    }
  }

  async initIndex() {
    try {
      if (!existsSync(this.indexPath)) {
        const indexData = {
          environments: [],
          activeEnvironmentId: null,
          metadata: {
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          }
        };
        await fs.writeFile(this.indexPath, JSON.stringify(indexData, null, 2));
      }
    } catch (error) {
      logger.error('Failed to initialize index:', error);
      throw error;
    }
  }

  async getIndex() {
    const data = await fs.readFile(this.indexPath, 'utf8');
    return JSON.parse(data);
  }

  async updateIndex(indexData) {
    indexData.metadata.lastUpdated = new Date().toISOString();
    await fs.writeFile(this.indexPath, JSON.stringify(indexData, null, 2));
  }

  async createEnvironment(environmentData) {
    try {
      const id = uuidv4();
      const timestamp = new Date().toISOString();
      
      // Handle variables in different formats
      let variables = environmentData.variables || [];
      
      // If variables is an object, convert it to array format
      if (variables && typeof variables === 'object' && !Array.isArray(variables)) {
        variables = Object.entries(variables).map(([key, value]) => ({
          key,
          value,
          enabled: true,
          type: 'default'
        }));
      }
      
      const postmanEnvironment = {
        id,
        name: environmentData.name || 'New Environment',
        values: variables.map(variable => ({
          key: variable.key || '',
          value: variable.value || '',
          enabled: variable.enabled !== false,
          type: variable.type || 'default'
        })),
        _postman_variable_scope: 'environment',
        _postman_exported_at: timestamp,
        _postman_exported_using: 'AI Workflow Utils'
      };

      const environmentPath = path.join(this.environmentsDir, `${id}.json`);
      await fs.writeFile(environmentPath, JSON.stringify(postmanEnvironment, null, 2));

      const indexData = await this.getIndex();
      indexData.environments.push({
        id,
        name: postmanEnvironment.name,
        filePath: environmentPath,
        createdAt: timestamp,
        updatedAt: timestamp
      });

      if (indexData.environments.length === 1) {
        indexData.activeEnvironmentId = id;
      }

      await this.updateIndex(indexData);
      return postmanEnvironment;
    } catch (error) {
      logger.error('Failed to create environment:', error);
      throw error;
    }
  }

  async getEnvironments() {
    const indexData = await this.getIndex();
    
    // Load full environment data for each environment
    const environmentsWithData = await Promise.all(
      indexData.environments.map(async (envInfo) => {
        try {
          const envData = await fs.readFile(envInfo.filePath, 'utf8');
          const fullEnvironment = JSON.parse(envData);
          return {
            ...envInfo,
            values: fullEnvironment.values || [],
            _postman_variable_scope: fullEnvironment._postman_variable_scope,
            _postman_exported_at: fullEnvironment._postman_exported_at,
            _postman_exported_using: fullEnvironment._postman_exported_using
          };
        } catch (error) {
          logger.warn(`Failed to load environment data for ${envInfo.id}:`, error.message);
          return {
            ...envInfo,
            values: []
          };
        }
      })
    );
    
    return {
      environments: environmentsWithData,
      activeEnvironmentId: indexData.activeEnvironmentId
    };
  }

  async getEnvironment(id) {
    const indexData = await this.getIndex();
    const environmentInfo = indexData.environments.find(env => env.id === id);
    
    if (!environmentInfo) {
      throw new Error(`Environment not found: ${id}`);
    }

    const data = await fs.readFile(environmentInfo.filePath, 'utf8');
    return JSON.parse(data);
  }

  async updateEnvironment(id, updates) {
    try {
      const indexData = await this.getIndex();
      const environmentInfo = indexData.environments.find(env => env.id === id);
      
      if (!environmentInfo) {
        throw new Error(`Environment not found: ${id}`);
      }

      const currentData = await fs.readFile(environmentInfo.filePath, 'utf8');
      const currentEnvironment = JSON.parse(currentData);
      
      // Handle variables in different formats for updates
      let { variables } = updates;
      if (variables) {
        // If variables is an object, convert it to array format
        if (typeof variables === 'object' && !Array.isArray(variables)) {
          variables = Object.entries(variables).map(([key, value]) => ({
            key,
            value,
            enabled: true,
            type: 'default'
          }));
        }
      }
      
      const updatedEnvironment = {
        ...currentEnvironment,
        name: updates.name || currentEnvironment.name,
        values: variables ? variables.map(variable => ({
          key: variable.key || '',
          value: variable.value || '',
          enabled: variable.enabled !== false,
          type: variable.type || 'default'
        })) : currentEnvironment.values,
        _postman_exported_at: new Date().toISOString()
      };

      await fs.writeFile(environmentInfo.filePath, JSON.stringify(updatedEnvironment, null, 2));

      const envIndex = indexData.environments.findIndex(env => env.id === id);
      indexData.environments[envIndex] = {
        ...indexData.environments[envIndex],
        name: updatedEnvironment.name,
        updatedAt: new Date().toISOString()
      };

      await this.updateIndex(indexData);
      return updatedEnvironment;
    } catch (error) {
      logger.error(`Failed to update environment ${id}:`, error);
      throw error;
    }
  }

  async deleteEnvironment(id) {
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
    } catch (error) {
      logger.error(`Failed to delete environment ${id}:`, error);
      throw error;
    }
  }

  async setActiveEnvironment(id) {
    const indexData = await this.getIndex();
    const environmentExists = indexData.environments.some(env => env.id === id);
    
    if (!environmentExists) {
      throw new Error(`Environment not found: ${id}`);
    }

    indexData.activeEnvironmentId = id;
    await this.updateIndex(indexData);
    return { success: true };
  }

  async getActiveEnvironment() {
    const indexData = await this.getIndex();
    
    if (!indexData.activeEnvironmentId) {
      return null;
    }

    return await this.getEnvironment(indexData.activeEnvironmentId);
  }

  async importEnvironment(postmanEnvironment) {
    logger.info('Importing environment:', { name: postmanEnvironment?.name, hasValues: Array.isArray(postmanEnvironment?.values) });
    
    // Handle both Postman v2.1 format (with values array) and simplified format (with variables object)
    if (!postmanEnvironment.name) {
      throw new Error('Invalid environment format: name is required');
    }

    let values = [];
    
    // Check if it's Postman v2.1 format with values array
    if (Array.isArray(postmanEnvironment.values)) {
      // eslint-disable-next-line prefer-destructuring
      values = postmanEnvironment.values;
      logger.info('Using Postman v2.1 format with values array');
    }
    // Check if it's simplified format with variables object
    else if (postmanEnvironment.variables && typeof postmanEnvironment.variables === 'object') {
      values = Object.entries(postmanEnvironment.variables).map(([key, value]) => ({
        key,
        value: String(value),
        enabled: true,
        type: 'default'
      }));
      logger.info('Using simplified format with variables object');
    }
    else {
      logger.error('Invalid environment format received:', { 
        hasValues: !!postmanEnvironment.values, 
        valuesType: typeof postmanEnvironment.values,
        hasVariables: !!postmanEnvironment.variables,
        variablesType: typeof postmanEnvironment.variables
      });
      throw new Error('Invalid environment format: must have either values array or variables object');
    }

    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const normalizedEnvironment = {
      id,
      name: postmanEnvironment.name,
      values: values.map(variable => ({
        key: variable.key || '',
        value: variable.value || '',
        enabled: variable.enabled !== false,
        type: variable.type || 'default'
      })),
      _postman_variable_scope: 'environment',
      _postman_exported_at: timestamp,
      _postman_exported_using: 'AI Workflow Utils'
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
      imported: true
    });

    await this.updateIndex(indexData);
    return normalizedEnvironment;
  }

  async exportEnvironment(id) {
    return await this.getEnvironment(id);
  }

  async exportAllEnvironments() {
    const indexData = await this.getIndex();
    const environments = [];

    for (const envInfo of indexData.environments) {
      const environment = await this.getEnvironment(envInfo.id);
      environments.push(environment);
    }

    return {
      environments,
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: 'AI Workflow Utils',
        totalCount: environments.length
      }
    };
  }
}

export default new ApiClientEnvironmentDbService();
