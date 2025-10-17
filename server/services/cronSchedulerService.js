import cron from 'node-cron';
import cronJobDbService from './cronJobDbService.js';
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
      // Validate cron expression
      if (!cron.validate(job.cronExpression)) {
        throw new Error(`Invalid cron expression: ${job.cronExpression}`);
      }

      // Stop existing task if any
      if (this.activeTasks.has(job.id)) {
        this.stopJob(job.id);
      }

      // Create new scheduled task
      const task = cron.schedule(job.cronExpression, async () => {
        await this.executeJob(job.id);
      }, {
        scheduled: false,
        timezone: 'UTC',
      });

      // Store task reference
      this.activeTasks.set(job.id, task);
      
      // Start the task
      task.start();
      
      // Update job status
      await cronJobDbService.updateJobStatus(job.id, 'active', {
        nextRun: CronSchedulerService.getNextRunTime(job.cronExpression),
        log: 'Job scheduled successfully',
        logType: 'info',
      });

      logger.info(`Scheduled cron job: ${job.name} (${job.id}) with expression: ${job.cronExpression}`);
    } catch (error) {
      logger.error(`Failed to schedule job ${job.id}:`, error);
      
      // Update job status to failed
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
        
        // Update job status
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

  async executeJob(jobId) {
    try {
      logger.info(`Executing cron job: ${jobId}`);
      
      // Get job details
      const job = await cronJobDbService.getJobById(jobId);
      
      // Emit job started event
      if (this.io) {
        this.io.emit('cronJobStarted', {
          jobId,
          jobName: job.name,
          timestamp: new Date().toISOString(),
        });
      }
      
      // Update status to running
      await cronJobDbService.updateJobStatus(jobId, 'running', {
        log: 'Job execution started',
        logType: 'info',
      });

      // TODO: Implement actual build execution based on job.buildConfig
      // For now, simulate job execution
      await CronSchedulerService.simulateJobExecution(job);
      
      // Update status to active (completed)
      await cronJobDbService.updateJobStatus(jobId, 'active', {
        nextRun: CronSchedulerService.getNextRunTime(job.cronExpression),
        log: 'Job execution completed successfully',
        logType: 'success',
      });

      // Emit job completed event
      if (this.io) {
        this.io.emit('cronJobCompleted', {
          jobId,
          jobName: job.name,
          success: true,
          timestamp: new Date().toISOString(),
        });
      }

      // Send notification (TODO: implement actual notification system)
      await CronSchedulerService.sendNotification(job, 'success');
      
      logger.info(`Completed cron job: ${jobId}`);
    } catch (error) {
      logger.error(`Failed to execute job ${jobId}:`, error);
      
      // Get job details for notification
      const job = await cronJobDbService.getJobById(jobId);
      
      // Update status to failed
      await cronJobDbService.updateJobStatus(jobId, 'failed', {
        log: `Job execution failed: ${error.message}`,
        logType: 'error',
      });

      // Emit job failed event
      if (this.io) {
        this.io.emit('cronJobFailed', {
          jobId,
          jobName: job.name,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }

      // Send failure notification
      await CronSchedulerService.sendNotification(job, 'error');
    }
  }

  static async simulateJobExecution(job) {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Log build config for debugging
    logger.info(`Simulating build execution for job: ${job.name}`, {
      buildConfig: job.buildConfig,
    });
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

  static getNextRunTime(cronExpression) {
    try {
      // Create a temporary task to get next run time
      const tempTask = cron.schedule(cronExpression, () => {}, { scheduled: false });
      const nextRun = tempTask.nextDate();
      tempTask.destroy();
      
      return nextRun ? nextRun.toISOString() : null;
    } catch (error) {
      logger.error('Failed to calculate next run time:', error);
      return null;
    }
  }

  async addJob(jobData) {
    try {
      // Create job in database
      const newJob = await cronJobDbService.createJob(jobData);
      
      // Schedule if enabled
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
      // Update job in database
      const updatedJob = await cronJobDbService.updateJob(jobId, updates);
      
      // Reschedule if necessary
      if (updates.cronExpression || updates.enabled !== undefined) {
        // Stop existing task
        if (this.activeTasks.has(jobId)) {
          await this.stopJob(jobId);
        }
        
        // Reschedule if enabled
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
      // Stop task if running
      if (this.activeTasks.has(jobId)) {
        await this.stopJob(jobId);
      }
      
      // Delete from database
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
      
      // Execute job immediately
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
      // Stop all active tasks
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