/**
 * Constants for Email module
 */

// Email processing constants
export const EMAIL_CONSTANTS = {
  // Table formatting
  COLUMNS_TO_REMOVE: ['Value Stream', 'Value Stream Version', 'Remarks (Optional)'],
  GROUP_BY_FIELDS: ['Value Stream', 'Value Stream Version'],
  
  // Required fields for email generation
  REQUIRED_FIELDS: ['version', 'wikiUrl', 'wikiBasicAuth'],
  
  // HTML styling
  STYLES: {
    GROUP_HEADER: 'background-color:#eef3f7;padding:10px;font-weight:bold;text-align:left;border-left:4px solid #801C81;margin-top:30px;font-family:Arial,sans-serif;font-size:14px;',
    TABLE: 'width:100%;border-collapse:collapse;margin-top:10px;font-family:Arial,sans-serif;font-size:14px;',
    TABLE_HEADER: 'border:1px solid #ccc;padding:10px;background-color:#f2f2f2;text-align:center;vertical-align:middle;',
    TABLE_CELL: 'border:1px solid #ccc;padding:10px;text-align:left;vertical-align:middle;',
    LINK: 'color:#0645AD;text-decoration:none;',
    FOOTER: 'margin-top:30px;padding:15px;background-color:#f5f5f5;border-top:2px solid #801C81;font-family:Arial,sans-serif;font-size:12px;color:#666;'
  },
  
  // Validation patterns
  VALIDATION: {
    URL_PATTERN: /^https?:\/\/.+/,
    BUILD_VERSION_PATTERN: /^.+$/,
    JIRA_KEY_PATTERN: /^[A-Z]+-\d+$/
  },
  
  // Time-based greetings
  GREETINGS: {
    MORNING: 'Good morning, team,',
    AFTERNOON: 'Good afternoon, team,',
    EVENING: 'Good evening, team,',
    DEFAULT: 'Hello team,'
  },
  
  // Time ranges for greetings (24-hour format)
  TIME_RANGES: {
    MORNING_START: 5,
    AFTERNOON_START: 12,
    EVENING_START: 17,
    NIGHT_START: 22
  },
  
  // Error messages
  ERRORS: {
    INVALID_TABLE_DATA: 'Invalid table data: must be non-empty array',
    MISSING_REQUIRED_FIELDS: 'Missing required fields',
    INVALID_URL_FORMAT: 'Invalid URL format',
    HEADING_NOT_FOUND: 'Heading not found for build',
    TABLE_NOT_FOUND: 'Table not found for the build section',
    EMPTY_CONTENT: 'Generated content is empty',
    WIKI_FETCH_FAILED: 'Failed to fetch wiki content',
    JIRA_ENHANCEMENT_FAILED: 'Failed to enhance with Jira data'
  },
  
  // HTTP status codes
  HTTP_STATUS: {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
  },
  
  // Column mappings
  COLUMN_MAPPINGS: {
    JIRA_URL: 'Jira URL',
    SUMMARY: 'Summary'
  },
  
  // Default values
  DEFAULTS: {
    EMPTY_CELL: '',
    JIRA_BASE_URL: 'https://jira/app/',
    DATE_LOCALE: 'en-GB',
    DATE_FORMAT_OPTIONS: {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }
  }
};

// Export individual constants for convenience
export const {
  COLUMNS_TO_REMOVE,
  GROUP_BY_FIELDS,
  REQUIRED_FIELDS,
  STYLES,
  VALIDATION,
  GREETINGS,
  TIME_RANGES,
  ERRORS,
  HTTP_STATUS,
  COLUMN_MAPPINGS,
  DEFAULTS
} = EMAIL_CONSTANTS;
