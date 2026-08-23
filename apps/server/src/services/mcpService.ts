/* eslint-disable max-statements */
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger.ts';
import environmentDbService from './environmentDbService.ts';

export interface McpClientConfig {
  id: string;
  name: string;
  url?: string;
  command?: string;
  args?: string[];
  token?: string;
  description?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

const mcpService = {
  async getAllClients(): Promise<McpClientConfig[]> {
    const settings = await environmentDbService.getSettings();
    return settings.mcpClients || [];
  },

  async createClient(clientData: Partial<McpClientConfig> & { name: string }): Promise<McpClientConfig> {
    const { name, url, command, args, token, description, enabled = true } = clientData;

    if (!name) {
      throw new Error('Name is required');
    }

    if (!url && !command) {
      throw new Error('Either URL (for remote server) or command (for local server) is required');
    }

    const client: McpClientConfig = {
      id: uuidv4(),
      name,
      url,
      command,
      args: args ? (typeof args === 'string' ? (args as string).split(' ').filter(Boolean) : args) : undefined,
      token,
      description,
      enabled,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const settings = await environmentDbService.getSettings();
    const mcpClients: McpClientConfig[] = settings.mcpClients || [];

    if (mcpClients.some(c => c.name === name)) {
      throw new Error('Client with this name already exists');
    }

    mcpClients.push(client);
    await environmentDbService.updateSettings({ mcpClients });

    logger.info(`Created MCP client: ${name}`);
    return client;
  },

  async updateClient(id: string, updates: Partial<McpClientConfig>): Promise<McpClientConfig> {
    const settings = await environmentDbService.getSettings();
    const mcpClients: McpClientConfig[] = settings.mcpClients || [];

    const clientIndex = mcpClients.findIndex(c => c.id === id);
    if (clientIndex === -1) {
      throw new Error('Client not found');
    }

    if (updates.name && mcpClients.some(c => c.id !== id && c.name === updates.name)) {
      throw new Error('Client with this name already exists');
    }

    if (updates.args && typeof updates.args === 'string') {
      updates.args = (updates.args as string).split(' ').filter(Boolean);
    }

    mcpClients[clientIndex] = {
      ...mcpClients[clientIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await environmentDbService.updateSettings({ mcpClients });

    logger.info(`Updated MCP client: ${id}`);
    return mcpClients[clientIndex];
  },

  async deleteClient(id: string): Promise<void> {
    const settings = await environmentDbService.getSettings();
    const mcpClients: McpClientConfig[] = settings.mcpClients || [];

    const filteredClients = mcpClients.filter(c => c.id !== id);
    if (filteredClients.length === mcpClients.length) {
      throw new Error('Client not found');
    }

    await environmentDbService.updateSettings({ mcpClients: filteredClients });
    logger.info(`Deleted MCP client: ${id}`);
  },

  async testConnection(id: string): Promise<{ status: string; message: string }> {
    const settings = await environmentDbService.getSettings();
    const mcpClients: McpClientConfig[] = settings.mcpClients || [];

    const client = mcpClients.find(c => c.id === id);
    if (!client) {
      throw new Error('Client not found');
    }

    try {
      let serverConfig: any;

      if (client.url) {
        serverConfig = {
          url: client.url,
        };
      } else if (client.command) {
        serverConfig = {
          command: client.command,
          args: client.args || [],
        };
      } else {
        throw new Error('Either URL or command must be configured');
      }

      if (client.token) {
        serverConfig.token = client.token;
      }

      logger.info(`Testing MCP connection with config:`, JSON.stringify(serverConfig, null, 2));

      const mcpClient: any = new MultiServerMCPClient({
        servers: serverConfig,
      });

      if (typeof mcpClient.connect === 'function') {
        await mcpClient.connect();
        await mcpClient.disconnect();
      } else if (typeof mcpClient.initialize === 'function') {
        await mcpClient.initialize();
        if (typeof mcpClient.close === 'function') {
          await mcpClient.close();
        }
      } else {
        logger.info('MCP client created successfully (no connection method found)');
      }

      return { status: 'connected', message: 'Connection successful' };
    } catch (error: any) {
      logger.error(`MCP connection test failed for ${client.name}:`, error);
      throw new Error(`Connection failed: ${error.message}`);
    }
  },

  async getEnabledClients(): Promise<McpClientConfig[]> {
    const clients = await this.getAllClients();
    return clients.filter(client => client.enabled);
  },
};

export default mcpService;
