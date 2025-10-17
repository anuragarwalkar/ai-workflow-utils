import express from 'express';
import { body, param, query } from 'express-validator';
import {
  convertScheduleToCron,
  createCronJob,
  deleteCronJob,
  getAllCronJobs,
  getCronJobById,
  getCronJobLogs,
  toggleCronJob,
  triggerCronJobManually,
  updateCronJob,
  validateCronExpression,
} from '../controllers/cron-job/index.js';

const router = express.Router();

// Validation middleware
const cronJobValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('cronExpression')
    .notEmpty()
    .withMessage('Cron expression is required'),
  body('buildConfig')
    .isObject()
    .withMessage('Build configuration must be an object'),
  body('enabled')
    .optional()
    .isBoolean()
    .withMessage('Enabled must be a boolean'),
];

const cronJobUpdateValidation = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('cronExpression')
    .optional()
    .notEmpty()
    .withMessage('Cron expression cannot be empty'),
  body('buildConfig')
    .optional()
    .isObject()
    .withMessage('Build configuration must be an object'),
  body('enabled')
    .optional()
    .isBoolean()
    .withMessage('Enabled must be a boolean'),
];

const idValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid job ID format'),
];

const scheduleValidation = [
  body('schedule.type')
    .isIn(['daily', 'weekly', 'custom'])
    .withMessage('Schedule type must be daily, weekly, or custom'),
  body('schedule.time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time must be in HH:mm format'),
  body('schedule.dayOfWeek')
    .optional()
    .isInt({ min: 0, max: 6 })
    .withMessage('Day of week must be between 0 (Sunday) and 6 (Saturday)'),
  body('schedule.cronExpression')
    .if(body('schedule.type').equals('custom'))
    .notEmpty()
    .withMessage('Cron expression is required for custom schedule type'),
];

const logLimitValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// Routes
router.get('/', getAllCronJobs);
router.get('/:id', idValidation, getCronJobById);
router.post('/', cronJobValidation, createCronJob);
router.put('/:id', idValidation, cronJobUpdateValidation, updateCronJob);
router.delete('/:id', idValidation, deleteCronJob);
router.patch('/:id/toggle', idValidation, toggleCronJob);
router.get('/:id/logs', idValidation, logLimitValidation, getCronJobLogs);
router.post('/:id/trigger', idValidation, triggerCronJobManually);

// Utility routes
router.post('/validate-expression', [
  body('expression').notEmpty().withMessage('Expression is required'),
], validateCronExpression);

router.post('/convert-schedule', scheduleValidation, convertScheduleToCron);

export default router;