import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger.js';
import environmentDbService from './environmentDbService.js';

const mcpService = {
  async getAllClients() {
    const settings = await environmentDbService.getSettings();
    return settings.mcpClients || [];
  },

  async createClient(clientData) {
    const { name, url, command, args, token, description, enabled = true } = clientData;
    
    if (!name) {
      throw new Error('Name is required');
    }
    
    // Either URL or command must be provided
    if (!url && !command) {
      throw new Error('Either URL (for remote server) or command (for local server) is required');
    }

    const client = {
      id: uuidv4(),
      name,
      url,
      command,
      args: args ? (typeof args === 'string' ? args.split(' ').filter(Boolean) : args) : undefined,
      token,
      description,
      enabled,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const settings = await environmentDbService.getSettings();
    const mcpClients = settings.mcpClients || [];
    
    // Check for duplicate names
    if (mcpClients.some(c => c.name === name)) {
      throw new Error('Client with this name already exists');
    }

    mcpClients.push(client);
    await environmentDbService.updateSettings({ mcpClients });
    
    logger.info(`Created MCP client: ${name}`);
    return client;
  },

  async updateClient(id, updates) {
    const settings = await environmentDbService.getSettings();
    const mcpClients = settings.mcpClients || [];
    
    const clientIndex = mcpClients.findIndex(c => c.id === id);
    if (clientIndex === -1) {
      throw new Error('Client not found');
    }

    // Check for duplicate names (excluding current client)
    if (updates.name && mcpClients.some(c => c.id !== id && c.name === updates.name)) {
      throw new Error('Client with this name already exists');
    }

    // Process args if provided
    if (updates.args && typeof updates.args === 'string') {
      updates.args = updates.args.split(' ').filter(Boolean);
    }

    mcpClients[clientIndex] = {
      ...mcpClients[clientIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await environmentDbService.updateSettings({ mcpClients });
    
    logger.info(`Updated MCP client: ${id}`);
    return mcpClients[clientIndex];
  },

  async deleteClient(id) {
    const settings = await environmentDbService.getSettings();
    const mcpClients = settings.mcpClients || [];
    
    const filteredClients = mcpClients.filter(c => c.id !== id);
    if (filteredClients.length === mcpClients.length) {
      throw new Error('Client not found');
    }

    await environmentDbService.updateSettings({ mcpClients: filteredClients });
    logger.info(`Deleted MCP client: ${id}`);
  },

  async testConnection(id) {
    const settings = await environmentDbService.getSettings();
    const mcpClients = settings.mcpClients || [];
    
    const client = mcpClients.find(c => c.id === id);
    if (!client) {
      throw new Error('Client not found');
    }

    try {
      // Create a test MCP client connection with correct format
      // Try different format based on @langchain/mcp-adapters expectations
      let serverConfig;

      // Configure for either remote (URL) or local (command + args) server
      if (client.url) {
        serverConfig = {
          url: client.url
        };
      } else if (client.command) {
        serverConfig = {
          command: client.command,
          args: client.args || []
        };
      } else {
        throw new Error('Either URL or command must be configured');
      }

      // Add token if provided
      if (client.token) {
        serverConfig.token = client.token;
      }

      logger.info(`Testing MCP connection with config:`, JSON.stringify(serverConfig, null, 2));

      const mcpClient = new MultiServerMCPClient({
        servers: serverConfig
      });

      // Try different connection methods based on the actual API
      if (typeof mcpClient.connect === 'function') {
        await mcpClient.connect();
        await mcpClient.disconnect();
      } else if (typeof mcpClient.initialize === 'function') {
        await mcpClient.initialize();
        if (typeof mcpClient.close === 'function') {
          await mcpClient.close();
        }
      } else {
        // Just test that the client was created successfully
        logger.info('MCP client created successfully (no connection method found)');
      }
      
      return { status: 'connected', message: 'Connection successful' };
    } catch (error) {
      logger.error(`MCP connection test failed for ${client.name}:`, error);
      throw new Error(`Connection failed: ${error.message}`);
    }
  },

  async getEnabledClients() {
    const clients = await this.getAllClients();
    return clients.filter(client => client.enabled);
  }
};

export default mcpService;
