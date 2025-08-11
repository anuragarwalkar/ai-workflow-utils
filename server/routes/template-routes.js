import express from 'express';
import {
  createTemplate,
  deleteTemplate,
  duplicateTemplate,
  exportTemplates,
  getActiveTemplate,
  getAllTemplates,
  getSettings,
  getTemplatesByType,
  importTemplates,
  init,
  resetToDefaults,
  setActiveTemplate,
  updateSettings,
  updateTemplate,
} from '../controllers/template/index.js';

const router = express.Router();

// Initialize template controller
init().catch(console.error);

// Template CRUD routes
router.get('/', getAllTemplates);
router.post('/', createTemplate);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

// Template type routes
router.get('/type/:issueType', getTemplatesByType);
router.get('/active/:issueType', getActiveTemplate);
router.put('/active/:issueType/:templateId', setActiveTemplate);

// Settings routes
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Utility routes
router.post('/reset', resetToDefaults);
router.get('/export', exportTemplates);
router.post('/import', importTemplates);
router.post('/duplicate/:id', duplicateTemplate);

export default router;
