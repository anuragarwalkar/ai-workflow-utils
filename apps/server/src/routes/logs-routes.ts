import express from 'express';
import { LogsController } from '../controllers/logs/index.js';

const router = express.Router();

router.get('/', LogsController.getLogs);
router.get('/download', LogsController.downloadLogs);
router.get('/stats', LogsController.getLogStats);
router.delete('/clear', LogsController.clearLogs);

export default router;
