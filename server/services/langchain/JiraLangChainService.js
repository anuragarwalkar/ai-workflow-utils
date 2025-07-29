import { BaseLangChainService } from "./BaseLangChainService.js";
import { z } from "zod";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import logger from "../../logger.js";

// Generic Jira schema that can work with any template format
const JiraOutputSchema = z.object({
  summary: z
    .string()
    .describe("Concise title extracted from the generated content"),
  description: z.string().describe("All the detailed content generated"),
});

/**
 * Jira-specific LangChain service for handling Jira issue generation
 */
export class JiraLangChainService extends BaseLangChainService {
  constructor() {
    super();
  }

  /**
   * Create a structured output parser for Jira content
   */
  createStructuredOutputParser() {
    return StructuredOutputParser.fromZodSchema(JiraOutputSchema);
  }

  /**
   * Enhanced prompt template creation with structured output instructions
   */
  async createStructuredPromptTemplate(issueType, hasImages) {
    const baseTemplate = await this.createPromptTemplate(issueType, hasImages);
    const parser = this.createStructuredOutputParser();

    // Get the original template string
    const originalTemplate = baseTemplate.template;

    // Add minimal JSON formatting instructions
    const enhancedTemplate = `${originalTemplate}

After generating the content above, also provide the same content in JSON format:

${parser.getFormatInstructions()}`;

    return {
      template: enhancedTemplate,
      parser,
      format: baseTemplate.format.bind(baseTemplate),
    };
  }

  /**
   * Stream content generation specifically for Jira issues with structured output
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
      // Use structured content generation instead of regular streaming
      const result = await this.generateStructuredContent(
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

      // Stream the raw content for display purposes
      const rawContent = result.rawContent;
      if (rawContent) {
        // Simulate streaming by sending chunks
        const words = rawContent.split(" ");
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
          bugReport: fullContent || result.structuredData.description,
          summary: result.structuredData.summary,
          description: result.structuredData.description,
          provider: result.provider,
        })}\n\n`
      );

      logger.info(
        `Successfully streamed structured Jira content using ${result.provider}`
      );
    } catch (error) {
      logger.error(`Error in Jira structured streaming: ${error.message}`);
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
   * Generate structured content for Jira issues
   */
  async generateStructuredContent(promptTemplateFormatter, images, issueType) {
    const hasImages = images && images.length > 0;

    if (this.providers.length === 0) {
      throw new Error("No AI providers are configured");
    }

    const { parser, format } = await this.createStructuredPromptTemplate(
      issueType,
      hasImages
    );
    const formattedPrompt = await format({ ...promptTemplateFormatter });

    return await this.tryProvidersForStructuredContent(
      formattedPrompt,
      images,
      hasImages,
      parser
    );
  }

  /**
   * Try each provider for structured content generation
   */
  async tryProvidersForStructuredContent(
    formattedPrompt,
    images,
    hasImages,
    parser
  ) {
    for (const provider of this.providers) {
      try {
        logger.info(`Trying provider: ${provider.name} for structured output`);

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
          `Successfully generated structured content using ${provider.name}`
        );

        return await this.parseStructuredResponse(
          response.content,
          parser,
          provider.name
        );
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
   * Parse structured response
   */
  async parseStructuredResponse(responseContent, parser, providerName) {
    let structuredData;
    const rawContent = responseContent;

    try {
      structuredData = await parser.parse(responseContent);
    } catch (parseError) {
      logger.error(`Structured parsing failed: ${parseError.message}`);
      throw new Error(
        `Failed to parse structured response: ${parseError.message}`
      );
    }

    return {
      structuredData,
      rawContent,
      provider: providerName,
    };
  }

  /**
   * Legacy method for backward compatibility
   */
  parseJiraContent(fullContent, issueType) {
    // This method is kept for backward compatibility but should not be used
    // in new implementations. Use structured output parsing instead.
    throw new Error(
      "Manual parsing is deprecated. Use structured output parsing instead."
    );
  }
}

// Export singleton instance
export default new JiraLangChainService();
