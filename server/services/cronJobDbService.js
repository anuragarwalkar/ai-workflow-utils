/* eslint-disable max-lines */
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger.js';

class CronJobDbService {
  constructor() {
    // Store in user's home directory
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.ai-workflow-utils');
    const dbPath = path.join(configDir, 'cronJobs.json');

    this.configDir = configDir;
    this.adapter = new JSONFile(dbPath);
    this.db = new Low(this.adapter, {});
    logger.info(`Cron job database initialized at: ${dbPath}`);
  }

  async init() {
    try {
      // Ensure directory exists
      try {
        await fs.access(this.configDir);
      } catch {
        await fs.mkdir(this.configDir, { recursive: true });
        logger.info(`Created config directory: ${this.configDir}`);
      }

      await this.db.read();

      // Initialize with default structure if empty
      if (!this.db.data) {
        this.db.data = {
          jobs: [],
          metadata: {
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
        };
        await this.db.write();
        logger.info('Cron job database initialized with default structure');
      }

      return true;
    } catch (error) {
      logger.error('Failed to initialize cron job database:', error);
      throw error;
    }
  }

  async getAllJobs() {
    try {
      await this.db.read();
      return this.db.data.jobs || [];
    } catch (error) {
      logger.error('Failed to get all cron jobs:', error);
      throw error;
    }
  }

  async getJobById(id) {
    try {
      await this.db.read();
      const job = this.db.data.jobs.find(job => job.id === id);
      if (!job) {
        throw new Error(`Cron job with id ${id} not found`);
      }
      return job;
    } catch (error) {
      logger.error(`Failed to get cron job with id ${id}:`, error);
      throw error;
    }
  }

  async createJob(jobData) {
    try {
      await this.db.read();

      // Ensure data structure exists
      if (!this.db.data || !this.db.data.jobs) {
        this.db.data = {
          jobs: [],
          metadata: {
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
        };
      }

      const newJob = {
        id: uuidv4(),
        name: jobData.name,
        description: jobData.description || '',
        cronExpression: jobData.cronExpression,
        schedule: jobData.schedule,
        buildConfig: jobData.buildConfig,
        enabled: jobData.enabled !== undefined ? jobData.enabled : true,
        ticketNumber: jobData.ticketNumber || '',
        lastRun: null,
        nextRun: null,
        runCount: 0,
        status: 'inactive',
        logs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.db.data.jobs.push(newJob);
      await this.updateMetadata();
      
      logger.info(`Created cron job: ${newJob.name} (${newJob.id})`);
      return newJob;
    } catch (error) {
      logger.error('Failed to create cron job:', error);
      throw error;
    }
  }

  async updateJob(id, updates) {
    try {
      await this.db.read();

      const jobIndex = this.db.data.jobs.findIndex(job => job.id === id);
      if (jobIndex === -1) {
        throw new Error(`Cron job with id ${id} not found`);
      }

      const updatedJob = {
        ...this.db.data.jobs[jobIndex],
        ...updates,
        id,
        updatedAt: new Date().toISOString(),
      };

      this.db.data.jobs[jobIndex] = updatedJob;
      await this.updateMetadata();
      
      logger.info(`Updated cron job: ${updatedJob.name} (${id})`);
      return updatedJob;
    } catch (error) {
      logger.error(`Failed to update cron job with id ${id}:`, error);
      throw error;
    }
  }

  async deleteJob(id) {
    try {
      await this.db.read();

      const jobIndex = this.db.data.jobs.findIndex(job => job.id === id);
      if (jobIndex === -1) {
        throw new Error(`Cron job with id ${id} not found`);
      }

      const deletedJob = this.db.data.jobs[jobIndex];
      this.db.data.jobs.splice(jobIndex, 1);
      await this.updateMetadata();
      
      logger.info(`Deleted cron job: ${deletedJob.name} (${id})`);
      return deletedJob;
    } catch (error) {
      logger.error(`Failed to delete cron job with id ${id}:`, error);
      throw error;
    }
  }

  async updateJobStatus(id, status, additionalData = {}) {
    try {
      await this.db.read();
      const job = await this.findJobById(id);
      
      CronJobDbService.updateJobFields(job, status, additionalData);
      await this.updateMetadata();
      
      return job;
    } catch (error) {
      logger.error(`Failed to update cron job status for id ${id}:`, error);
      throw error;
    }
  }

  async findJobById(id) {
    const jobIndex = this.db.data.jobs.findIndex(job => job.id === id);
    if (jobIndex === -1) {
      throw new Error(`Cron job with id ${id} not found`);
    }
    return this.db.data.jobs[jobIndex];
  }

  static updateJobFields(job, status, additionalData) {
    if (status) {
      job.status = status;
    }
    job.updatedAt = new Date().toISOString();

    if (status === 'running') {
      job.lastRun = new Date().toISOString();
      job.runCount = (job.runCount || 0) + 1;
    }

    if (additionalData.nextRun) {
      job.nextRun = additionalData.nextRun;
    }

    if (additionalData.log) {
      CronJobDbService.addLogToJob(job, additionalData.log, additionalData.logType);
    }
  }

  static addLogToJob(job, message, type = 'info') {
    job.logs = job.logs || [];
    job.logs.push({
      timestamp: new Date().toISOString(),
      message,
      type,
    });

    // Keep only last 50 logs
    if (job.logs.length > 50) {
      job.logs = job.logs.slice(-50);
    }
  }

  async updateMetadata() {
    this.db.data.metadata.lastUpdated = new Date().toISOString();
    await this.db.write();
  }

  async getActiveJobs() {
    try {
      await this.db.read();
      return this.db.data.jobs.filter(job => job.enabled && job.status !== 'failed');
    } catch (error) {
      logger.error('Failed to get active cron jobs:', error);
      throw error;
    }
  }

  async addJobLog(id, message, type = 'info') {
    try {
      await this.updateJobStatus(id, null, {
        log: message,
        logType: type,
      });
    } catch (error) {
      logger.error(`Failed to add log to cron job ${id}:`, error);
      throw error;
    }
  }

  async getJobLogs(id, limit = 20) {
    try {
      const job = await this.getJobById(id);
      const logs = job.logs || [];
      return logs.slice(-limit).reverse();
    } catch (error) {
      logger.error(`Failed to get logs for cron job ${id}:`, error);
      throw error;
    }
  }

  static validateCronExpression(cronExpression) {
    try {
      const parts = cronExpression.trim().split(/\s+/);
      if (parts.length !== 5 && parts.length !== 6) {
        throw new Error('Cron expression must have 5 or 6 fields');
      }

      const patterns = [
        /^(\*|([0-5]?\d)(-([0-5]?\d))?|(([0-5]?\d)(,([0-5]?\d))*))$/,
        /^(\*|([01]?\d|2[0-3])(-([01]?\d|2[0-3]))?|(([01]?\d|2[0-3])(,([01]?\d|2[0-3]))*))$/,
        /^(\*|([12]?\d|3[01])(-([12]?\d|3[01]))?|(([12]?\d|3[01])(,([12]?\d|3[01]))*))$/,
        /^(\*|([1-9]|1[0-2])(-([1-9]|1[0-2]))?|(([1-9]|1[0-2])(,([1-9]|1[0-2]))*))$/,
        /^(\*|[0-6](-[0-6])?|([0-6](,[0-6])*))$/,
      ];

      const fieldsToCheck = parts.length === 6 ? parts.slice(1) : parts;
      
      for (let i = 0; i < fieldsToCheck.length; i++) {
        if (!patterns[i].test(fieldsToCheck[i])) {
          throw new Error(`Invalid cron expression field ${i + 1}: ${fieldsToCheck[i]}`);
        }
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  async getMetadata() {
    try {
      await this.db.read();
      return this.db.data.metadata || {};
    } catch (error) {
      logger.error('Failed to get metadata:', error);
      throw error;
    }
  }
}

export default new CronJobDbService();