/**
 * Log Entry Model - Represents a single log entry
 * Provides validation and formatting for log data
 */
class LogEntry {
  constructor(data) {
    this.timestamp = data.timestamp || new Date().toISOString();
    this.level = data.level || 'info';
    this.message = data.message || '';
    this.module = data.module || 'system';
    this.meta = data.meta || {};
    this.source = data.source || '';
  }
  
  /**
   * Validate log entry data
   * @param {Object} data - Log entry data
   * @throws {Error} If validation fails
   */
  static validate(data) {
    const required = ['message'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    const validLevels = ['error', 'warn', 'info', 'debug'];
    if (data.level && !validLevels.includes(data.level)) {
      throw new Error(`Invalid log level: ${data.level}. Must be one of: ${validLevels.join(', ')}`);
    }
  }
  
  /**
   * Create a log entry from raw data
   * @param {Object} data - Raw log data
   * @returns {LogEntry} Log entry instance
   */
  static fromRaw(data) {
    this.validate(data);
    return new LogEntry(data);
  }
  
  /**
   * Convert to JSON format
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      timestamp: this.timestamp,
      level: this.level,
      message: this.message,
      module: this.module,
      meta: this.meta,
      source: this.source
    };
  }
  
  /**
   * Convert to display format
   * @returns {Object} Display-friendly format
   */
  toDisplay() {
    return {
      ...this.toJSON(),
      formattedTimestamp: this.formatTimestamp(),
      levelColor: this.getLevelColor(),
      severity: this.getSeverity()
    };
  }
  
  /**
   * Format timestamp for display
   * @returns {string} Formatted timestamp
   */
  formatTimestamp() {
    return new Date(this.timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  
  /**
   * Get color for the log level
   * @returns {string} Color name
   */
  getLevelColor() {
    const colors = {
      error: 'error',
      warn: 'warning',
      info: 'info',
      debug: 'default'
    };
    return colors[this.level] || 'default';
  }
  
  /**
   * Get numeric severity for the log level
   * @returns {number} Severity level
   */
  getSeverity() {
    const severities = {
      error: 4,
      warn: 3,
      info: 2,
      debug: 1
    };
    return severities[this.level] || 0;
  }
  
  /**
   * Check if log matches search criteria
   * @param {string} searchTerm - Search term
   * @returns {boolean} True if matches
   */
  matches(searchTerm) {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      this.message.toLowerCase().includes(term) ||
      this.module.toLowerCase().includes(term) ||
      this.source.toLowerCase().includes(term) ||
      (this.meta && JSON.stringify(this.meta).toLowerCase().includes(term))
    );
  }
  
  /**
   * Check if log matches level filter
   * @param {string} levelFilter - Level filter ('all' or specific level)
   * @returns {boolean} True if matches
   */
  matchesLevel(levelFilter) {
    return levelFilter === 'all' || this.level === levelFilter;
  }
}

/**
 * Log Query Model - Represents query parameters for log retrieval
 */
class LogQuery {
  constructor(params = {}) {
    this.level = params.level || 'all';
    this.search = params.search || '';
    this.page = Math.max(1, parseInt(params.page) || 1);
    this.limit = Math.min(100, Math.max(1, parseInt(params.limit) || 25));
    this.sortBy = params.sortBy || 'timestamp';
    this.sortOrder = params.sortOrder === 'asc' ? 'asc' : 'desc';
  }
  
  /**
   * Validate query parameters
   * @throws {Error} If validation fails
   */
  validate() {
    const validLevels = ['all', 'error', 'warn', 'info', 'debug'];
    if (!validLevels.includes(this.level)) {
      throw new Error(`Invalid level filter: ${this.level}`);
    }
    
    const validSortFields = ['timestamp', 'level', 'module'];
    if (!validSortFields.includes(this.sortBy)) {
      throw new Error(`Invalid sort field: ${this.sortBy}`);
    }
  }
  
  /**
   * Get offset for pagination
   * @returns {number} Offset value
   */
  getOffset() {
    return (this.page - 1) * this.limit;
  }
  
  /**
   * Convert to object
   * @returns {Object} Query parameters as object
   */
  toObject() {
    return {
      level: this.level,
      search: this.search,
      page: this.page,
      limit: this.limit,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };
  }
}

export { LogEntry, LogQuery };
export default LogEntry;
