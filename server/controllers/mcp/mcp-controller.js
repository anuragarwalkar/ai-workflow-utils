import mcpService from '../../services/mcpService.js';
import logger from '../../logger.js';

const mcpController = {
  async getClients(req, res) {
    try {
      const clients = await mcpService.getAllClients();
      res.json({ success: true, data: clients });
    } catch (error) {
      logger.error('Error fetching MCP clients:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch MCP clients' 
      });
    }
  },

  async createClient(req, res) {
    try {
      const client = await mcpService.createClient(req.body);
      res.json({ success: true, data: client });
    } catch (error) {
      logger.error('Error creating MCP client:', error);
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  },

  async updateClient(req, res) {
    try {
      const client = await mcpService.updateClient(req.params.id, req.body);
      res.json({ success: true, data: client });
    } catch (error) {
      logger.error('Error updating MCP client:', error);
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  },

  async deleteClient(req, res) {
    try {
      await mcpService.deleteClient(req.params.id);
      res.json({ success: true });
    } catch (error) {
      logger.error('Error deleting MCP client:', error);
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  },

  async testConnection(req, res) {
    try {
      const result = await mcpService.testConnection(req.params.id);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error testing MCP connection:', error);
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
};

export default mcpController;
