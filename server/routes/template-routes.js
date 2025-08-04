import express from 'express';
import templateController from '../controllers/template/index.js';

const router = express.Router();

// Initialize template controller
templateController.init().catch(console.error);

// Template CRUD routes
router.get('/', templateController.getAllTemplates);
router.post('/', templateController.createTemplate);
router.put('/:id', templateController.updateTemplate);
router.delete('/:id', templateController.deleteTemplate);

// Template type routes
router.get('/type/:issueType', templateController.getTemplatesByType);
router.get('/active/:issueType', templateController.getActiveTemplate);
router.put(
  '/active/:issueType/:templateId',
  templateController.setActiveTemplate
);

// Settings routes
router.get('/settings', templateController.getSettings);
router.put('/settings', templateController.updateSettings);

// Utility routes
router.post('/reset', templateController.resetToDefaults);
router.get('/export', templateController.exportTemplates);
router.post('/import', templateController.importTemplates);
router.post('/duplicate/:id', templateController.duplicateTemplate);

export default router;
