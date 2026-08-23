import express from 'express';
import environmentController from '../controllers/environment/index.js';

const router = express.Router();

router.get('/', environmentController.getSettings);
router.put('/', environmentController.updateSettings);

router.get('/providers', environmentController.getProviders);

router.post('/test', environmentController.testConnection);

router.get('/defaults', environmentController.getDefaults);

router.post('/reset', environmentController.resetSettings);

router.get('/config', environmentController.getProviderConfig);
router.get('/schema', environmentController.getSchema);

router.post('/export', environmentController.exportSettings);
router.post('/import', environmentController.importSettings);

export default router;
