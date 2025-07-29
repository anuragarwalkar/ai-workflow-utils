import { BaseLangChainService } from './BaseLangChainService.js';
import { StructuredOutputParser } from "@langchain/core/output_parsers";
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
   * Generate structured content specifically for PR creation
   */
  async generateStructuredContent(promptTemplateFormatter, schema, templateIdentifier, streaming = false) {
    if (this.providers.length === 0) {
      throw new Error("No AI providers are configured");
    }

    logger.info(`PR LangChain generateStructuredContent called with template: ${templateIdentifier}`);

    // Create the output parser with the provided schema
    const parser = StructuredOutputParser.fromZodSchema(schema);
    const formatInstructions = parser.getFormatInstructions();

    // Get the base template and format it first
    const promptTemplate = await this.createPromptTemplate(templateIdentifier, false);
    const formattedBasePrompt = await promptTemplate.format({ ...promptTemplateFormatter });
    
    // Now combine the formatted prompt with format instructions
    // This avoids template parsing issues with unmatched braces in format instructions
    const finalPrompt = `${formattedBasePrompt}\n\n${formatInstructions}`;

    console.log(`Formatted structured PR prompt for ${templateIdentifier}:`, finalPrompt);

    // Try each provider in order of priority
    for (const provider of this.providers) {
      try {
        logger.info(`Trying provider for PR structured output: ${provider.name}`);
        
        const message = new HumanMessage({ content: finalPrompt });

        if (streaming) {
          // For streaming structured output, we'll accumulate and parse at the end
          const stream = await provider.model.stream([message]);
          let accumulatedContent = "";
          
          async function* streamWithParsing() {
            for await (const chunk of stream) {
              if (chunk.content) {
                accumulatedContent += chunk.content;
                yield { content: chunk.content, type: 'chunk' };
              }
            }
            
            // Try to parse the final accumulated content
            try {
              const parsed = await parser.parse(accumulatedContent);
              yield { content: parsed, type: 'structured', provider: provider.name };
            } catch (parseError) {
              logger.warn(`Failed to parse PR structured output: ${parseError.message}`);
              yield { content: accumulatedContent, type: 'fallback', provider: provider.name };
            }
          }

          return { content: streamWithParsing(), provider: provider.name };
        } else {
          const response = await provider.model.invoke([message]);
          logger.info(`Successfully generated PR structured content using ${provider.name}`);
          
          try {
            const parsed = await parser.parse(response.content);
            console.log(`Parsed PR structured response from ${provider.name}:`, parsed);
            return { content: parsed, provider: provider.name };
          } catch (parseError) {
            logger.warn(`Failed to parse PR structured output, returning raw content: ${parseError.message}`);
            return { content: response.content, provider: provider.name };
          }
        }
      } catch (error) {
        logger.warn(`Provider ${provider.name} failed for PR structured output: ${error.message}`);
        console.log(`Provider ${provider.name} PR structured error details:`, error);
        
        if (provider === this.providers[this.providers.length - 1]) {
          throw new Error(`All providers failed for PR structured output. Last error from ${provider.name}: ${error.message}`);
        }
        
        continue;
      }
    }
  }

  /**
   * Generate PR description with commit messages
   */
  async generatePRDescription(commitMessages, templateIdentifier = "PR_DESCRIPTION") {
    try {
      const result = await this.generateContent(
        { commitMessages },
        null, // No images for PR descriptions
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
   * Generate PR title from commit messages
   */
  async generatePRTitle(commitMessages, templateIdentifier = "PR_TITLE") {
    try {
      const result = await this.generateContent(
        { commitMessages },
        null, // No images for PR titles
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
   * Generate combined PR content (title + description) 
   */
  async generateCombinedPRContent(commitMessages, schema, templateIdentifier = "PR_COMBINED") {
    try {
      const result = await this.generateStructuredContent(
        { commitMessages },
        schema,
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
}

// Export singleton instance
export default new PRLangChainService();
