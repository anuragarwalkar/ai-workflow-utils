/**
 * Custom field processor for Jira field data processing
 */

import logger from '../../../logger.js';

/**
 * Process custom fields array into Jira API format
 * @param {Array} customFields - Array of custom field objects
 * @returns {Object} Processed custom fields object
 */
export const processCustomFields = (customFields) => {
  const processedFields = {};

  if (!customFields || !Array.isArray(customFields)) {
    return processedFields;
  }

  customFields.forEach((field, index) => {
    try {
      if (!field.key || field.value === undefined || field.value === null) {
        logger.warn(`Skipping invalid custom field at index ${index}`, {
          field,
        });
        return;
      }

      const processedValue = processFieldValue(field.value, field.type);
      processedFields[field.key] = processedValue;

      logger.debug('Processed custom field', {
        key: field.key,
        originalType: typeof field.value,
        processedType: typeof processedValue,
      });
    } catch (error) {
      logger.error(`Error processing custom field at index ${index}`, {
        field,
        error: error.message,
      });
      // Continue processing other fields even if one fails
    }
  });

  return processedFields;
};

/**
 * Process individual field value based on its type and content
 * @param {any} value - Field value
 * @param {string} type - Field type hint (optional)
 * @returns {any} Processed value
 */
export const processFieldValue = (value, type = null) => {
  if (value === null || value === undefined) {
    return value;
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(item => processFieldValue(item, type));
  }

  // Handle objects
  if (typeof value === 'object') {
    return processObjectValue(value);
  }

  // Handle strings that might be JSON
  if (typeof value === 'string') {
    return processStringValue(value, type);
  }

  // Return primitive values as-is
  return value;
};

/**
 * Process object values
 * @param {Object} obj - Object value
 * @returns {Object} Processed object
 */
export const processObjectValue = (obj) => {
  const processed = {};

  for (const [key, val] of Object.entries(obj)) {
    processed[key] = processFieldValue(val);
  }

  return processed;
};

/**
 * Process string values, handling potential JSON content
 * @param {string} value - String value
 * @param {string} type - Field type hint
 * @returns {any} Processed value
 */
export const processStringValue = (value, type) => {
  const trimmedValue = value.trim();

  // Handle empty strings
  if (trimmedValue === '') {
    return value;
  }

  // Handle specific field types
  if (type) {
    return processTypedStringValue(trimmedValue, type);
  }

  // Check if string looks like JSON
  if (isJsonLike(trimmedValue)) {
    try {
      const sanitized = sanitizeJsonString(trimmedValue);
      return JSON.parse(sanitized);
    } catch (error) {
      logger.warn('Failed to parse JSON-like string, using as string', {
        value: trimmedValue.substring(0, 100),
        error: error.message,
      });
      return value;
    }
  }

  // Handle comma-separated values that might be arrays
  if (type === 'multi-select' || isCommaSeparatedList(trimmedValue)) {
    return parseCommaSeparatedList(trimmedValue);
  }

  return value;
};

/**
 * Process string values with specific type hints
 * @param {string} value - String value
 * @param {string} type - Field type
 * @returns {any} Processed value
 */
export const processTypedStringValue = (value, type) => {
  switch (type.toLowerCase()) {
  case 'number':
    const num = parseFloat(value);
    return isNaN(num) ? value : num;

  case 'boolean':
    return parseBoolean(value);

  case 'date':
    return parseDate(value);

  case 'multi-select':
  case 'array':
    return parseCommaSeparatedList(value);

  case 'user':
    return parseUserValue(value);

  case 'option':
    return { value };

  default:
    return value;
  }
};

/**
 * Check if string looks like JSON
 * @param {string} str - String to check
 * @returns {boolean} True if JSON-like
 */
export const isJsonLike = (str) => {
  return (
    (str.startsWith('{') && str.endsWith('}')) ||
    (str.startsWith('[') && str.endsWith(']'))
  );
};

/**
 * Sanitize JSON string for parsing
 * @param {string} jsonStr - JSON string
 * @returns {string} Sanitized JSON string
 */
export const sanitizeJsonString = (jsonStr) => {
  // Fix unquoted object keys like { id: "007" } -> { "id": "007" }
  return jsonStr.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
};

/**
 * Check if string is a comma-separated list
 * @param {string} str - String to check
 * @returns {boolean} True if comma-separated
 */
export const isCommaSeparatedList = (str) => {
  return (
    str.includes(',') && !isJsonLike(str) && str.split(',').length > 1
  );
};

/**
 * Parse comma-separated list into array
 * @param {string} str - Comma-separated string
 * @returns {Array} Array of trimmed values
 */
export const parseCommaSeparatedList = (str) => {
  return str
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);
};

/**
 * Parse boolean value from string
 * @param {string} str - String to parse
 * @returns {boolean} Boolean value
 */
export const parseBoolean = (str) => {
  const lowerStr = str.toLowerCase().trim();
  return lowerStr === 'true' || lowerStr === '1' || lowerStr === 'yes';
};

/**
 * Parse date value from string
 * @param {string} str - Date string
 * @returns {string} ISO date string or original string
 */
export const parseDate = (str) => {
  try {
    const date = new Date(str);
    return isNaN(date.getTime()) ? str : date.toISOString();
  } catch (error) {
    return str;
  }
};

/**
 * Parse user value into Jira user format
 * @param {string} str - User string (could be username, email, or display name)
 * @returns {Object} User object
 */
export const parseUserValue = (str) => {
  // If it looks like JSON, try to parse it
  if (isJsonLike(str)) {
    try {
      return JSON.parse(sanitizeJsonString(str));
    } catch (error) {
      // Fall through to string handling
    }
  }

  // Handle different user string formats
  if (str.includes('@')) {
    return { emailAddress: str };
  } else {
    return { name: str };
  }
};

/**
 * Validate processed custom fields
 * @param {Object} processedFields - Processed custom fields
 * @returns {Object} Validation result
 */
export const validateProcessedFields = (processedFields) => {
  const errors = [];

  for (const [key, value] of Object.entries(processedFields)) {
    try {
      // Check if value can be serialized (no circular references, etc.)
      JSON.stringify(value);
    } catch (error) {
      errors.push(
        `Custom field '${key}' contains invalid data: ${error.message}`,
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get field type suggestions based on value analysis
 * @param {any} value - Field value
 * @returns {Array<string>} Suggested field types
 */
export const suggestFieldTypes = (value) => {
  const suggestions = [];

  if (typeof value === 'string') {
    if (value.includes('@')) suggestions.push('user');
    if (value.includes(',')) suggestions.push('multi-select');
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) suggestions.push('date');
    if (/^(true|false|yes|no|1|0)$/i.test(value)) suggestions.push('boolean');
    if (/^\d+(\.\d+)?$/.test(value)) suggestions.push('number');
    if (isJsonLike(value)) suggestions.push('json');
  } else if (typeof value === 'number') {
    suggestions.push('number');
  } else if (typeof value === 'boolean') {
    suggestions.push('boolean');
  } else if (Array.isArray(value)) {
    suggestions.push('multi-select', 'array');
  } else if (typeof value === 'object') {
    suggestions.push('json', 'user');
  }

  return suggestions.length > 0 ? suggestions : ['text'];
};

/**
 * Clean custom field values for display
 * @param {Object} customFields - Custom fields object
 * @returns {Object} Display-friendly custom fields
 */
export const cleanForDisplay = (customFields) => {
  const cleaned = {};

  for (const [key, value] of Object.entries(customFields)) {
    if (typeof value === 'object' && value !== null) {
      cleaned[key] = JSON.stringify(value, null, 2);
    } else {
      cleaned[key] = String(value);
    }
  }

  return cleaned;
};

// Export all functions as default for backward compatibility
export const CustomFieldProcessor = {
  processCustomFields,
  processFieldValue,
  processObjectValue,
  processStringValue,
  processTypedStringValue,
  isJsonLike,
  sanitizeJsonString,
  isCommaSeparatedList,
  parseCommaSeparatedList,
  parseBoolean,
  parseDate,
  parseUserValue,
  validateProcessedFields,
  suggestFieldTypes,
  cleanForDisplay,
};

export default CustomFieldProcessor;
