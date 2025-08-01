import { BaseLangChainService } from "./BaseLangChainService.js";
import logger from "../../logger.js";

/**
 * Jira-specific LangChain service for handling Jira issue generation
 */
export class JiraLangChainService extends BaseLangChainService {
  constructor() {
    super();
  }

  /**
   * Stream content generation specifically for Jira issues using templates only
   */
  async streamContent(promptTemplateFormatter, images, issueType, res) {
    let fullContent = "";

    res.write(
      `data: ${JSON.stringify({
        type: "status",
        message: "Starting content generation...",
        provider: "Initializing",
      })}\n\n`
    );

    try {
      // Use regular template-based content generation instead of structured parsing
      const result = await this.generateTemplateBasedContent(
        promptTemplateFormatter,
        images,
        issueType
      );

      res.write(
        `data: ${JSON.stringify({
          type: "status",
          message: `Using ${result.provider}...`,
          provider: result.provider,
        })}\n\n`
      );

      // Stream the content naturally from the template
      const content = result.content;
      if (content) {
        // Simulate streaming by sending chunks
        const words = content.split(" ");
        for (let i = 0; i < words.length; i += 5) {
          const chunk = words.slice(i, i + 5).join(" ") + " ";
          fullContent += chunk;
          res.write(
            `data: ${JSON.stringify({
              type: "chunk",
              content: chunk,
            })}\n\n`
          );
          // Small delay to simulate streaming
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      res.write(
        `data: ${JSON.stringify({
          type: "complete",
          message: `${issueType} preview generated successfully`,
          bugReport: fullContent || result.content,
          summary: this.extractSummaryFromContent(
            fullContent || result.content
          ),
          description: fullContent || result.content,
          provider: result.provider,
        })}\n\n`
      );

      logger.info(
        `Successfully streamed template-based Jira content using ${result.provider}`
      );
    } catch (error) {
      logger.error(`Error in Jira template-based streaming: ${error.message}`);
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          error: `Failed to generate ${issueType} preview`,
          details: error.message,
        })}\n\n`
      );
    }
  }

  /**
   * Generate template-based content for Jira issues
   */
  async generateTemplateBasedContent(
    promptTemplateFormatter,
    images,
    issueType
  ) {
    const hasImages = images && images.length > 0;

    if (this.providers.length === 0) {
      throw new Error("No AI providers are configured");
    }

    // Get the template and format it
    const promptTemplate = await this.createPromptTemplate(
      issueType,
      hasImages
    );
    const formattedPrompt = await promptTemplate.format({
      ...promptTemplateFormatter,
    });

    return await this.tryProvidersForTemplateContent(
      formattedPrompt,
      images,
      hasImages
    );
  }

  /**
   * Try each provider for template-based content generation
   */
  async tryProvidersForTemplateContent(formattedPrompt, images, hasImages) {
    for (const provider of this.providers) {
      try {
        logger.info(
          `Trying provider: ${provider.name} for template-based output`
        );

        const messageContent = this.prepareMessageContentForProvider(
          formattedPrompt,
          images,
          hasImages,
          provider.supportsVision
        );

        const response = await provider.model.invoke([
          {
            role: "human",
            content: messageContent,
          },
        ]);

        logger.info(
          `Successfully generated template-based content using ${provider.name}`
        );

        // Log the raw response for debugging
        console.log(`Raw Jira response from ${provider.name}:`, {
          content: response.content,
          contentType: typeof response.content,
          contentLength: response.content ? response.content.length : 0,
        });

        return {
          content: response.content,
          provider: provider.name,
        };
      } catch (error) {
        logger.warn(`Provider ${provider.name} failed: ${error.message}`);

        if (provider === this.providers[this.providers.length - 1]) {
          throw new Error(
            `All providers failed. Last error from ${provider.name}: ${error.message}`
          );
        }

        continue;
      }
    }
  }

  /**
   * Extract a simple summary from content (first line or first sentence)
   */
  extractSummaryFromContent(content) {
    if (!content || content.trim() === "") {
      return "Generated Jira Issue";
    }

    // Try to extract first meaningful line
    const lines = content.split("\n").filter((line) => line.trim() !== "");
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
      return firstSentence.substring(0, 97) + "...";
    }

    // Final fallback
    return content.substring(0, 50) + "...";
  }

  /**
   * Prepare message content for a specific provider
   */
  prepareMessageContentForProvider(
    formattedPrompt,
    images,
    hasImages,
    supportsVision
  ) {
    const useImages = hasImages && supportsVision;

    if (useImages) {
      return this.prepareMessageContent(formattedPrompt, images);
    } else {
      let messageContent = formattedPrompt;
      if (hasImages && !supportsVision) {
        messageContent +=
          " (note: images were provided but this model doesn't support vision)";
      }
      return messageContent;
    }
  }

  /**
   * Enhanced generation with retry logic using templates only
   * @param {Object} promptTemplateFormatter - Template variables
   * @param {Array} images - Image data array
   * @param {string} issueType - Type of Jira issue
   * @returns {Promise<Object>} Generated content result
   */
  async generateContentWithRetry(promptTemplateFormatter, images, issueType) {
    try {
      return await this.generateTemplateBasedContent(
        promptTemplateFormatter,
        images,
        issueType
      );
    } catch (error) {
      logger.error(`Error generating template-based content: ${error.message}`);
      throw error;
    }
  }
}

// Export singleton instance
export default new JiraLangChainService();
