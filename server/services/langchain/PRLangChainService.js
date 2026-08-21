/* eslint-disable max-params */
import { BaseLangChainService } from './BaseLangChainService.js';
import { HumanMessage } from '@langchain/core/messages';
import logger from '../../logger.js';
import PRStreamingHandler from './services/pr-streaming-handler.js';
import PRContentParser from './services/pr-content-parser.js';

/**
 * Pull Request-specific LangChain service for handling PR generation
 */
export class PRLangChainService extends BaseLangChainService {
  // eslint-disable-next-line no-useless-constructor
  constructor() {
    super();
  }

  /**
   * Generate template-based content specifically for PR creation
   */
  async generateTemplateBasedContent(
    promptTemplateFormatter,
    templateIdentifier,
    streaming = false
  ) {
    if (this.providers.length === 0) {
      throw new Error('No AI providers are configured');
    }

    logger.info(
      `PR LangChain generateTemplateBasedContent called with template: ${templateIdentifier}`
    );

    // Get the base template and format it
    const promptTemplate = await this.createPromptTemplate(templateIdentifier, false);
    const formattedPrompt = await promptTemplate.format({
      ...promptTemplateFormatter,
    });

    // Try each provider in order of priority
    return this.tryProvidersForContent(formattedPrompt, streaming);
  }

  /**
   * Try providers for content generation
   */
  async tryProvidersForContent(formattedPrompt, streaming) {
    for (const provider of this.providers) {
      try {
        logger.info(`Trying provider for PR template-based output: ${provider.name}`);

        const message = new HumanMessage({ content: formattedPrompt });

        if (streaming) {
          // For streaming, return the stream directly
          const stream = await provider.model.stream([message]);
          return { content: stream, provider: provider.name };
        } else {
          const response = await provider.model.invoke([message]);
          logger.info(`Successfully generated PR template-based content using ${provider.name}`);

          // Check if response is empty
          if (!response.content || response.content.trim() === '') {
            logger.warn(
              `Provider ${provider.name} returned empty content for template-based output`
            );
            continue;
          }

          return {
            content: response.content,
            provider: provider.name,
          };
        }
      } catch (error) {
        logger.warn(
          `Provider ${provider.name} failed for PR template-based output: ${error.message}`
        );

        if (provider === this.providers[this.providers.length - 1]) {
          throw new Error(
            `All providers failed for PR template-based output. Last error from ${provider.name}: ${error.message}`
          );
        }

        continue;
      }
    }
  }

  /**
   * Stream PR content generation with real-time updates and parsing
   */
  async streamPRContent(promptTemplateFormatter, templateIdentifier, res, images = []) {
    if (this.providers.length === 0) {
      throw new Error('No AI providers are configured');
    }

    const hasImages = Boolean(images && Array.isArray(images) && images.length > 0);
    logger.info(
      `PR LangChain streamPRContent called with template: ${templateIdentifier} (hasImages: ${hasImages}, count: ${images?.length || 0})`
    );

    // Get the base template and format it
    const promptTemplate = await this.createPromptTemplate(templateIdentifier, hasImages);

    let formattedPrompt = await promptTemplate.format({
      ...promptTemplateFormatter,
    });

    if (hasImages) {
      formattedPrompt += `\n\n**Visual Context & Attached Screenshots:**\nOne or more screenshots of the application / UI changes have been attached. Carefully analyze the visual elements, UI components, layout updates, and user flow shown in the screenshots in conjunction with the commit messages.\n\nIn the PR DESCRIPTION:\n- Provide a comprehensive summary combining both the code changes and the visual UI/UX updates.\n- If visual/UI changes are present, include a '## Visual Changes / UI Updates' or '## UI Changes' section in the description detailing the visual modifications.\n- Highlight the visual impact and behavior changes observed in the screenshots.`;
    }

    // Try each provider in order of priority
    return this.tryProvidersForStreaming(formattedPrompt, res, images);
  }

  /**
   * Try providers for streaming content generation
   */
  async tryProvidersForStreaming(formattedPrompt, res, images = []) {
    return PRStreamingHandler.tryProvidersForStreaming(this.providers, formattedPrompt, res, images);
  }

  /**
   * Stream with a specific provider
   */
  async streamWithProvider(provider, formattedPrompt, res, images = []) {
    return PRStreamingHandler.streamWithProvider(provider, formattedPrompt, res, images);
  }

  /**
   * Handle individual stream chunks and send updates
   */
  handleStreamChunk(fullContent, currentTitle, currentDescription, res, chunkContent) {
    return PRStreamingHandler.handleStreamChunk(
      fullContent,
      currentTitle,
      currentDescription,
      res,
      chunkContent
    );
  }

  /**
   * Parse streaming content to extract title and description in real-time
   */
  parseStreamingContent(content) {
    return PRContentParser.parseStreamingContent(content);
  }

  /**
   * Parse structured content with markers
   */
  parseStructuredContent(content) {
    return PRContentParser.parseStructuredContent(content);
  }

  /**
   * Check if line contains title marker
   */
  isTitleLine(line) {
    return PRContentParser.isTitleLine(line);
  }

  /**
   * Check if line contains description marker
   */
  isDescriptionLine(line) {
    return PRContentParser.isDescriptionLine(line);
  }

  /**
   * Fallback parsing when no structured markers found
   */
  parseFallbackContent(content) {
    return PRContentParser.parseFallbackContent(content);
  }

  /**
   * Send final parsed results via SSE
   */
  sendFinalResults(res, title, description, aiGenerated, ticketNumber, branchName) {
    return PRStreamingHandler.sendFinalResults(
      res,
      title,
      description,
      aiGenerated,
      ticketNumber,
      branchName
    );
  }

  /**
   * Generate PR description with commit messages using templates only
   */
  async generatePRDescription(commitMessages, templateIdentifier = 'PR_DESCRIPTION') {
    try {
      const result = await this.generateTemplateBasedContent(
        { commitMessages },
        templateIdentifier,
        false
      );

      return {
        content: result.content,
        provider: result.provider,
      };
    } catch (error) {
      logger.error(`Error generating PR description: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate PR title from commit messages using templates only
   */
  async generatePRTitle(commitMessages, templateIdentifier = 'PR_TITLE') {
    try {
      const result = await this.generateTemplateBasedContent(
        { commitMessages },
        templateIdentifier,
        false
      );

      return {
        content: result.content,
        provider: result.provider,
      };
    } catch (error) {
      logger.error(`Error generating PR title: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate combined PR content (title + description) using templates only
   */
  async generateCombinedPRContent(commitMessages, templateIdentifier = 'PR_COMBINED') {
    try {
      const result = await this.generateTemplateBasedContent(
        { commitMessages },
        templateIdentifier,
        false
      );

      return {
        content: result.content,
        provider: result.provider,
      };
    } catch (error) {
      logger.error(`Error generating combined PR content: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract title and description from template-generated content
   * @param {string} content - Generated content from template
   * @returns {Object} Object with title and description properties
   */
  extractTitleAndDescriptionFromContent(content) {
    return PRContentParser.extractTitleAndDescriptionFromContent(content);
  }
}

// Export singleton instance
export default new PRLangChainService();
