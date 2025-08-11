/**
 * Configuration Processor
 * Handles processing and transformation of configuration data
 */
export class ConfigurationProcessor {
  /**
   * Process configuration data for display
   * @param {Object} config - Raw configuration data
   * @returns {Object} Processed configuration
   */
  static processForDisplay(config) {
    if (!config || typeof config !== 'object') {
      return {};
    }

    // Create a deep copy to avoid mutating the original
    const processedConfig = JSON.parse(JSON.stringify(config));

    // Mask sensitive values
    this.maskSensitiveFields(processedConfig);

    return processedConfig;
  }

  /**
   * Process configuration data for storage
   * @param {Object} config - Configuration data to process
   * @returns {Object} Processed configuration for storage
   */
  static processForStorage(config) {
    if (!config || typeof config !== 'object') {
      return {};
    }

    // Remove any client-side only fields
    const { _clientId, _timestamp, ...storageConfig } = config;

    return storageConfig;
  }

  /**
   * Mask sensitive fields in configuration
   * @param {Object} config - Configuration object to mask
   */
  static maskSensitiveFields(config) {
    const sensitiveFields = [
      'token',
      'key',
      'password',
      'secret',
      'auth',
      'JIRA_TOKEN',
      'BITBUCKET_AUTHORIZATION_TOKEN',
      'OPENAI_COMPATIBLE_API_KEY',
      'ANTHROPIC_API_KEY',
      'GOOGLE_API_KEY',
      'OLLAMA_API_KEY',
    ];

    const maskValue = value => {
      if (typeof value === 'string' && value.length > 0) {
        return value.substring(0, 4) + '*'.repeat(Math.max(0, value.length - 4));
      }
      return value;
    };

    const processObject = obj => {
      if (!obj || typeof obj !== 'object') return;

      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          processObject(obj[key]);
        } else if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          obj[key] = maskValue(obj[key]);
        }
      });
    };

    processObject(config);
  }

  /**
   * Validate configuration structure
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result
   */
  static validateStructure(config) {
    const result = { valid: true, errors: [] };

    if (!config || typeof config !== 'object') {
      result.valid = false;
      result.errors.push('Configuration must be a valid object');
      return result;
    }

    // Add specific structure validation as needed
    // For now, basic object validation is sufficient

    return result;
  }
}
