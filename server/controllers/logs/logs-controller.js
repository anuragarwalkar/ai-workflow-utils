import LogsService from './services/logs-service.js';
import LogsProcessor from './processors/logs-processor.js';
import { ErrorHandler } from './utils/error-handler.js';

/**
 * Logs Controller - Main orchestrator for log operations
 * Follows modular architecture pattern with separation of concerns
 */
class LogsController {
  /**
   * Get logs with filtering, pagination, and search
   */
  static async getLogs(req, res) {
    try {
      const { level = 'all', search = '', page = 1, limit = 25 } = req.query;

      // Fetch raw logs
      const rawLogs = await LogsService.fetchLogs();

      // Process and filter logs
      const processedLogs = LogsProcessor.processLogs(rawLogs, {
        level,
        search,
        page: parseInt(page),
        limit: parseInt(limit),
      });

      res.json({
        success: true,
        data: processedLogs,
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'getLogs', res);
    }
  }

  /**
   * Download all logs as a text file
   */
  static async downloadLogs(req, res) {
    try {
      const logsContent = await LogsService.exportAllLogs();

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="logs-${new Date().toISOString().split('T')[0]}.txt"`
      );
      res.send(logsContent);
    } catch (error) {
      ErrorHandler.handleApiError(error, 'downloadLogs', res);
    }
  }

  /**
   * Clear all log files
   */
  static async clearLogs(req, res) {
    try {
      const result = await LogsService.clearAllLogs();

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'clearLogs', res);
    }
  }

  /**
   * Get log statistics
   */
  static async getLogStats(req, res) {
    try {
      const stats = await LogsService.getLogStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'getLogStats', res);
    }
  }
}

export default LogsController;
