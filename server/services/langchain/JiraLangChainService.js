/* eslint-disable class-methods-use-this */
/* eslint-disable max-params */
import { BaseLangChainService } from './BaseLangChainService.js';
import logger from '../../logger.js';

/**
 * Jira-specific LangChain service for handling Jira issue generation
 */
export class JiraLangChainService extends BaseLangChainService {
  // eslint-disable-next-line no-useless-constructor
  constructor() {
    super();
  }

  /**
   * Stream content generation specifically for Jira issues using templates with MCP support
   */
  async streamContent(promptTemplateFormatter, images, issueType, res, options = {}) {
    let fullContent = '';

    res.write(
      `data: ${JSON.stringify({
        type: 'status',
        message: 'Starting content generation...',
        provider: 'Initializing',
      })}\n\n`
    );

    try {
      // Use enhanced template-based content generation with MCP support
      const result = await this.generateTemplateBasedContent(
        promptTemplateFormatter,
        images,
        issueType,
        {
          useMCPAgent: options.useMCPAgent || false,
          preferredProvider: options.preferredProvider || null
        }
      );

      const providerDisplay = result.usedMCP ? `${result.provider} (with MCP tools)` : result.provider;

      res.write(
        `data: ${JSON.stringify({
          type: 'status',
          message: `Using ${providerDisplay}...`,
          provider: result.provider,
          usedMCP: result.usedMCP,
        })}\n\n`
      );

      // Stream the content naturally from the template
      const { content } = result;
      if (content) {
        // Simulate streaming by sending chunks
        const words = content.split(' ');
        for (let i = 0; i < words.length; i += 5) {
          const chunk = `${words.slice(i, i + 5).join(' ')} `;
          fullContent += chunk;
          res.write(
            `data: ${JSON.stringify({
              type: 'chunk',
              content: chunk,
            })}\n\n`
          );
          // Small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      res.write(
        `data: ${JSON.stringify({
          type: 'complete',
          message: `${issueType} preview generated successfully`,
          bugReport: fullContent || result.content,
          summary: this.extractSummaryFromContent(fullContent || result.content),
          description: fullContent || result.content,
          provider: result.provider,
          usedMCP: result.usedMCP,
        })}\n\n`
      );

      logger.info(`Successfully streamed template-based Jira content using ${providerDisplay}`);
    } catch (error) {
      logger.error(`Error in Jira template-based streaming: ${error.message}`);
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          error: `Failed to generate ${issueType} preview`,
          details: error.message,
        })}\n\n`
      );
    }
  }

  /**
   * Generate template-based content for Jira issues using base class functionality
   */
  async generateTemplateBasedContent(promptTemplateFormatter, images, issueType, options = {}) {
    // Use the enhanced generateContent from base class that supports MCP agents
    const result = await this.generateContent({
      promptTemplateFormatter,
      images,
      promptTemplateIdentifier: issueType,
      streaming: false,
      useMCPAgent: options.useMCPAgent || false,
      preferredProvider: options.preferredProvider || null
    });

    return {
      content: result.content,
      provider: result.provider,
      usedMCP: result.usedMCP || false
    };
  }

  /**
   * Extract a simple summary from content (first line or first sentence)
   */
  extractSummaryFromContent(content) {
    if (!content || content.trim() === '') {
      return 'Generated Jira Issue';
    }

    // Try to extract first meaningful line
    const lines = content.split('\n').filter(line => line.trim() !== '');
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      // If first line looks like a title/summary (not too long), use it
      if (firstLine.length > 0 && firstLine.length <= 100) {
        return firstLine;
      }
    }

    // Otherwise, try to get first sentence
    const sentences = content.split(/[.!?]/);
    if (sentences.length > 0 && sentences[0].trim().length > 0) {
      const firstSentence = sentences[0].trim();
      if (firstSentence.length <= 100) {
        return firstSentence;
      }
      // If too long, truncate
      return `${firstSentence.substring(0, 97)}...`;
    }

    // Final fallback
    return `${content.substring(0, 50)}...`;
  }

  /**
   * Enhanced generation with retry logic using base class functionality with MCP support
   * @param {Object} promptTemplateFormatter - Template variables
   * @param {Array} images - Image data array
   * @param {string} issueType - Type of Jira issue
   * @param {Object} options - Generation options (useMCPAgent, preferredProvider)
   * @returns {Promise<Object>} Generated content result
   */
  async generateContentWithRetry(promptTemplateFormatter, images, issueType, options = {}) {
    try {
      return await this.generateTemplateBasedContent(
        promptTemplateFormatter,
        images,
        issueType,
        options
      );
    } catch (error) {
      logger.error(`Error generating template-based content: ${error.message}`);
      throw error;
    }
  }
}

// Export singleton instance
export default new JiraLangChainService();
