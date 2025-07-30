import logger from "../../../logger.js";
import { SSE_HEADERS } from "../utils/constants.js";
import { prLangChainService } from "../../../services/langchain/index.js";

/**
 * Service for handling PR-specific streaming with content parsing
 */
class PRStreamingService {
  /**
   * Set up Server-Sent Events headers
   */
  static setupSSE(res) {
    res.writeHead(200, SSE_HEADERS);
  }

  /**
   * Send data through SSE
   */
  static sendSSEData(res, data) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  /**
   * Send status update
   */
  static sendStatus(res, message, provider = null) {
    this.sendSSEData(res, {
      type: "status",
      message: message,
      ...(provider && { provider })
    });
  }

  /**
   * Send error and close connection
   */
  static sendError(res, error) {
    logger.error("PR Streaming error:", error);
    this.sendSSEData(res, {
      type: "error",
      message: error.message,
    });
    res.end();
  }

  /**
   * Close SSE connection
   */
  static closeSSE(res) {
    res.end();
  }

  /**
   * Stream PR content generation with real-time title/description parsing
   */
  static async streamPRContent(promptTemplateFormatter, templateIdentifier, res) {
    try {
      const streamResult = await this.processStreamingProviders(promptTemplateFormatter, templateIdentifier, res);
      return streamResult;
    } catch (error) {
      logger.error(`Error in PR streaming: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process streaming with providers
   */
  static async processStreamingProviders(promptTemplateFormatter, templateIdentifier, res) {
    const promptTemplate = await prLangChainService.createPromptTemplate(templateIdentifier, false);
    const formattedPrompt = await promptTemplate.format({ ...promptTemplateFormatter });
    
    if (prLangChainService.providers.length === 0) {
      throw new Error("No AI providers are configured");
    }

    // Try each provider in order of priority
    for (const provider of prLangChainService.providers) {
      try {
        const result = await this.streamWithProvider(provider, formattedPrompt, res);
        return result;
      } catch (error) {
        logger.warn(`Provider ${provider.name} failed for PR streaming: ${error.message}`);

        if (provider === prLangChainService.providers[prLangChainService.providers.length - 1]) {
          throw new Error(`All providers failed for PR streaming. Last error from ${provider.name}: ${error.message}`);
        }
        continue;
      }
    }
  }

  /**
   * Stream with a specific provider
   */
  static async streamWithProvider(provider, formattedPrompt, res) {
    logger.info(`Trying provider for PR streaming: ${provider.name}`);
    
    this.sendStatus(res, `Generating with ${provider.name}...`, provider.name);
    
    const message = { content: formattedPrompt };
    const stream = await provider.model.stream([message]);

    let fullContent = "";
    let parsedTitle = "";
    let parsedDescription = "";

    // Process the stream
    for await (const chunk of stream) {
      if (chunk.content) {
        fullContent += chunk.content;
        
        // Parse and send updates
        const parseResult = this.handleStreamChunk(fullContent, parsedTitle, parsedDescription, res);
        parsedTitle = parseResult.parsedTitle;
        parsedDescription = parseResult.parsedDescription;

        // Send general content chunk
        this.sendSSEData(res, {
          type: "content_chunk",
          data: chunk.content
        });
      }
    }

    logger.info(`Successfully streamed PR content using ${provider.name}`);
    return { 
      content: fullContent, 
      provider: provider.name,
      parsedTitle: parsedTitle,
      parsedDescription: parsedDescription
    };
  }

  /**
   * Handle individual stream chunks and parse content
   */
  static handleStreamChunk(fullContent, currentTitle, currentDescription, res) {
    const parsed = this.parseStreamingContent(fullContent);
    
    // Send title chunks if found
    if (parsed.title && parsed.title !== currentTitle) {
      const titleChunk = parsed.title.slice(currentTitle.length);
      if (titleChunk) {
        this.sendSSEData(res, {
          type: "title_chunk",
          data: titleChunk
        });
      }
    }

    // Send description chunks if found
    if (parsed.description && parsed.description !== currentDescription) {
      const descriptionChunk = parsed.description.slice(currentDescription.length);
      if (descriptionChunk) {
        this.sendSSEData(res, {
          type: "description_chunk", 
          data: descriptionChunk
        });
      }
    }

    return {
      parsedTitle: parsed.title,
      parsedDescription: parsed.description
    };
  }

  /**
   * Parse streaming content to extract title and description in real-time
   */
  static parseStreamingContent(content) {
    // Try structured parsing first
    const structuredResult = this.parseStructuredContent(content);
    if (structuredResult.title || structuredResult.description) {
      return structuredResult;
    }

    // Fallback to simple parsing
    return this.parseFallbackContent(content);
  }

  /**
   * Parse structured content with markers
   */
  static parseStructuredContent(content) {
    const lines = content.split('\n');
    let title = "";
    let description = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for title markers
      if (!title && this.isTitleLine(line)) {
        title = line.replace(/^.*title:\s*/i, '').trim();
        continue;
      }

      // Look for description markers
      if (title && this.isDescriptionLine(line)) {
        const remainingLines = lines.slice(i + 1);
        description = remainingLines.join('\n').trim();
        break;
      }
    }

    return { title, description };
  }

  /**
   * Check if line contains title marker
   */
  static isTitleLine(line) {
    return line.toLowerCase().includes('title:') || 
           line.toLowerCase().includes('pr title:') ||
           line.toLowerCase().includes('pull request title:');
  }

  /**
   * Check if line contains description marker
   */
  static isDescriptionLine(line) {
    return line.toLowerCase().includes('description:') || 
           line.toLowerCase().includes('pr description:') ||
           line.toLowerCase().includes('pull request description:');
  }

  /**
   * Fallback parsing when no structured markers found
   */
  static parseFallbackContent(content) {
    if (content.length < 50) {
      return { title: content.trim(), description: "" };
    }

    const sections = content.split('\n\n');
    if (sections.length >= 2) {
      return {
        title: sections[0].trim(),
        description: sections.slice(1).join('\n\n').trim()
      };
    }

    // Single section - treat first line as title, rest as description
    const firstLineEnd = content.indexOf('\n');
    if (firstLineEnd > 0) {
      return {
        title: content.substring(0, firstLineEnd).trim(),
        description: content.substring(firstLineEnd + 1).trim()
      };
    }

    return { title: content.trim(), description: "" };
  }

  /**
   * Send final parsed results
   */
  static sendFinalResults(res, title, description, aiGenerated, ticketNumber, branchName) {
    // Send complete title
    this.sendSSEData(res, {
      type: "title_complete",
      data: title
    });

    // Send complete description  
    this.sendSSEData(res, {
      type: "description_complete",
      data: description
    });

    // Send completion event
    this.sendSSEData(res, {
      type: "complete",
      data: {
        prTitle: title,
        prDescription: description,
        aiGenerated,
        ticketNumber,
        branchName
      }
    });
  }
}

export default PRStreamingService;
