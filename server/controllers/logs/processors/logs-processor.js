/**
 * Logs Processor - Handles log data transformation and filtering
 * Responsible for processing, filtering, and paginating log data
 */
class LogsProcessor {
  /**
   * Clean ANSI color codes from text
   * @param {string} text - Text with potential ANSI codes
   * @returns {string} Clean text
   */
  static cleanAnsiCodes(text) {
    if (!text) return text;
    // Remove ANSI color codes
    return text.replace(/\[\d+m/g, '');
  }

  /**
   * Parse log line and extract structured data
   * @param {string} line - Raw log line
   * @param {string} source - Source file name
   * @returns {Object} Parsed log entry
   */
  static parseLogLine(line, source) {
    if (!line || !line.trim()) return null;

    try {
      // Try parsing as JSON first
      const jsonLog = JSON.parse(line);
      return {
        timestamp: jsonLog.timestamp || new Date().toISOString(),
        level: jsonLog.level?.toLowerCase() || 'info',
        message: jsonLog.message || '',
        module: jsonLog.module || source.replace('.log', ''),
        meta: jsonLog.meta || {},
        source,
      };
    } catch (e) {
      // Parse Winston formatted logs with ANSI codes
      const cleanLine = this.cleanAnsiCodes(line);

      // Pattern: [timestamp] [LEVEL]: message
      const winstonPattern =
        /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+\[(\w+)\]:\s+(.+)$/;
      const match = cleanLine.match(winstonPattern);

      if (match) {
        const [, timestamp, level, message] = match;
        return {
          timestamp: new Date(timestamp).toISOString(),
          level: level.toLowerCase(),
          message: message.trim(),
          module: source.replace('.log', ''),
          meta: {},
          source,
        };
      }

      // Fallback for other formats
      return {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: cleanLine.trim(),
        module: source.replace('.log', ''),
        meta: {},
        source,
      };
    }
  }

  /**
   * Process logs with filtering, search, and pagination
   * @param {Array} logs - Raw log entries
   * @param {Object} options - Processing options
   * @returns {Object} Processed logs with pagination and stats
   */
  static processLogs(logs, options = {}) {
    const { level = 'all', search = '', page = 1, limit = 25 } = options;

    // Filter by level
    let filteredLogs =
      level === 'all' ? logs : logs.filter(log => log.level === level);

    // Filter by search term
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredLogs = filteredLogs.filter(
        log =>
          log.message?.toLowerCase().includes(searchTerm) ||
          log.module?.toLowerCase().includes(searchTerm) ||
          log.source?.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Calculate statistics
    const stats = this.calculateStats(filteredLogs);

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    return {
      logs: paginatedLogs,
      total: filteredLogs.length,
      stats,
      page,
      limit,
      totalPages: Math.ceil(filteredLogs.length / limit),
    };
  }

  /**
   * Calculate statistics for logs
   * @param {Array} logs - Log entries
   * @returns {Object} Statistics object
   */
  static calculateStats(logs) {
    return logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Format log entry for display
   * @param {Object} log - Log entry
   * @returns {Object} Formatted log entry
   */
  static formatLogEntry(log) {
    return {
      ...log,
      formattedTimestamp: this.formatTimestamp(log.timestamp),
      levelColor: this.getLevelColor(log.level),
      severity: this.getLevelSeverity(log.level),
    };
  }

  /**
   * Format timestamp for display
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Formatted timestamp
   */
  static formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  /**
   * Get color for log level
   * @param {string} level - Log level
   * @returns {string} Color name
   */
  static getLevelColor(level) {
    const colors = {
      error: 'error',
      warn: 'warning',
      info: 'info',
      debug: 'default',
    };
    return colors[level] || 'default';
  }

  /**
   * Get severity number for log level
   * @param {string} level - Log level
   * @returns {number} Severity (higher = more severe)
   */
  static getLevelSeverity(level) {
    const severities = {
      error: 4,
      warn: 3,
      info: 2,
      debug: 1,
    };
    return severities[level] || 0;
  }

  /**
   * Group logs by time period
   * @param {Array} logs - Log entries
   * @param {string} period - 'hour', 'day', 'week'
   * @returns {Object} Grouped logs
   */
  static groupLogsByTime(logs, period = 'day') {
    const grouped = {};

    logs.forEach(log => {
      const date = new Date(log.timestamp);
      let key;

      switch (period) {
        case 'hour':
          key = date.toISOString().slice(0, 13) + ':00:00';
          break;
        case 'week': {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().slice(0, 10);
          break;
        }
        case 'day':
        default:
          key = date.toISOString().slice(0, 10);
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(log);
    });

    return grouped;
  }
}

export default LogsProcessor;
