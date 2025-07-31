import path from 'path';

/**
 * Logs Configuration - Centralized configuration for logs operations
 */
class LogsConfig {
  /**
   * Get the logs directory path
   * @returns {string} Logs directory path
   */
  static getLogsDirectory() {
    return path.join(process.cwd(), 'logs');
  }
  
  /**
   * Get server logs directory path
   * @returns {string} Server logs directory path
   */
  static getServerLogsDirectory() {
    return path.join(process.cwd(), 'server', 'logs');
  }
  
  /**
   * Get supported log file extensions
   * @returns {Array} Array of file extensions
   */
  static getSupportedExtensions() {
    return ['.log', '.txt'];
  }
  
  /**
   * Get maximum file size for log processing (in bytes)
   * @returns {number} Maximum file size
   */
  static getMaxFileSize() {
    return 10 * 1024 * 1024; // 10MB
  }
  
  /**
   * Get default pagination limit
   * @returns {number} Default limit
   */
  static getDefaultLimit() {
    return 25;
  }
  
  /**
   * Get maximum pagination limit
   * @returns {number} Maximum limit
   */
  static getMaxLimit() {
    return 100;
  }
  
  /**
   * Get log levels in order of severity
   * @returns {Array} Log levels
   */
  static getLogLevels() {
    return ['error', 'warn', 'info', 'debug'];
  }
  
  /**
   * Get log level colors for UI
   * @returns {Object} Level to color mapping
   */
  static getLevelColors() {
    return {
      error: 'error',
      warn: 'warning',
      info: 'info',
      debug: 'default'
    };
  }
  
  /**
   * Get log level severities
   * @returns {Object} Level to severity mapping
   */
  static getLevelSeverities() {
    return {
      error: 4,
      warn: 3,
      info: 2,
      debug: 1
    };
  }
  
  /**
   * Check if a file extension is supported
   * @param {string} extension - File extension
   * @returns {boolean} True if supported
   */
  static isSupportedExtension(extension) {
    return this.getSupportedExtensions().includes(extension.toLowerCase());
  }
  
  /**
   * Check if a log level is valid
   * @param {string} level - Log level
   * @returns {boolean} True if valid
   */
  static isValidLevel(level) {
    return level === 'all' || this.getLogLevels().includes(level);
  }
}

export { LogsConfig };
export default LogsConfig;
