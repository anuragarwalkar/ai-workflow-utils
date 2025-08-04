/**
 * Template settings model
 */
class TemplateSettings {
  constructor(data = {}) {
    this.version = data.version || '1.0.0';
    this.lastUpdated = data.lastUpdated || new Date().toISOString();
    this.defaultIssueTypes = data.defaultIssueTypes || [
      'story',
      'task',
      'bug',
      'epic',
      'subtask',
    ];
    this.maxTemplatesPerType = data.maxTemplatesPerType || 10;
    this.allowCustomIssueTypes = data.allowCustomIssueTypes !== false;
    this.autoBackup = data.autoBackup !== false;
    this.backupRetentionDays = data.backupRetentionDays || 30;
  }

  /**
   * Validate settings data
   * @param {Object} data - Settings data to validate
   * @throws {Error} If validation fails
   */
  static validate(data) {
    if (
      data.maxTemplatesPerType &&
      (data.maxTemplatesPerType < 1 || data.maxTemplatesPerType > 50)
    ) {
      throw new Error('maxTemplatesPerType must be between 1 and 50');
    }

    if (
      data.backupRetentionDays &&
      (data.backupRetentionDays < 1 || data.backupRetentionDays > 365)
    ) {
      throw new Error('backupRetentionDays must be between 1 and 365');
    }

    if (data.defaultIssueTypes && !Array.isArray(data.defaultIssueTypes)) {
      throw new Error('defaultIssueTypes must be an array');
    }
  }

  /**
   * Update settings
   * @param {Object} updates - Fields to update
   */
  update(updates) {
    const allowedFields = [
      'defaultIssueTypes',
      'maxTemplatesPerType',
      'allowCustomIssueTypes',
      'autoBackup',
      'backupRetentionDays',
    ];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        this[key] = updates[key];
      }
    });

    this.lastUpdated = new Date().toISOString();
  }

  /**
   * Convert to database format
   * @returns {Object} Database-compatible object
   */
  toDbFormat() {
    return {
      version: this.version,
      lastUpdated: this.lastUpdated,
      defaultIssueTypes: this.defaultIssueTypes,
      maxTemplatesPerType: this.maxTemplatesPerType,
      allowCustomIssueTypes: this.allowCustomIssueTypes,
      autoBackup: this.autoBackup,
      backupRetentionDays: this.backupRetentionDays,
    };
  }

  /**
   * Convert to API response format
   * @returns {Object} API-compatible object
   */
  toApiFormat() {
    return this.toDbFormat();
  }

  /**
   * Create settings from database data
   * @param {Object} dbData - Data from database
   * @returns {TemplateSettings} Settings instance
   */
  static fromDb(dbData) {
    return new TemplateSettings(dbData);
  }
}

export default TemplateSettings;
