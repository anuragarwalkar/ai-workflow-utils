/* eslint-disable max-params */
import { BaseLangChainService } from './BaseLangChainService.ts';
import { HumanMessage } from '@langchain/core/messages';
import logger from '../../logger.ts';
import PRStreamingHandler from './services/pr-streaming-handler.ts';
import PRContentParser from './services/pr-content-parser.ts';

/**
 * Pull Request-specific LangChain service for handling PR generation
 */
export class PRLangChainService extends BaseLangChainService {
  /**
   * Generate template-based content specifically for PR creation
   */
  async generateTemplateBasedContent(
    promptTemplateFormatter: Record<string, any>,
    templateIdentifier: string,
    streaming = false
  ): Promise<any> {
    if (this.providers.length === 0) {
      throw new Error('No AI providers are configured');
    }

    logger.info(
      `PR LangChain generateTemplateBasedContent called with template: ${templateIdentifier}`
    );

    const promptTemplate = await this.createPromptTemplate(templateIdentifier, false);
    const formattedPrompt = await promptTemplate.format({
      ...promptTemplateFormatter,
    });

    return this.tryProvidersForContent(formattedPrompt, streaming);
  }

  /**
   * Try providers for content generation
   */
  async tryProvidersForContent(formattedPrompt: string, streaming: boolean): Promise<any> {
    for (const provider of this.providers) {
      try {
        logger.info(`Trying provider for PR template-based output: ${provider.name}`);

        const message = new HumanMessage({ content: formattedPrompt });

        if (streaming) {
          const stream = await provider.model.stream([message]);
          return { content: stream, provider: provider.name };
        } else {
          const response = await provider.model.invoke([message]);
          logger.info(`Successfully generated PR template-based content using ${provider.name}`);

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
      } catch (error: any) {
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
  async streamPRContent(
    promptTemplateFormatter: Record<string, any>,
    templateIdentifier: string,
    res: any,
    images: string[] = []
  ): Promise<any> {
    if (this.providers.length === 0) {
      throw new Error('No AI providers are configured');
    }

    const hasImages = Boolean(images && Array.isArray(images) && images.length > 0);
    logger.info(
      `PR LangChain streamPRContent called with template: ${templateIdentifier} (hasImages: ${hasImages}, count: ${images?.length || 0})`
    );

    const promptTemplate = await this.createPromptTemplate(templateIdentifier, hasImages);

    let formattedPrompt = await promptTemplate.format({
      ...promptTemplateFormatter,
    });

    if (hasImages) {
      formattedPrompt += `\n\n**Visual Context & Attached Screenshots:**\nOne or more screenshots of the application / UI changes have been attached. Carefully analyze the visual elements, UI components, layout updates, and user flow shown in the screenshots in conjunction with the commit messages.\n\nIn the PR DESCRIPTION:\n- Provide a comprehensive summary combining both the code changes and the visual UI/UX updates.\n- If visual/UI changes are present, include a '## Visual Changes / UI Updates' or '## UI Changes' section in the description detailing the visual modifications.\n- Highlight the visual impact and behavior changes observed in the screenshots.`;
    }

    return this.tryProvidersForStreaming(formattedPrompt, res, images);
  }

  async tryProvidersForStreaming(formattedPrompt: string, res: any, images: string[] = []): Promise<any> {
    return PRStreamingHandler.tryProvidersForStreaming(this.providers, formattedPrompt, res, images);
  }

  async streamWithProvider(provider: any, formattedPrompt: string, res: any, images: string[] = []): Promise<any> {
    return PRStreamingHandler.streamWithProvider(provider, formattedPrompt, res, images);
  }

  handleStreamChunk(
    fullContent: string,
    currentTitle: string,
    currentDescription: string,
    res: any,
    chunkContent: string
  ): { parsedTitle: string; parsedDescription: string } {
    return PRStreamingHandler.handleStreamChunk(
      fullContent,
      currentTitle,
      currentDescription,
      res,
      chunkContent
    );
  }

  parseStreamingContent(content: string): { title: string; description: string } {
    return PRContentParser.parseStreamingContent(content);
  }

  parseStructuredContent(content: string): { title: string; description: string } {
    return PRContentParser.parseStructuredContent(content);
  }

  isTitleLine(line: string): boolean {
    return PRContentParser.isTitleLine(line);
  }

  isDescriptionLine(line: string): boolean {
    return PRContentParser.isDescriptionLine(line);
  }

  parseFallbackContent(content: string): { title: string; description: string } {
    return PRContentParser.parseFallbackContent(content);
  }

  sendFinalResults(
    res: any,
    title: string,
    description: string,
    aiGenerated: boolean,
    ticketNumber?: string,
    branchName?: string
  ): void {
    return PRStreamingHandler.sendFinalResults(
      res,
      title,
      description,
      aiGenerated,
      ticketNumber,
      branchName
    );
  }

  async generatePRDescription(
    commitMessages: string,
    templateIdentifier = 'PR_DESCRIPTION'
  ): Promise<{ content: string; provider: string }> {
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
    } catch (error: any) {
      logger.error(`Error generating PR description: ${error.message}`);
      throw error;
    }
  }

  async generatePRTitle(
    commitMessages: string,
    templateIdentifier = 'PR_TITLE'
  ): Promise<{ content: string; provider: string }> {
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
    } catch (error: any) {
      logger.error(`Error generating PR title: ${error.message}`);
      throw error;
    }
  }

  async generateCombinedPRContent(
    commitMessages: string,
    templateIdentifier = 'PR_COMBINED'
  ): Promise<{ content: string; provider: string }> {
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
    } catch (error: any) {
      logger.error(`Error generating combined PR content: ${error.message}`);
      throw error;
    }
  }

  extractTitleAndDescriptionFromContent(content: string): { title: string; description: string } {
    return PRContentParser.extractTitleAndDescriptionFromContent(content);
  }
}

export default new PRLangChainService();
