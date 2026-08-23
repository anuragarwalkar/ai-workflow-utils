import { EnvironmentDbService } from '../../../services/environmentDbService.js';
import logger from '../../../logger.js';

/**
 * EnvironmentConfig - Email module specific environment configuration
 */
class EnvironmentConfig {
  /**
   * Gets email configuration from environment settings
   * @returns {Object|null} Email configuration object
   */
  static getEmailConfig() {
    try {
      const envSettings = EnvironmentDbService.getAllSettings();

      return {
        service: envSettings.email_service || 'gmail',
        user: envSettings.email_user,
        password: envSettings.email_password,
        host: envSettings.email_host,
        port: envSettings.email_port,
        secure: envSettings.email_secure !== false,
      };
    } catch (error) {
      logger.error('Failed to get email config', { error: error.message });
      return null;
    }
  }

  /**
   * Gets general environment settings
   * @returns {Object} Environment settings
   */
  static get() {
    return EnvironmentDbService.getAllSettings();
  }
}

export { EnvironmentConfig };
