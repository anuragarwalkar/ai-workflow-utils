import cronJobDbService from '../../services/cronJobDbService.js';
import cronSchedulerService from '../../services/cronSchedulerService.js';
import logger from '../../logger.js';
import { validationResult } from 'express-validator';

export const getAllCronJobs = async (req, res) => {
  try {
    const jobs = await cronJobDbService.getAllJobs();
    res.json({
      success: true,
      data: jobs,
      message: 'Cron jobs retrieved successfully',
    });
  } catch (error) {
    logger.error('[CRON_JOB_CONTROLLER] [getAllCronJobs] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cron jobs',
      error: error.message,
    });
  }
};

export const getCronJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await cronJobDbService.getJobById(id);
    
    res.json({
      success: true,
      data: job,
      message: 'Cron job retrieved successfully',
    });
  } catch (error) {
    logger.error('[CRON_JOB_CONTROLLER] [getCronJobById] Error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to retrieve cron job',
      error: error.message,
    });
  }
};

export const createCronJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const jobData = req.body;
    
    // Validate cron expression
    const validation = cronJobDbService.constructor.validateCronExpression(jobData.cronExpression);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cron expression',
        error: validation.error,
      });
    }

    const newJob = await cronJobDbService.createJob(jobData);
    
    // Schedule the job if it's enabled
    if (newJob.enabled) {
      logger.info('[CRON_JOB_CONTROLLER] [createCronJob] Scheduling enabled job:', newJob.id);
      await cronSchedulerService.scheduleJob(newJob);
    }
    
    res.status(201).json({
      success: true,
      data: newJob,
      message: 'Cron job created successfully',
    });
  } catch (error) {
    logger.error('[CRON_JOB_CONTROLLER] [createCronJob] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create cron job',
      error: error.message,
    });
  }
};

const handleJobRescheduling = async (id, updates, updatedJob) => {
  if (updates.cronExpression === undefined && updates.enabled === undefined) return;
  
  logger.info('[CRON_JOB_CONTROLLER] [updateCronJob] Rescheduling job:', id);
  
  if (cronSchedulerService.activeTasks.has(id)) {
    await cronSchedulerService.stopJob(id);
  }
  
  if (updatedJob.enabled) {
    await cronSchedulerService.scheduleJob(updatedJob);
  }
};

export const updateCronJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const updates = req.body;
    
    // Validate cron expression if provided
    if (updates.cronExpression) {
      const validation = cronJobDbService.constructor.validateCronExpression(updates.cronExpression);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cron expression',
          error: validation.error,
        });
      }
    }

    const updatedJob = await cronJobDbService.updateJob(id, updates);
    await handleJobRescheduling(id, updates, updatedJob);
    
    res.json({
      success: true,
      data: updatedJob,
      message: 'Cron job updated successfully',
    });
  } catch (error) {
    logger.error('[CRON_JOB_CONTROLLER] [updateCronJob] Error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to update cron job',
      error: error.message,
    });
  }
};

export const deleteCronJob = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Stop the scheduled job if it's active
    if (cronSchedulerService.activeTasks.has(id)) {
      await cronSchedulerService.stopJob(id);
    }
    
    const deletedJob = await cronJobDbService.deleteJob(id);
    
    res.json({
      success: true,
      data: deletedJob,
      message: 'Cron job deleted successfully',
    });
  } catch (error) {
    logger.error('[CRON_JOB_CONTROLLER] [deleteCronJob] Error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to delete cron job',
      error: error.message,
    });
  }
};