import express from 'express';
import { LogsController } from '../controllers/logs/index.js';

const router = express.Router();

// Get logs with filtering and pagination
router.get('/', LogsController.getLogs);

// Download all logs as a file
router.get('/download', LogsController.downloadLogs);

// Get log statistics
router.get('/stats', LogsController.getLogStats);

// Clear all logs
router.delete('/clear', LogsController.clearLogs);

export default router;
