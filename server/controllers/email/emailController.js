import { WikiService } from './services/wiki-service.js';
import { JiraIntegrationService } from './services/jira-integration-service.js';
import { EmailContentService } from './services/email-content-service.js';
import { EmailRequest } from './models/email-request.js';
import { ErrorHandler } from './utils/error-handler.js';
import logger from '../../logger.js';
import { EnvironmentConfig } from '../jira/utils/environment-config.js';

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
        wikiUrl: emailRequest.wikiUrl,
      });

      // Step 1: Fetch wiki content
      const wikiContent = await WikiService.fetchWikiContent(
        emailRequest.wikiUrl,
        emailRequest.wikiBasicAuth
      );

      // Step 2: Extract table data from wiki content
      const tableData = await WikiService.extractTableData(wikiContent, emailRequest.version);

      // Step 3: Enhance table data with Jira information
      const enhancedTableData = await JiraIntegrationService.enhanceWithJiraSummaries(tableData);

      // Step 4: Generate email content
      const emailBody = EmailContentService.generateEmailBody(enhancedTableData, {
        wikiUrl: emailRequest.wikiUrl,
        version: emailRequest.version,
        jiraUrl: EnvironmentConfig.getBaseUrl(),
      });

      logger.info('Email generation completed successfully');

      res.status(200).send(emailBody);
    } catch (error) {
      ErrorHandler.handleApiError(error, 'email generation', res);
    }
  }

  /**
   * Composes email using AI based on natural language prompt
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async composeWithAI(req, res) {
    try {
      const { prompt, attachedImages = [] } = req.body;

      logger.info('Processing AI email composition request', {
        prompt: `${prompt?.substring(0, 100)}...`,
        imageCount: attachedImages.length,
      });

      // Generate email using AI service
      const emailDraft = await EmailContentService.generateEmailWithAI({
        prompt,
        attachedImages,
      });

      res.json({
        success: true,
        data: emailDraft,
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'AI email composition', res);
    }
  }

  /**
   * Sends AI composed email
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async sendAIEmail(req, res) {
    try {
      const { to, subject, body, attachments = [] } = req.body;

      logger.info('Sending AI composed email', {
        to,
        subject: `${subject?.substring(0, 50)}...`,
      });

      // Send email using email service
      const result = await EmailContentService.sendEmail({
        to,
        subject,
        body,
        attachments,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'AI email sending', res);
    }
  }

  /**
   * Searches for email contacts based on query
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async searchContacts(req, res) {
    try {
      const { query } = req.params;

      logger.info('Searching email contacts', { query });

      // Search contacts using email service
      const contacts = await EmailContentService.searchContacts(query);

      res.json({
        success: true,
        data: contacts,
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'contact search', res);
    }
  }
}

export default EmailController;
