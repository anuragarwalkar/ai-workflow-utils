/**
 * Environment configuration management for Jira operations
 */

import logger from '../../../logger.js';

export class EnvironmentConfig {
  /**
   * Get Jira configuration from environment
   * @returns {Object} Jira configuration
   */
  static get() {
    const config = {
      jiraUrl: process.env.JIRA_URL,
      jiraToken: process.env.JIRA_TOKEN,
    };

    // Validate required configuration
    if (!config.jiraUrl || !config.jiraToken) {
      const missing = [];
      if (!config.jiraUrl) missing.push('JIRA_URL');
      if (!config.jiraToken) missing.push('JIRA_TOKEN');

      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`,
      );
    }

    return config;
  }

  /**
   * Get Jira API base URL
   * @returns {string} Base URL
   */
  static getBaseUrl() {
    const { jiraUrl } = this.get();
    return jiraUrl.endsWith('/') ? jiraUrl.slice(0, -1) : jiraUrl;
  }

  /**
   * Get authentication headers for Jira API
   * @returns {Object} Headers object
   */
  static getAuthHeaders() {
    const { jiraToken } = this.get();
    return {
      Authorization: `Bearer ${jiraToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  /**
   * Get attachment upload headers
   * @returns {Object} Headers object
   */
  static getAttachmentHeaders() {
    const { jiraToken } = this.get();
    return {
      'X-Atlassian-Token': 'no-check',
      Authorization: `Bearer ${jiraToken}`,
    };
  }

  /**
   * Validate environment configuration
   * @returns {boolean} True if valid
   */
  static validate() {
    try {
      this.get();
      return true;
    } catch (error) {
      logger.error(`Jira configuration validation failed: ${error.message}`);
      return false;
    }
  }
}
