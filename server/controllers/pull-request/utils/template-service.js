import templateDbService from "../../../services/templateDbService.js";
import logger from "../../../logger.js";

/**
 * Template service wrapper for PR operations
 */
class TemplateService {
  static async getPRTemplate(templateType) {
    try {
      await templateDbService.init();
      const template = await templateDbService.getActiveTemplate(templateType);
      if (!template) {
        logger.warn(`No active template found for ${templateType}, using fallback`);
        return null;
      }
      return template;
    } catch (error) {
      logger.error(`Error getting ${templateType} template:`, error);
      return null;
    }
  }
}

export default TemplateService;
