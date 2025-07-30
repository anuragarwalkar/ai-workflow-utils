import { BaseLangChainService } from './BaseLangChainService.js';
import { HumanMessage } from "@langchain/core/messages";
import logger from "../../logger.js";

/**
 * Pull Request-specific LangChain service for handling PR generation
 */
export class PRLangChainService extends BaseLangChainService {
  constructor() {
    super();
  }

  /**
   * Generate template-based content specifically for PR creation
   */
  async generateTemplateBasedContent(promptTemplateFormatter, templateIdentifier, streaming = false) {
    if (this.providers.length === 0) {
      throw new Error("No AI providers are configured");
    }

    logger.info(`PR LangChain generateTemplateBasedContent called with template: ${templateIdentifier}`);

    // Get the base template and format it
    const promptTemplate = await this.createPromptTemplate(templateIdentifier, false);
    const formattedPrompt = await promptTemplate.format({ ...promptTemplateFormatter });
    
    console.log(`Formatted template-based PR prompt for ${templateIdentifier}:`, formattedPrompt);

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
          
          // Log the raw response for debugging
          console.log(`Raw response from ${provider.name}:`, {
            content: response.content,
            contentType: typeof response.content,
            contentLength: response.content ? response.content.length : 0,
          });

          // Check if response is empty
          if (!response.content || response.content.trim() === '') {
            logger.warn(`Provider ${provider.name} returned empty content for template-based output`);
            continue;
          }

          return {
            content: response.content,
            provider: provider.name
          };
        }
      } catch (error) {
        logger.warn(`Provider ${provider.name} failed for PR template-based output: ${error.message}`);

        if (provider === this.providers[this.providers.length - 1]) {
          throw new Error(`All providers failed for PR template-based output. Last error from ${provider.name}: ${error.message}`);
        }

        continue;
      }
    }
  }

  /**
   * Stream PR content generation with real-time updates and parsing
   */
  async streamPRContent(promptTemplateFormatter, templateIdentifier, res) {
    if (this.providers.length === 0) {
      throw new Error("No AI providers are configured");
    }

    logger.info(`PR LangChain streamPRContent called with template: ${templateIdentifier}`);

    // Get the base template and format it
    const promptTemplate = await this.createPromptTemplate(templateIdentifier, false);
    const formattedPrompt = await promptTemplate.format({ ...promptTemplateFormatter });
    console.log('formattedPrompt:', formattedPrompt);
    // Try each provider in order of priority
    return this.tryProvidersForStreaming(formattedPrompt, res);
  }

  /**
   * Try providers for streaming content generation
   */
  async tryProvidersForStreaming(formattedPrompt, res) {
    for (const provider of this.providers) {
      try {
        const result = await this.streamWithProvider(provider, formattedPrompt, res);
        return result;
      } catch (error) {
        logger.warn(`Provider ${provider.name} failed for PR streaming: ${error.message}`);

        if (provider === this.providers[this.providers.length - 1]) {
          throw new Error(`All providers failed for PR streaming. Last error from ${provider.name}: ${error.message}`);
        }
        continue;
      }
    }
  }

  /**
   * Stream with a specific provider
   */
  async streamWithProvider(provider, formattedPrompt, res) {
    logger.info(`Trying provider for PR streaming: ${provider.name}`);
    
    const message = new HumanMessage({ content: formattedPrompt });
    const stream = await provider.model.stream([message]);

    // Send status update
    res.write(`data: ${JSON.stringify({
      type: "status",
      message: `Generating with ${provider.name}...`,
      provider: provider.name
    })}\n\n`);

    let fullContent = "";
    let parsedTitle = "";
    let parsedDescription = "";

    // Process the stream
    for await (const chunk of stream) {
      if (chunk.content) {
        fullContent += chunk.content;
        console.log('fullContent:', fullContent);
        // Handle parsing and chunk sending
        const parseResult = this.handleStreamChunk(fullContent, parsedTitle, parsedDescription, res, chunk.content);
        parsedTitle = parseResult.parsedTitle;
        parsedDescription = parseResult.parsedDescription;
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
   * Handle individual stream chunks and send updates
   */
  handleStreamChunk(fullContent, currentTitle, currentDescription, res, chunkContent) {
    // Parse content in real-time to extract title and description
    const parsed = this.parseStreamingContent(fullContent);
    
    // Send title chunks if found
    if (parsed.title && parsed.title !== currentTitle) {
      const titleChunk = parsed.title.slice(currentTitle.length);
      if (titleChunk) {
        res.write(`data: ${JSON.stringify({
          type: "title_chunk",
          data: titleChunk
        })}\n\n`);
      }
    }

    // Send description chunks if found
    if (parsed.description && parsed.description !== currentDescription) {
      const descriptionChunk = parsed.description.slice(currentDescription.length);
      if (descriptionChunk) {
        res.write(`data: ${JSON.stringify({
          type: "description_chunk", 
          data: descriptionChunk
        })}\n\n`);
      }
    }
    
    // Send streaming chunk to frontend
    res.write(`data: ${JSON.stringify({
      type: "content_chunk",
      data: chunkContent
    })}\n\n`);

    return {
      parsedTitle: parsed.title,
      parsedDescription: parsed.description
    };
  }

  /**
   * Parse streaming content to extract title and description in real-time
   */
  parseStreamingContent(content) {
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
  parseStructuredContent(content) {
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
  isTitleLine(line) {
    return line.toLowerCase().includes('title:') || 
           line.toLowerCase().includes('pr title:') ||
           line.toLowerCase().includes('pull request title:');
  }

  /**
   * Check if line contains description marker
   */  
  isDescriptionLine(line) {
    return line.toLowerCase().includes('description:') || 
           line.toLowerCase().includes('pr description:') ||
           line.toLowerCase().includes('pull request description:');
  }

  /**
   * Fallback parsing when no structured markers found
   */
  parseFallbackContent(content) {
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
   * Send final parsed results via SSE
   */
  sendFinalResults(res, title, description, aiGenerated, ticketNumber, branchName) {
    // Send complete title
    res.write(`data: ${JSON.stringify({
      type: "title_complete",
      data: title
    })}\n\n`);

    // Send complete description  
    res.write(`data: ${JSON.stringify({
      type: "description_complete",
      data: description
    })}\n\n`);

    // Send completion event
    res.write(`data: ${JSON.stringify({
      type: "complete",
      data: {
        prTitle: title,
        prDescription: description,
        aiGenerated,
        ticketNumber,
        branchName
      }
    })}\n\n`);
  }

  /**
   * Generate PR description with commit messages using templates only
   */
  async generatePRDescription(commitMessages, templateIdentifier = "PR_DESCRIPTION") {
    try {
      const result = await this.generateTemplateBasedContent(
        { commitMessages },
        templateIdentifier,
        false
      );
      
      return {
        content: result.content,
        provider: result.provider
      };
    } catch (error) {
      logger.error(`Error generating PR description: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate PR title from commit messages using templates only
   */
  async generatePRTitle(commitMessages, templateIdentifier = "PR_TITLE") {
    try {
      const result = await this.generateTemplateBasedContent(
        { commitMessages },
        templateIdentifier,
        false
      );
      
      return {
        content: result.content,
        provider: result.provider
      };
    } catch (error) {
      logger.error(`Error generating PR title: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate combined PR content (title + description) using templates only
   */
  async generateCombinedPRContent(commitMessages, templateIdentifier = "PR_COMBINED") {
    try {
      const result = await this.generateTemplateBasedContent(
        { commitMessages },
        templateIdentifier,
        false
      );
      
      return {
        content: result.content,
        provider: result.provider
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
    if (!content || content.trim() === '') {
      return {
        title: 'PR Title',
        description: 'PR Description'
      };
    }

    // Try to split content into title and description based on common patterns
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      return {
        title: 'PR Title',
        description: content.trim()
      };
    }

    // If only one line, use it as title
    if (lines.length === 1) {
      return {
        title: lines[0].trim(),
        description: lines[0].trim()
      };
    }

    // If multiple lines, first line is typically title, rest is description
    const title = lines[0].trim();
    const description = lines.slice(1).join('\n').trim();

    return {
      title: title || 'PR Title',
      description: description || title || 'PR Description'
    };
  }
}

// Export singleton instance
export default new PRLangChainService();
