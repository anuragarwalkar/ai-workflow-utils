import express from 'express';
import {
  convertNaturalLanguageToApi,
  executeRequest,
  exportCollections,
  getCollections,
  importCollection,
  saveCollection,
} from '../controllers/api-client/index.js';

import {
  createEnvironment,
  deleteEnvironment,
  exportAllEnvironments,
  exportEnvironment,
  getActiveEnvironment,
  getApiClientEnvironments,
  getEnvironment,
  importEnvironment,
  setActiveEnvironment,
  updateEnvironment
} from '../controllers/api-client-environment/index.js';

const router = express.Router();

// Request execution
router.post('/execute', executeRequest);

// Natural language to API conversion
router.post('/convert-nl', convertNaturalLanguageToApi);

// Collections management
router.get('/collections', getCollections);
router.post('/collections', saveCollection);


// New API Client Environments management
router.get('/environments', getApiClientEnvironments);

router.post('/environments', createEnvironment);

router.get('/environments/active', getActiveEnvironment);

router.get('/environments/:id', getEnvironment);

router.put('/environments/:id', updateEnvironment);

router.delete('/environments/:id', deleteEnvironment);

router.put('/environments/:id/activate', setActiveEnvironment);

// Environment import/export
router.post('/environments/import', importEnvironment);

router.get('/environments/:id/export', exportEnvironment);

router.get('/environments/export/all', exportAllEnvironments);

// Export 
router.get('/export', exportCollections);

// Import
router.post('/import', importCollection);

export default router;
