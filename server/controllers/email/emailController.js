import { WikiService } from './services/wiki-service.js';
import { JiraIntegrationService } from './services/jira-integration-service.js';
import { EmailContentService } from './services/email-content-service.js';
import { EmailRequest } from './models/email-request.js';
import { ErrorHandler } from './utils/error-handler.js';
import logger from '../../logger.js';

/**
 * Email Controller - Main orchestrator for email generation workflow
 * Follows modular architecture with clear separation of concerns
 */
class EmailController {
  /**
   * Handles email generation request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async sendEmail(req, res) {
    try {
      // Validate and create email request model
      const emailRequest = new EmailRequest(req.query, req.body);
      EmailRequest.validate(emailRequest);

      logger.info('Processing email generation request', {
        version: emailRequest.version,
        wikiUrl: emailRequest.wikiUrl
      });

      // Step 1: Fetch wiki content
      const wikiContent = await WikiService.fetchWikiContent(
        emailRequest.wikiUrl,
        emailRequest.wikiBasicAuth
      );

      // Step 2: Extract table data from wiki content
      const tableData = await WikiService.extractTableData(
        wikiContent,
        emailRequest.version
      );

      // Step 3: Enhance table data with Jira information
      const enhancedTableData = await JiraIntegrationService.enhanceWithJiraSummaries(tableData);

      // Step 4: Generate email content
      const emailBody = EmailContentService.generateEmailBody(
        enhancedTableData,
        {
          wikiUrl: emailRequest.wikiUrl,
          version: emailRequest.version
        }
      );

      logger.info('Email generation completed successfully');

      res.status(200).send(emailBody);

    } catch (error) {
      ErrorHandler.handleApiError(error, 'email generation', res);
    }
  }
}

export default EmailController;
