import crypto from 'crypto';

/**
 * Template model with validation and payload generation
 */
class Template {
  constructor(data) {
    this.id = data.id || crypto.randomUUID();
    this.name = data.name;
    this.issueType = data.issueType;
    this.content = data.content;
    this.isDefault = data.isDefault || false;
    this.isActive = data.isActive || false;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.variables = data.variables || this.extractVariables(data.content);
  }

  /**
   * Validate template data
   * @param {Object} data - Template data to validate
   * @throws {Error} If validation fails
   */
  static validate(data) {
    const required = ['name', 'issueType', 'content'];
    const missing = required.filter(field => !data[field] || data[field].trim() === '');
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // Validate name length
    if (data.name.length > 100) {
      throw new Error('Template name must be 100 characters or less');
    }

    // Validate issue type format
    if (!/^[a-zA-Z0-9_-]+$/.test(data.issueType)) {
      throw new Error('Issue type can only contain letters, numbers, underscores, and hyphens');
    }

    // Validate content length
    if (data.content.length > 10000) {
      throw new Error('Template content must be 10000 characters or less');
    }
  }

  /**
   * Extract variables from template content
   * @param {string} content - Template content
   * @returns {Array} Array of unique variable names
   */
  extractVariables(content) {
    if (!content) return [];
    
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const variables = [];
    let match;

    while ((match = variablePattern.exec(content)) !== null) {
      const variable = match[1].trim();
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }

    return variables;
  }

  /**
   * Update template data
   * @param {Object} updates - Fields to update
   */
  update(updates) {
    const allowedFields = ['name', 'issueType', 'content', 'isActive'];
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        this[key] = updates[key];
      }
    });

    // Re-extract variables if content was updated
    if (updates.content) {
      this.variables = this.extractVariables(updates.content);
    }

    this.updatedAt = new Date().toISOString();
  }

  /**
   * Convert to database format
   * @returns {Object} Database-compatible object
   */
  toDbFormat() {
    return {
      id: this.id,
      name: this.name,
      issueType: this.issueType,
      content: this.content,
      isDefault: this.isDefault,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      variables: this.variables
    };
  }

  /**
   * Convert to API response format
   * @returns {Object} API-compatible object
   */
  toApiFormat() {
    return {
      id: this.id,
      name: this.name,
      issueType: this.issueType,
      content: this.content,
      isDefault: this.isDefault,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      variables: this.variables,
      canBeDeleted: this.canBeDeleted(),
      canBeModified: this.canBeModified()
    };
  }

  /**
   * Create template from database data
   * @param {Object} dbData - Data from database
   * @returns {Template} Template instance
   */
  static fromDb(dbData) {
    return new Template(dbData);
  }

  /**
   * Check if template can be deleted
   * @returns {boolean} True if template can be deleted
   */
  canBeDeleted() {
    return !this.isDefault;
  }

  /**
   * Check if template can be modified
   * @returns {boolean} True if template can be modified
   */
  canBeModified() {
    return !this.isDefault;
  }
}

export default Template;
