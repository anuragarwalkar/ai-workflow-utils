// Template module constants

export const TEMPLATE_CONSTANTS = {
  // Validation limits
  MAX_NAME_LENGTH: 100,
  MAX_CONTENT_LENGTH: 1000000,
  MAX_TEMPLATES_PER_TYPE: 50,
  MAX_BACKUP_RETENTION_DAYS: 365,
  MIN_BACKUP_RETENTION_DAYS: 1,

  // Default values
  DEFAULT_BACKUP_RETENTION_DAYS: 30,
  DEFAULT_MAX_TEMPLATES_PER_TYPE: 10,

  // Issue types
  DEFAULT_ISSUE_TYPES: ['story', 'task', 'bug', 'epic', 'subtask'],

  // Template statuses
  TEMPLATE_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    DEFAULT: 'default',
    USER_CREATED: 'user_created',
  },

  // Export/Import
  EXPORT_VERSION: '1.0.0',
  SUPPORTED_IMPORT_VERSIONS: ['1.0.0'],

  // File patterns
  VARIABLE_PATTERN: /\{\{([^}]+)\}\}/g,
  ISSUE_TYPE_PATTERN: /^[a-zA-Z0-9_-]+$/,
  UUID_PATTERN:
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,

  // Error messages
  ERROR_MESSAGES: {
    TEMPLATE_NOT_FOUND: 'Template not found',
    CANNOT_MODIFY_DEFAULT: 'Cannot modify default templates',
    CANNOT_DELETE_DEFAULT: 'Cannot delete default templates',
    INVALID_ISSUE_TYPE:
      'Issue type can only contain letters, numbers, underscores, and hyphens',
    INVALID_UUID: 'Template ID must be a valid UUID',
    MISSING_REQUIRED_FIELDS: 'Missing required fields',
    INVALID_IMPORT_DATA: 'Invalid import data format',
    NAME_TOO_LONG: 'Template name must be 100 characters or less',
    CONTENT_TOO_LONG: 'Template content must be 10000 characters or less',
  },

  // Success messages
  SUCCESS_MESSAGES: {
    TEMPLATE_CREATED: 'Template created successfully',
    TEMPLATE_UPDATED: 'Template updated successfully',
    TEMPLATE_DELETED: 'Template deleted successfully',
    TEMPLATE_DUPLICATED: 'Template duplicated successfully',
    ACTIVE_TEMPLATE_SET: 'Active template set successfully',
    SETTINGS_UPDATED: 'Settings updated successfully',
    TEMPLATES_RESET: 'Templates reset to defaults successfully',
    TEMPLATES_EXPORTED: 'Templates exported successfully',
    TEMPLATES_IMPORTED: 'Templates imported successfully',
  },

  // HTTP status codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    FORBIDDEN: 403,
    INTERNAL_SERVER_ERROR: 500,
  },

  // Complexity levels
  COMPLEXITY_LEVELS: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
  },

  // Sort options
  SORT_OPTIONS: {
    NAME: 'name',
    ISSUE_TYPE: 'issueType',
    CREATED_AT: 'createdAt',
    UPDATED_AT: 'updatedAt',
  },

  // Sort orders
  SORT_ORDERS: {
    ASC: 'asc',
    DESC: 'desc',
  },
};

export default TEMPLATE_CONSTANTS;
