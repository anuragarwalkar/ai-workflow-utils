import express from 'express';
import mcpController from '../controllers/mcp/mcp-controller.js';

const router = express.Router();

// MCP client configuration routes
router.get('/clients', mcpController.getClients);
router.post('/clients', mcpController.createClient);
router.put('/clients/:id', mcpController.updateClient);
router.delete('/clients/:id', mcpController.deleteClient);
router.post('/clients/:id/test', mcpController.testConnection);

export default router;
