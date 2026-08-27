import environmentDbService from '../../../services/environmentDbService.ts';
import logger from '../../../logger.ts';

/**
 * EnvironmentConfig - Email module specific environment configuration
 */
class EnvironmentConfig {
  /**
   * Gets email configuration from environment settings
   * @returns {Promise<Object|null>} Email configuration object
   */
  static async getEmailConfig() {
    try {
      const dbSettings = await environmentDbService.getSettings();
      const envSettings = {
        ...dbSettings,
        ...process.env,
      };

      return {
        service: envSettings.email_service || process.env.EMAIL_SERVICE || 'gmail',
        user: envSettings.email_user || process.env.EMAIL_USER || process.env.GOOGLE_APP_EMAIL,
        password:
          envSettings.email_password ||
          process.env.EMAIL_PASSWORD ||
          process.env.GOOGLE_APP_PASSWORD,
        host: envSettings.email_host || process.env.EMAIL_HOST,
        port: envSettings.email_port || process.env.EMAIL_PORT,
        secure: envSettings.email_secure !== false,
      };
    } catch (error) {
      logger.error('Failed to get email config', { error: error.message });
      return null;
    }
  }

  /**
   * Gets general environment settings
   * @returns {Promise<Object>} Environment settings
   */
  static async get() {
    try {
      return await environmentDbService.getSettings();
    } catch {
      return {};
    }
  }
}

export { EnvironmentConfig };
export default EnvironmentConfig;
