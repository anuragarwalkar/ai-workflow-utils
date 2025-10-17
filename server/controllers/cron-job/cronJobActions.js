import cronJobDbService from '../../services/cronJobDbService.js';
import logger from '../../logger.js';
import { generateCronExpression } from './utils/cronUtils.js';

export const toggleCronJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await cronJobDbService.getJobById(id);
    
    const updatedJob = await cronJobDbService.updateJob(id, {
      enabled: !job.enabled,
    });
    
    res.json({
      success: true,
      data: updatedJob,
      message: `Cron job ${updatedJob.enabled ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (error) {
    logger.error('[CRON_JOB_CONTROLLER] [toggleCronJob] Error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to toggle cron job',
      error: error.message,
    });
  }
};

export const getCronJobLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20 } = req.query;
    
    const logs = await cronJobDbService.getJobLogs(id, parseInt(limit));
    
    res.json({
      success: true,
      data: logs,
      message: 'Cron job logs retrieved successfully',
    });
  } catch (error) {
    logger.error('[CRON_JOB_CONTROLLER] [getCronJobLogs] Error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to retrieve cron job logs',
      error: error.message,
    });
  }
};

export const triggerCronJobManually = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await cronJobDbService.getJobById(id);
    
    if (!job.enabled) {
      return res.status(400).json({
        success: false,
        message: 'Cannot trigger disabled cron job',
      });
    }

    if (job.status === 'running') {
      return res.status(409).json({
        success: false,
        message: 'Cron job is already running',
      });
    }

    // TODO: Implement actual job execution logic
    await cronJobDbService.updateJobStatus(id, 'running', {
      log: 'Job triggered manually',
      logType: 'info',
    });

    res.json({
      success: true,
      message: 'Cron job triggered successfully',
    });
  } catch (error) {
    logger.error('[CRON_JOB_CONTROLLER] [triggerCronJobManually] Error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to trigger cron job',
      error: error.message,
    });
  }
};

export const validateCronExpression = (req, res) => {
  try {
    const { expression } = req.body;
    
    if (!expression) {
      return res.status(400).json({
        success: false,
        message: 'Cron expression is required',
      });
    }

    const validation = cronJobDbService.constructor.validateCronExpression(expression);
    
    res.json({
      success: true,
      data: validation,
      message: 'Cron expression validated',
    });
  } catch (error) {
    logger.error('[CRON_JOB_CONTROLLER] [validateCronExpression] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate cron expression',
      error: error.message,
    });
  }
};

export const convertScheduleToCron = (req, res) => {
  try {
    const { schedule } = req.body;
    
    if (!schedule || !schedule.type) {
      return res.status(400).json({
        success: false,
        message: 'Schedule configuration is required',
      });
    }

    const cronExpression = generateCronExpression(schedule);
    if (!cronExpression.success) {
      return res.status(400).json(cronExpression);
    }

    const validation = cronJobDbService.constructor.validateCronExpression(cronExpression.data);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Generated cron expression is invalid',
        error: validation.error,
      });
    }

    res.json({
      success: true,
      data: {
        cronExpression: cronExpression.data,
        schedule,
      },
      message: 'Schedule converted to cron expression successfully',
    });
  } catch (error) {
    logger.error('[CRON_JOB_CONTROLLER] [convertScheduleToCron] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert schedule to cron expression',
      error: error.message,
    });
  }
};