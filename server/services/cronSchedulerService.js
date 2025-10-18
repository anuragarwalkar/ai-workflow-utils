import cron from 'node-cron';
import cronJobDbService from './cronJobDbService.js';
import CronJobExecutor from './cronJobExecutor.js';
import logger from '../logger.js';

class CronSchedulerService {
  constructor() {
    this.activeTasks = new Map();
    this.initialized = false;
    this.io = null;
  }

  setSocketIO(io) {
    this.io = io;
  }

  async init() {
    try {
      if (this.initialized) {
        return;
      }

      // Initialize database service
      await cronJobDbService.init();
      
      // Load and start active jobs
      await this.loadActiveJobs();
      
      this.initialized = true;
      logger.info('Cron scheduler service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize cron scheduler service:', error);
      throw error;
    }
  }

  async loadActiveJobs() {
    try {
      const activeJobs = await cronJobDbService.getActiveJobs();
      
      for (const job of activeJobs) {
        await this.scheduleJob(job);
      }
      
      logger.info(`Loaded ${activeJobs.length} active cron jobs`);
    } catch (error) {
      logger.error('Failed to load active jobs:', error);
      throw error;
    }
  }

  async scheduleJob(job) {
    try {
      if (!cron.validate(job.cronExpression)) {
        throw new Error(`Invalid cron expression: ${job.cronExpression}`);
      }
      if (this.activeTasks.has(job.id)) {
        this.stopJob(job.id);
      }
      const task = cron.schedule(job.cronExpression, async () => {
        await this.executeJob(job.id);
      }, {
        scheduled: false,
        timezone: 'UTC',
      });
      this.activeTasks.set(job.id, task);
      task.start();
      await cronJobDbService.updateJobStatus(job.id, 'active', {
        nextRun: CronSchedulerService.getNextRunTime(job.cronExpression),
        log: 'Job scheduled successfully',
        logType: 'info',
      });
      logger.info(`Scheduled cron job: ${job.name} (${job.id}) with expression: ${job.cronExpression}`);
    } catch (error) {
      logger.error(`Failed to schedule job ${job.id}:`, error);
      await cronJobDbService.updateJobStatus(job.id, 'failed', {
        log: `Failed to schedule job: ${error.message}`,
        logType: 'error',
      });
      throw error;
    }
  }

  async stopJob(jobId) {
    try {
      const task = this.activeTasks.get(jobId);
      if (task) {
        task.stop();
        task.destroy();
        this.activeTasks.delete(jobId);
        await cronJobDbService.updateJobStatus(jobId, 'inactive', {
          log: 'Job stopped',
          logType: 'info',
        });
        logger.info(`Stopped cron job: ${jobId}`);
      }
    } catch (error) {
      logger.error(`Failed to stop job ${jobId}:`, error);
      throw error;
    }
  }

  emitLog(jobId, message, logType = 'info') {
    if (this.io) {
      this.io.emit('cronJobLog', {
        jobId,
        message,
        logType,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async executeJobSuccess(jobId, job) {
    this.emitLog(jobId, 'Job execution completed successfully', 'success');
    await cronJobDbService.updateJobStatus(jobId, 'active', {
      nextRun: CronSchedulerService.getNextRunTime(job.cronExpression),
      log: 'Job execution completed successfully',
      logType: 'success',
    });
    if (this.io) {
      this.io.emit('cronJobCompleted', {
        jobId,
        jobName: job.name,
        success: true,
        timestamp: new Date().toISOString(),
      });
    }
    await CronSchedulerService.sendNotification(job, 'success');
  }

  async executeJobError(jobId, job, error) {
    this.emitLog(jobId, `Job execution failed: ${error.message}`, 'error');
    await cronJobDbService.updateJobStatus(jobId, 'failed', {
      log: `Job execution failed: ${error.message}`,
      logType: 'error',
    });
    if (this.io) {
      this.io.emit('cronJobFailed', {
        jobId,
        jobName: job.name,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
    await CronSchedulerService.sendNotification(job, 'error');
  }

  async executeJob(jobId) {
    try {
      logger.info(`Executing cron job: ${jobId}`);
      const job = await cronJobDbService.getJobById(jobId);
      
      if (this.io) {
        this.io.emit('cronJobStarted', {
          jobId,
          jobName: job.name,
          timestamp: new Date().toISOString(),
        });
      }

      this.emitLog(jobId, 'Job execution started', 'start');
      await cronJobDbService.updateJobStatus(jobId, 'running', {
        log: 'Job execution started',
        logType: 'info',
      });

      await CronJobExecutor.executeBuild(this.io, jobId, job);
      await this.executeJobSuccess(jobId, job);
      logger.info(`Completed cron job: ${jobId}`);
    } catch (error) {
      logger.error(`Failed to execute job ${jobId}:`, error);
      const job = await cronJobDbService.getJobById(jobId);
      await this.executeJobError(jobId, job, error);
    }
  }

  static async sendNotification(job, type) {
    try {
      // TODO: Implement actual notification system (web push, etc.)
      const message = type === 'success' 
        ? `Cron job "${job.name}" completed successfully`
        : `Cron job "${job.name}" failed`;
      
      logger.info(`Notification: ${message}`, { jobId: job.id, type });
      
      // For now, just log. In the future, this could send:
      // - Web push notifications to connected clients
      // - Email notifications
      // - Slack/Discord webhooks
      // - SMS notifications
    } catch (error) {
      logger.error('Failed to send notification:', error);
    }
  }

  static getNextRunTime(_cronExpression) {
    // Note: Calculating next run time with cron-parser has webpack bundling issues
    // The cron job will still run on schedule, we just won't display the exact next run time
    // This is a non-critical UI feature that doesn't affect scheduling functionality
    // The actual scheduling is handled by node-cron which works correctly
    return 'Scheduled';
  }

  async addJob(jobData) {
    try {
      const newJob = await cronJobDbService.createJob(jobData);
      if (newJob.enabled) {
        await this.scheduleJob(newJob);
      }
      return newJob;
    } catch (error) {
      logger.error('Failed to add cron job:', error);
      throw error;
    }
  }

  async updateJob(jobId, updates) {
    try {
      const updatedJob = await cronJobDbService.updateJob(jobId, updates);
      if (updates.cronExpression || updates.enabled !== undefined) {
        if (this.activeTasks.has(jobId)) {
          await this.stopJob(jobId);
        }
        if (updatedJob.enabled) {
          await this.scheduleJob(updatedJob);
        }
      }
      return updatedJob;
    } catch (error) {
      logger.error('Failed to update cron job:', error);
      throw error;
    }
  }

  async removeJob(jobId) {
    try {
      if (this.activeTasks.has(jobId)) {
        await this.stopJob(jobId);
      }
      const deletedJob = await cronJobDbService.deleteJob(jobId);
      return deletedJob;
    } catch (error) {
      logger.error('Failed to remove cron job:', error);
      throw error;
    }
  }

  async triggerJobManually(jobId) {
    try {
      const job = await cronJobDbService.getJobById(jobId);
      if (!job.enabled) {
        throw new Error('Cannot trigger disabled job');
      }
      if (job.status === 'running') {
        throw new Error('Job is already running');
      }
      await this.executeJob(jobId);
      return { success: true, message: 'Job triggered successfully' };
    } catch (error) {
      logger.error('Failed to trigger job manually:', error);
      throw error;
    }
  }

  getActiveTasksCount() {
    return this.activeTasks.size;
  }

  getAllActiveJobIds() {
    return Array.from(this.activeTasks.keys());
  }

  async destroy() {
    try {
      for (const [jobId] of this.activeTasks) {
        await this.stopJob(jobId);
      }
      this.activeTasks.clear();
      this.initialized = false;
      logger.info('Cron scheduler service destroyed');
    } catch (error) {
      logger.error('Failed to destroy cron scheduler service:', error);
      throw error;
    }
  }
}

export default new CronSchedulerService();