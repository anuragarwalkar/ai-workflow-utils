import { Request, Response } from 'express';
import { WikiService } from './services/wiki-service.js';
import { JiraIntegrationService } from './services/jira-integration-service.js';
import { EmailContentService } from './services/email-content-service.js';
import { EmailRequest } from './models/email-request.js';
import { ErrorHandler } from './utils/error-handler.js';
import logger from '../../logger.ts';
import { EnvironmentConfig } from '../jira/utils/environment-config.js';

class EmailController {
  static async sendEmail(req: Request, res: Response): Promise<void> {
    try {
      const emailRequest = new EmailRequest(req.query, req.body);
      EmailRequest.validate(emailRequest);

      logger.info('Processing email generation request', {
        version: emailRequest.version,
        wikiUrl: emailRequest.wikiUrl,
      });

      const wikiContent = await WikiService.fetchWikiContent(
        emailRequest.wikiUrl,
        emailRequest.wikiBasicAuth
      );

      const tableData = await WikiService.extractTableData(wikiContent, emailRequest.version);
      const enhancedTableData = await JiraIntegrationService.enhanceWithJiraSummaries(tableData);

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

  static async composeWithAI(req: Request, res: Response): Promise<void> {
    try {
      const { prompt, attachedImages = [] } = req.body;

      logger.info('Processing AI email composition request', {
        prompt: `${prompt?.substring(0, 100)}...`,
        imageCount: attachedImages.length,
      });

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

  static async sendAIEmail(req: Request, res: Response): Promise<void> {
    try {
      const { to, subject, body, attachments = [] } = req.body;

      logger.info('Sending AI composed email', {
        to,
        subject: `${subject?.substring(0, 50)}...`,
      });

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

  static async searchContacts(req: Request, res: Response): Promise<void> {
    try {
      const { query } = req.params;

      logger.info('Searching email contacts', { query });

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
