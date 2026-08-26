/* eslint-disable max-params, max-statements */
import logger from '../../../logger.ts';
import StreamingService from '../../../controllers/pull-request/services/streaming-service.js';
import PRContentParser from './pr-content-parser.ts';

/**
 * Service for handling PR streaming operations
 */
class PRStreamingHandler {
  /**
   * Helper to format image array into LangChain multimodal message format
   */
  static prepareImageContent(images: string[]): any[] {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return [];
    }

    return images
      .filter(img => img && typeof img === 'string')
      .map(img => {
        let base64Data = img;
        let mediaType = 'image/png';

        if (img.startsWith('data:')) {
          const [header, data] = img.split(',');
          base64Data = data;
          const mediaTypeMatch = header.match(/data:([^;]+)/);
          if (mediaTypeMatch) {
            [, mediaType] = mediaTypeMatch;
          }
        } else if (img.startsWith('/9j/')) {
          mediaType = 'image/jpeg';
        } else if (img.startsWith('iVBORw0KGgo')) {
          mediaType = 'image/png';
        }

        return {
          type: 'image_url',
          image_url: {
            url: `data:${mediaType};base64,${base64Data}`,
          },
        };
      });
  }

  /**
   * Stream with a specific provider
   */
  static async streamWithProvider(
    provider: any,
    formattedPrompt: string,
    res: any,
    images: string[] = []
  ): Promise<any> {
    logger.info(`Trying provider for PR streaming: ${provider.name}`);

    const { HumanMessage } = await import('@langchain/core/messages');
    const { StringOutputParser } = await import('@langchain/core/output_parsers');

    try {
      const hasImages = Boolean(images && Array.isArray(images) && images.length > 0);
      let message: any;

      if (hasImages && provider.supportsVision) {
        const imageContent = this.prepareImageContent(images);
        message = new HumanMessage({
          content: [{ type: 'text', text: formattedPrompt }, ...imageContent],
        });
      } else {
        let promptText = formattedPrompt;
        if (hasImages && !provider.supportsVision) {
          promptText += ' (Note: Screenshots were provided, but the active AI model does not support vision input.)';
        }
        message = new HumanMessage({ content: promptText });
      }

      if (res) {
        StreamingService.sendStatus(res, `Generating with ${provider.name}...`);
      }

      let fullContent = '';
      let parsedTitle = '';
      let parsedDescription = '';
      let chunkCount = 0;

      const outputParser = new StringOutputParser();
      const stream = await provider.model.pipe(outputParser).stream([message]);

      for await (const chunk of stream) {
        chunkCount++;
        const content = String(chunk || '');
        if (content && content.trim() !== '') {
          fullContent += content;
          ({ parsedTitle, parsedDescription } = this.handleStreamChunk(
            fullContent,
            parsedTitle,
            parsedDescription,
            res,
            content
          ));
        }
      }

      logger.info(
        `Successfully streamed PR content using ${provider.name}. Received ${chunkCount} chunks, total content length: ${fullContent.length}`
      );

      if (!fullContent || fullContent.trim() === '') {
        throw new Error(
          `Provider ${provider.name} returned empty content after streaming (${chunkCount} chunks received)`
        );
      }

      return {
        content: fullContent,
        provider: provider.name,
        parsedTitle,
        parsedDescription,
      };
    } catch (error: any) {
      logger.error(`Streaming failed with ${provider.name}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle individual stream chunks and send updates
   */
  static handleStreamChunk(
    fullContent: string,
    currentTitle: string,
    currentDescription: string,
    res: any,
    chunkContent: string
  ): { parsedTitle: string; parsedDescription: string } {
    const parsed = PRContentParser.parseStreamingContent(fullContent);

    if (res) {
      const { title, description } = parsed;
      if (title && title !== currentTitle) {
        const titleChunk = title.slice(currentTitle.length);
        if (titleChunk) {
          StreamingService.sendTitleChunk(res, titleChunk);
        }
      }

      if (description && description !== currentDescription) {
        const descriptionChunk = description.slice(currentDescription.length);
        if (descriptionChunk) {
          StreamingService.sendDescriptionChunk(res, descriptionChunk);
        }
      }

      StreamingService.sendChunk(res, chunkContent);
    }

    return {
      parsedTitle: parsed.title,
      parsedDescription: parsed.description,
    };
  }

  /**
   * Try providers for streaming content generation
   */
  static async tryProvidersForStreaming(
    providers: any[],
    formattedPrompt: string,
    res: any,
    images: string[] = []
  ): Promise<any> {
    for (const provider of providers) {
      try {
        const result = await this.streamWithProvider(provider, formattedPrompt, res, images);
        return result;
      } catch (error: any) {
        logger.warn(`Provider ${provider.name} failed for PR streaming: ${error.message}`);

        if (provider === providers[providers.length - 1]) {
          throw new Error(
            `All providers failed for PR streaming. Last error from ${provider.name}: ${error.message}`
          );
        }
        continue;
      }
    }
  }

  /**
   * Send final parsed results via SSE
   */
  static sendFinalResults(
    res: any,
    title: string,
    description: string,
    aiGenerated: boolean,
    ticketNumber?: string,
    branchName?: string
  ): void {
    if (res) {
      StreamingService.sendTitleComplete(res, title);
      StreamingService.sendDescriptionComplete(res, description);
      StreamingService.sendComplete(res, {
        prTitle: title,
        prDescription: description,
        aiGenerated,
        ticketNumber,
        branchName,
      });
    }
  }
}

export default PRStreamingHandler;
