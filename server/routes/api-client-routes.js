import express from 'express';
import {
  convertNaturalLanguageToApi,
  executeRequest,
  executeScript,
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

import {
  createCollection,
  deleteCollection,
  exportAllCollections,
  exportCollection,
  getCollection,
  getCollections,
  importCollection,
  updateCollection
} from '../controllers/api-client-collection/index.js';

const router = express.Router();

// Request execution
router.post('/execute', executeRequest);

// Script execution  
router.post('/execute-script', executeScript);

// Natural language to API conversion
router.post('/convert-nl', convertNaturalLanguageToApi);

// Collections management
router.get('/collections', getCollections);
router.post('/collections', createCollection);
router.get('/collections/:id', getCollection);
router.put('/collections/:id', updateCollection);
router.delete('/collections/:id', deleteCollection);

// Collection import/export
router.post('/collections/import', importCollection);
router.get('/collections/:id/export', exportCollection);
router.get('/collections/export/all', exportAllCollections);

// API Client Environments management
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

export default router;
