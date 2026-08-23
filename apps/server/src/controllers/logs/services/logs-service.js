import fs from 'fs/promises';
import path from 'path';
import { LogsConfig } from '../utils/logs-config.js';
import LogsProcessor from '../processors/logs-processor.js';

/**
 * Logs Service - Handles file system operations for logs
 * Responsible for reading, writing, and managing log files
 */
class LogsService {
  /**
   * Fetch all logs from the logs directory
   * @returns {Array} Array of log entries
   */
  static async fetchLogs() {
    const logsDir = LogsConfig.getLogsDirectory();

    // Check if logs directory exists
    try {
      await fs.access(logsDir);
    } catch (error) {
      return [];
    }

    const logFiles = await fs.readdir(logsDir);
    const logEntries = [];

    for (const file of logFiles.filter(f => f.endsWith('.log'))) {
      const filePath = path.join(logsDir, file);
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());

        for (const line of lines) {
          const parsedLog = LogsProcessor.parseLogLine(line, file);
          if (parsedLog) {
            logEntries.push(parsedLog);
          }
        }
      } catch (fileError) {
        console.error(`Error reading log file ${file}:`, fileError);
      }
    }

    return logEntries;
  }

  /**
   * Export all logs as a single text content
   * @returns {string} Combined logs content
   */
  static async exportAllLogs() {
    const logsDir = LogsConfig.getLogsDirectory();

    try {
      await fs.access(logsDir);
    } catch (error) {
      return 'No logs directory found';
    }

    const logFiles = await fs.readdir(logsDir);
    let allLogs = '';

    for (const file of logFiles.filter(f => f.endsWith('.log'))) {
      const filePath = path.join(logsDir, file);
      try {
        const content = await fs.readFile(filePath, 'utf8');
        allLogs += `\n=== ${file} ===\n${content}\n`;
      } catch (fileError) {
        allLogs += `\n=== ${file} (ERROR: ${fileError.message}) ===\n`;
      }
    }

    return allLogs.trim() || 'No logs found';
  }

  /**
   * Clear all log files
   * @returns {Object} Result object with message
   */
  static async clearAllLogs() {
    const logsDir = LogsConfig.getLogsDirectory();

    try {
      await fs.access(logsDir);
    } catch (error) {
      return { message: 'No logs directory found, nothing to clear' };
    }

    const logFiles = await fs.readdir(logsDir);
    let clearedCount = 0;

    for (const file of logFiles.filter(f => f.endsWith('.log'))) {
      const filePath = path.join(logsDir, file);
      try {
        await fs.writeFile(filePath, '');
        clearedCount++;
      } catch (fileError) {
        console.error(`Error clearing log file ${file}:`, fileError);
      }
    }

    return {
      message: `Successfully cleared ${clearedCount} log file(s)`,
    };
  }

  /**
   * Get basic statistics about logs
   * @returns {Object} Statistics object
   */
  static async getLogStatistics() {
    const logs = await this.fetchLogs();

    const stats = {
      totalLogs: logs.length,
      byLevel: {},
      byModule: {},
      dateRange: {
        oldest: null,
        newest: null,
      },
    };

    logs.forEach(log => {
      // Count by level
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;

      // Count by module
      stats.byModule[log.module] = (stats.byModule[log.module] || 0) + 1;

      // Track date range
      const logDate = new Date(log.timestamp);
      if (
        !stats.dateRange.oldest ||
        logDate < new Date(stats.dateRange.oldest)
      ) {
        stats.dateRange.oldest = log.timestamp;
      }
      if (
        !stats.dateRange.newest ||
        logDate > new Date(stats.dateRange.newest)
      ) {
        stats.dateRange.newest = log.timestamp;
      }
    });

    return stats;
  }
}

export default LogsService;
