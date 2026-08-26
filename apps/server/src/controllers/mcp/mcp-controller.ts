import { Request, Response } from 'express';
import mcpService from '../../services/mcpService.ts';
import logger from '../../logger.ts';

const mcpController = {
  async getClients(req: Request, res: Response): Promise<void> {
    try {
      const clients = await mcpService.getAllClients();
      res.json({ success: true, data: clients });
    } catch (error: any) {
      logger.error('Error fetching MCP clients:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch MCP clients',
      });
    }
  },

  async createClient(req: Request, res: Response): Promise<void> {
    try {
      const client = await mcpService.createClient(req.body);
      res.json({ success: true, data: client });
    } catch (error: any) {
      logger.error('Error creating MCP client:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  },

  async updateClient(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const client = await mcpService.updateClient(id, req.body);
      res.json({ success: true, data: client });
    } catch (error: any) {
      logger.error('Error updating MCP client:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  },

  async deleteClient(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      await mcpService.deleteClient(id);
      res.json({ success: true });
    } catch (error: any) {
      logger.error('Error deleting MCP client:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  },

  async testConnection(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const result = await mcpService.testConnection(id);
      res.json({ success: true, data: result });
    } catch (error: any) {
      logger.error('Error testing MCP connection:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  },
};

export default mcpController;
