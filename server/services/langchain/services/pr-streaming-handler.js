import logger from '../../../logger.js';
import StreamingService from '../../../controllers/pull-request/services/streaming-service.js';
import PRContentParser from './pr-content-parser.js';

/**
 * Service for handling PR streaming operations
 */
class PRStreamingHandler {
  /**
   * Stream with a specific provider
   */
  static async streamWithProvider(provider, formattedPrompt, res) {
    logger.info(`Trying provider for PR streaming: ${provider.name}`);

    // Use the same approach as ChatLangChainService - create a chain first
    const { ChatPromptTemplate } = await import('@langchain/core/prompts');
    const { StringOutputParser } = await import('@langchain/core/output_parsers');

    try {
      // Create a simple chain like the working services
      const prompt = ChatPromptTemplate.fromMessages([
        ['human', '{input}'],
      ]);
      
      const outputParser = new StringOutputParser();
      const chain = prompt.pipe(provider.model).pipe(outputParser);

      // Send status update using StreamingService (only if res is provided)
      if (res) {
        StreamingService.sendStatus(res, `Generating with ${provider.name}...`);
      }

      let fullContent = '';
      let parsedTitle = '';
      let parsedDescription = '';
      let chunkCount = 0;

      // Use chain.stream like the working services
      const stream = await chain.stream({
        input: formattedPrompt,
      });

      for await (const chunk of stream) {
        chunkCount++;

        // Convert chunk to string and validate
        const content = String(chunk || '');
        if (content && content.trim() !== '') {
          fullContent += content;
          // Handle parsing and chunk sending
          const parseResult = this.handleStreamChunk(
            fullContent,
            parsedTitle,
            parsedDescription,
            res,
            content,
          );
          parsedTitle = parseResult.parsedTitle;
          parsedDescription = parseResult.parsedDescription;
        }
      }

      logger.info(
        `Successfully streamed PR content using ${provider.name}. Received ${chunkCount} chunks, total content length: ${fullContent.length}`,
      );

      // Validate that content was actually generated
      if (!fullContent || fullContent.trim() === '') {
        throw new Error(
          `Provider ${provider.name} returned empty content after streaming (${chunkCount} chunks received)`,
        );
      }

      return {
        content: fullContent,
        provider: provider.name,
        parsedTitle,
        parsedDescription,
      };
    } catch (error) {
      logger.error(`Chain streaming failed with ${provider.name}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle individual stream chunks and send updates
   */
  static handleStreamChunk(
    fullContent,
    currentTitle,
    currentDescription,
    res,
    chunkContent,
  ) {
    // Parse content in real-time to extract title and description
    const parsed = PRContentParser.parseStreamingContent(fullContent);

    // Only send streaming updates if res is provided
    if (res) {
      // Send title chunks if found
      if (parsed.title && parsed.title !== currentTitle) {
        const titleChunk = parsed.title.slice(currentTitle.length);
        if (titleChunk) {
          StreamingService.sendTitleChunk(res, titleChunk);
        }
      }

      // Send description chunks if found
      if (parsed.description && parsed.description !== currentDescription) {
        const descriptionChunk = parsed.description.slice(
          currentDescription.length,
        );
        if (descriptionChunk) {
          StreamingService.sendDescriptionChunk(res, descriptionChunk);
        }
      }

      // Send standardized content chunk
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
  static async tryProvidersForStreaming(providers, formattedPrompt, res) {
    for (const provider of providers) {
      try {
        const result = await this.streamWithProvider(
          provider,
          formattedPrompt,
          res,
        );
        return result;
      } catch (error) {
        logger.warn(
          `Provider ${provider.name} failed for PR streaming: ${error.message}`,
        );

        if (provider === providers[providers.length - 1]) {
          throw new Error(
            `All providers failed for PR streaming. Last error from ${provider.name}: ${error.message}`,
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
    res,
    title,
    description,
    aiGenerated,
    ticketNumber,
    branchName,
  ) {
    // Only send streaming updates if res is provided
    if (res) {
      // Send complete title
      StreamingService.sendTitleComplete(res, title);

      // Send complete description
      StreamingService.sendDescriptionComplete(res, description);

      // Send completion event
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
