import express from 'express';
import {
  executeRequest,
  exportCollections,
  getCollections,
  getEnvironments,
  importCollection,
  saveCollection,
  saveEnvironment,
} from '../controllers/api-client/index.js';

const router = express.Router();

// Request execution
router.post('/execute', executeRequest);

// Collections management
router.get('/collections', getCollections);
router.post('/collections', saveCollection);

// Environments management
router.get('/environments', getEnvironments);
router.post('/environments', saveEnvironment);

// Export 
router.get('/export', exportCollections);

// Import
router.post('/import', importCollection);

export default router;
