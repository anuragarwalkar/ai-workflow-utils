/* eslint-disable class-methods-use-this */
/* eslint-disable max-params */
import { BaseLangChainService } from './BaseLangChainService.ts';
import logger from '../../logger.ts';

/**
 * Jira-specific LangChain service for handling Jira issue generation
 */
export class JiraLangChainService extends BaseLangChainService {
  /**
   * Stream content generation specifically for Jira issues using templates with MCP support
   */
  async streamContent(
    promptTemplateFormatter: Record<string, any>,
    images: any,
    issueType: string,
    res: any,
    options: { useMCPAgent?: boolean; preferredProvider?: string | null } = {}
  ): Promise<void> {
    let fullContent = '';

    res.write(
      `data: ${JSON.stringify({
        type: 'status',
        message: 'Starting content generation...',
        provider: 'Initializing',
      })}\n\n`
    );

    try {
      const result = await this.generateTemplateBasedContent(promptTemplateFormatter, images, issueType, {
        useMCPAgent: options.useMCPAgent || false,
        preferredProvider: options.preferredProvider || null,
      });

      const providerDisplay = result.usedMCP ? `${result.provider} (with MCP tools)` : result.provider;

      res.write(
        `data: ${JSON.stringify({
          type: 'status',
          message: `Using ${providerDisplay}...`,
          provider: result.provider,
          usedMCP: result.usedMCP,
        })}\n\n`
      );

      const content = typeof result.content === 'string' ? result.content : Array.isArray(result.content) ? result.content.map((c: any) => (typeof c === 'string' ? c : c?.text ?? '')).join('') : String(result.content ?? '');
      if (content) {
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
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      res.write(
        `data: ${JSON.stringify({
          type: 'complete',
          message: `${issueType} preview generated successfully`,
          bugReport: fullContent || content,
          summary: this.extractSummaryFromContent(fullContent || content),
          description: fullContent || content,
          provider: result.provider,
          usedMCP: result.usedMCP,
        })}\n\n`
      );

      logger.info(`Successfully streamed template-based Jira content using ${providerDisplay}`);
    } catch (error: any) {
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
  async generateTemplateBasedContent(
    promptTemplateFormatter: Record<string, any>,
    images: any,
    issueType: string,
    options: { useMCPAgent?: boolean; preferredProvider?: string | null } = {}
  ): Promise<{ content: string; provider: string; usedMCP: boolean }> {
    const result = await this.generateContent({
      promptTemplateFormatter,
      images,
      promptTemplateIdentifier: issueType,
      streaming: false,
      useMCPAgent: options.useMCPAgent || false,
      preferredProvider: options.preferredProvider || null,
    });

    const rawContent = result.content;
    const normalizedContent = typeof rawContent === 'string'
      ? rawContent
      : Array.isArray(rawContent)
        ? rawContent.map((c: any) => (typeof c === 'string' ? c : c?.text ?? '')).join('')
        : String(rawContent ?? '');

    return {
      content: normalizedContent,
      provider: result.provider,
      usedMCP: result.usedMCP || false,
    };
  }

  /**
   * Extract a simple summary from content (first line or first sentence)
   */
  extractSummaryFromContent(content?: string): string {
    if (!content || content.trim() === '') {
      return 'Generated Jira Issue';
    }

    const lines = content.split('\n').filter(line => line.trim() !== '');
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length > 0 && firstLine.length <= 100) {
        return firstLine;
      }
    }

    const sentences = content.split(/[.!?]/);
    if (sentences.length > 0 && sentences[0].trim().length > 0) {
      const firstSentence = sentences[0].trim();
      if (firstSentence.length <= 100) {
        return firstSentence;
      }
      return `${firstSentence.substring(0, 97)}...`;
    }

    return `${content.substring(0, 50)}...`;
  }

  /**
   * Enhanced generation with retry logic using base class functionality with MCP support
   */
  async generateContentWithRetry(
    promptTemplateFormatter: Record<string, any>,
    images: any,
    issueType: string,
    options: { useMCPAgent?: boolean; preferredProvider?: string | null } = {}
  ): Promise<{ content: string; provider: string; usedMCP: boolean }> {
    try {
      return await this.generateTemplateBasedContent(promptTemplateFormatter, images, issueType, options);
    } catch (error: any) {
      logger.error(`Error generating template-based content: ${error.message}`);
      throw error;
    }
  }
}

export default new JiraLangChainService();
