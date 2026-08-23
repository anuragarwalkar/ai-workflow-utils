import { Request, Response } from 'express';
import LogsService from './services/logs-service.js';
import LogsProcessor from './processors/logs-processor.js';
import { ErrorHandler } from './utils/error-handler.js';

class LogsController {
  static async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const { level = 'all', search = '', page = '1', limit = '25' } = req.query;

      const rawLogs = await LogsService.fetchLogs();

      const processedLogs = LogsProcessor.processLogs(rawLogs, {
        level: level as string,
        search: search as string,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      });

      res.json({
        success: true,
        data: processedLogs,
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'getLogs', res);
    }
  }

  static async downloadLogs(_req: Request, res: Response): Promise<void> {
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

  static async clearLogs(_req: Request, res: Response): Promise<void> {
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

  static async getLogStats(_req: Request, res: Response): Promise<void> {
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
