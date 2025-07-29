/**
 * Jira content service for AI-powered content generation
 */

import { jiraLangChainService } from "../../../services/langchain/index.js";
import { ValidationUtils } from "../utils/validation-utils.js";
import { ErrorHandler } from "../utils/error-handler.js";
import { SSE_HEADERS, ISSUE_TYPE_MAPPING } from "../utils/constants.js";
import logger from "../../../logger.js";

export class JiraContentService {
  /**
   * Generate AI-powered issue preview with streaming
   * @param {Object} data - Preview request data
   * @param {Array} images - Image data array
   * @param {Object} res - Express response object for streaming
   */
  static async streamPreviewContent(data, images, res) {
    try {
      // Validate input data
      const validation = ValidationUtils.validatePreviewData(data);
      if (!validation.isValid) {
        throw ErrorHandler.createValidationError(validation.errors.join(', '));
      }

      const { prompt, issueType = 'Task' } = data;
      
      // Get template type for AI service
      const templateType = ISSUE_TYPE_MAPPING[issueType] || ISSUE_TYPE_MAPPING.Task;

      logger.info('Generating AI preview for Jira issue', {
        issueType,
        templateType,
        hasImages: images && images.length > 0,
        promptLength: prompt.length
      });

      // Set up Server-Sent Events headers
      res.writeHead(200, SSE_HEADERS);

      // Use the specialized Jira LangChain service for streaming
      await jiraLangChainService.streamContent(
        { prompt }, 
        images || [], 
        templateType, 
        res
      );

      logger.info('AI preview generation completed', { issueType, templateType });

    } catch (error) {
      logger.error('Error generating AI preview', {
        error: error.message,
        issueType: data?.issueType,
        stack: error.stack
      });

      // Handle streaming error
      ErrorHandler.handleStreamingError(
        error, 
        `Failed to generate ${data?.issueType || 'issue'} preview`, 
        res
      );
    }
  }

  /**
   * Generate issue content without streaming (for internal use)
   * @param {Object} data - Content generation data
   * @param {Array} images - Image data array
   * @returns {Promise<string>} Generated content
   */
  static async generateContent(data, images = []) {
    try {
      const validation = ValidationUtils.validatePreviewData(data);
      if (!validation.isValid) {
        throw ErrorHandler.createValidationError(validation.errors.join(', '));
      }

      const { prompt, issueType = 'Task' } = data;
      const templateType = ISSUE_TYPE_MAPPING[issueType] || ISSUE_TYPE_MAPPING.Task;

      logger.info('Generating AI content for Jira issue', {
        issueType,
        templateType,
        hasImages: images.length > 0
      });

      // Generate content using LangChain service
      const content = await jiraLangChainService.generateContent(
        { prompt },
        images,
        templateType
      );

      logger.info('AI content generation completed', { 
        issueType, 
        contentLength: content?.length || 0 
      });

      return content;
    } catch (error) {
      logger.error('Error generating AI content', {
        error: error.message,
        issueType: data?.issueType
      });
      throw ErrorHandler.createServiceError(
        `Failed to generate content: ${error.message}`
      );
    }
  }

  /**
   * Enhance issue description with AI
   * @param {string} description - Original description
   * @param {string} issueType - Issue type
   * @returns {Promise<string>} Enhanced description
   */
  static async enhanceDescription(description, issueType = 'Task') {
    try {
      if (!description || typeof description !== 'string') {
        throw ErrorHandler.createValidationError('Description is required');
      }

      const enhancementPrompt = `Please enhance and improve the following ${issueType.toLowerCase()} description while maintaining its core meaning and requirements:\n\n${description}`;
      
      const enhancedContent = await this.generateContent({
        prompt: enhancementPrompt,
        issueType
      });

      logger.info('Description enhanced successfully', {
        originalLength: description.length,
        enhancedLength: enhancedContent?.length || 0,
        issueType
      });

      return enhancedContent || description; // Fallback to original if enhancement fails
    } catch (error) {
      logger.error('Error enhancing description', {
        error: error.message,
        issueType
      });
      // Return original description on error
      return description;
    }
  }

  /**
   * Generate issue summary from description
   * @param {string} description - Issue description
   * @param {string} issueType - Issue type
   * @returns {Promise<string>} Generated summary
   */
  static async generateSummary(description, issueType = 'Task') {
    try {
      if (!description || typeof description !== 'string') {
        throw ErrorHandler.createValidationError('Description is required');
      }

      const summaryPrompt = `Generate a concise, clear summary (max 100 characters) for this ${issueType.toLowerCase()}:\n\n${description}`;
      
      const summary = await this.generateContent({
        prompt: summaryPrompt,
        issueType
      });

      // Ensure summary is not too long
      const cleanSummary = summary?.trim().substring(0, 100) || `${issueType} - Auto-generated`;

      logger.info('Summary generated successfully', {
        summaryLength: cleanSummary.length,
        issueType
      });

      return cleanSummary;
    } catch (error) {
      logger.error('Error generating summary', {
        error: error.message,
        issueType
      });
      // Return fallback summary
      return `${issueType} - Auto-generated`;
    }
  }

  /**
   * Generate acceptance criteria for stories
   * @param {string} description - Story description
   * @returns {Promise<string>} Generated acceptance criteria
   */
  static async generateAcceptanceCriteria(description) {
    try {
      if (!description || typeof description !== 'string') {
        throw ErrorHandler.createValidationError('Description is required');
      }

      const criteriaPrompt = `Generate clear, testable acceptance criteria for this user story:\n\n${description}`;
      
      const criteria = await this.generateContent({
        prompt: criteriaPrompt,
        issueType: 'Story'
      });

      logger.info('Acceptance criteria generated successfully', {
        criteriaLength: criteria?.length || 0
      });

      return criteria || 'Acceptance criteria to be defined';
    } catch (error) {
      logger.error('Error generating acceptance criteria', {
        error: error.message
      });
      return 'Acceptance criteria to be defined';
    }
  }

  /**
   * Get available issue types for AI generation
   * @returns {Object} Available issue types with descriptions
   */
  static getAvailableIssueTypes() {
    return {
      Bug: {
        description: 'A problem or defect in the software',
        templateType: ISSUE_TYPE_MAPPING.Bug,
        aiCapabilities: ['Bug report generation', 'Steps to reproduce', 'Expected vs actual behavior']
      },
      Task: {
        description: 'A unit of work to be completed',
        templateType: ISSUE_TYPE_MAPPING.Task,
        aiCapabilities: ['Task breakdown', 'Implementation details', 'Checklist generation']
      },
      Story: {
        description: 'A user story representing a feature or requirement',
        templateType: ISSUE_TYPE_MAPPING.Story,
        aiCapabilities: ['User story formatting', 'Acceptance criteria', 'Use case scenarios']
      }
    };
  }
}
