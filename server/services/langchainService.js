import { ChatOpenAI } from "@langchain/openai";
import { ChatOllama } from "@langchain/ollama";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import { PromptTemplate } from "@langchain/core/prompts";
import logger from "../logger.js";
import templateDbService from "./templateDbService.js";
import dotenv from 'dotenv';

dotenv.config()

class LangChainService {
  constructor() {
    this.providers = [];
  }

  initializeProviders() {
    // Reset providers to avoid duplicates on reinitialization
    this.providers = [];

    // 1. OpenAI (Official ChatGPT API)
    if (process.env.OPENAI_API_KEY) {
      this.providers.push({
        name: "OpenAI ChatGPT",
        model: new ChatOpenAI({
          openAIApiKey: process.env.OPENAI_API_KEY,
          modelName: process.env.OPENAI_MODEL || "gpt-4-vision-preview",
          temperature: 0.7,
          maxTokens: 2000,
          timeout: 60000,
        }),
        supportsVision: this.modelSupportsVision(process.env.OPENAI_MODEL || "gpt-4-vision-preview"),
        priority: 1
      });
    }

    // 2. OpenAI-Compatible APIs (Anthropic Claude, local models, etc.)
    if (process.env.OPENAI_COMPATIBLE_BASE_URL && process.env.OPENAI_COMPATIBLE_API_KEY) {
      this.providers.push({
        name: "OpenAI Compatible",
        model: new ChatOpenAI({
          openAIApiKey: process.env.OPENAI_COMPATIBLE_API_KEY,
          modelName: process.env.OPENAI_COMPATIBLE_MODEL || "claude-3-sonnet-20240229",
          temperature: 0.7,
          maxTokens: 2000,
          timeout: 60000,
          configuration: {
            baseURL: process.env.OPENAI_COMPATIBLE_BASE_URL,
          },
        }),
        supportsVision: this.modelSupportsVision(process.env.OPENAI_COMPATIBLE_MODEL),
        priority: 2
      });
    }

    // 3. Google Gemini
    if (process.env.GOOGLE_API_KEY) {
      this.providers.push({
        name: "Google Gemini",
        model: new ChatGoogleGenerativeAI({
          apiKey: process.env.GOOGLE_API_KEY,
          modelName: process.env.GOOGLE_MODEL || "gemini-pro-vision",
          temperature: 0.7,
          maxOutputTokens: 2000,
        }),
        supportsVision: true,
        priority: 3
      });
    }

    // 4. Ollama (Local models)
    if (process.env.OLLAMA_BASE_URL) {
      this.providers.push({
        name: "Ollama",
        model: new ChatOllama({
          baseUrl: process.env.OLLAMA_BASE_URL,
          model: process.env.OLLAMA_MODEL || "llava",
          temperature: 0.7,
        }),
        supportsVision: true,
        priority: 4
      });
    }

    // Sort providers by priority
    this.providers.sort((a, b) => a.priority - b.priority);
    
    logger.info(`Initialized ${this.providers.length} AI providers: ${this.providers.map(p => p.name).join(', ')}`);
  }

  modelSupportsVision(modelName) {
    if (!modelName) return false;
    return (
      modelName.includes('vision') ||
      modelName.includes('gpt-4') ||
      modelName.includes('claude-3') ||
      modelName.includes('llava') ||
      modelName.includes('gemini')
    );
  }

  async createPromptTemplate(issueType, hasImages) {
    try {
      // Initialize template database if not already done
      await templateDbService.init();
      
      // Get the active template for this issue type
      const template = await templateDbService.getActiveTemplate(issueType);
      
      let templateString;
      
      if (template && template.content) {
        // Use user's template (either custom or default from database)
        templateString = template.content;
        logger.info(`Using template for ${issueType}: ${template.name}`);
      } else {
        // Very basic fallback if no template found at all
        logger.warn(`No template found for ${issueType}, using basic fallback`);
        templateString = `{prompt} - Generate a detailed ${issueType} description based on the provided information.`;
      }

      // Replace template variables with actual values
      if (hasImages) {
        templateString = templateString
          .replace(/\{imageReference\}/g, "& image")
          .replace(/\{imageContext\}/g, "visible in the image");
      } else {
        templateString = templateString
          .replace(/\{imageReference\}/g, "")
          .replace(/\{imageContext\}/g, "described in the prompt");
      }

      return PromptTemplate.fromTemplate(templateString);
    } catch (error) {
      logger.error(`Error creating prompt template for ${issueType}:`, error);
      // Fallback to a basic template
      return PromptTemplate.fromTemplate(`{prompt} - Generate a detailed ${issueType} description based on the provided information.`);
    }
  }

  prepareMessageContent(prompt, images) {
    if (!images || images.length === 0) {
      return prompt;
    }

    const imageContent = images.map(image => {
      let base64Data = image;
      let mediaType = "image/jpeg";
      
      if (image.startsWith('data:')) {
        const [header, data] = image.split(',');
        base64Data = data;
        const mediaTypeMatch = header.match(/data:([^;]+)/);
        if (mediaTypeMatch) {
          mediaType = mediaTypeMatch[1];
        }
      } else {
        if (image.startsWith('/9j/') || image.startsWith('iVBORw0KGgo')) {
          mediaType = image.startsWith('/9j/') ? "image/jpeg" : "image/png";
        }
      }
      
      return {
        type: "image_url",
        image_url: {
          url: `data:${mediaType};base64,${base64Data}`
        }
      };
    });

    return [
      { type: "text", text: prompt },
      ...imageContent
    ];
  }

  // SINGLE METHOD for ALL providers (OpenAI, OpenAI-Compatible, Gemini, Ollama)
  async generateContent(prompt, images, issueType = "Bug", streaming = false) {
    const hasImages = images && images.length > 0;
    
    if (this.providers.length === 0) {
      throw new Error("No AI providers are configured");
    }

    const promptTemplate = await this.createPromptTemplate(issueType, hasImages);
    const formattedPrompt = await promptTemplate.format({ prompt });

    // Try each provider in order of priority
    for (const provider of this.providers) {
      try {
        logger.info(`Trying provider: ${provider.name}`);
        
        const useImages = hasImages && provider.supportsVision;
        let messageContent;
        
        if (useImages) {
          messageContent = this.prepareMessageContent(formattedPrompt, images);
        } else {
          messageContent = formattedPrompt;
          if (hasImages && !provider.supportsVision) {
            messageContent += " (note: images were provided but this model doesn't support vision)";
          }
        }

        const message = new HumanMessage({ content: messageContent });

        if (streaming) {
          const stream = await provider.model.stream([message]);
          return { content: stream, provider: provider.name };
        } else {
          const response = await provider.model.invoke([message]);
          logger.info(`Successfully generated content using ${provider.name}`);
          return { content: response.content, provider: provider.name };
        }
      } catch (error) {
        logger.warn(`Provider ${provider.name} failed: ${error.message}`);
        
        if (provider === this.providers[this.providers.length - 1]) {
          throw new Error(`All providers failed. Last error from ${provider.name}: ${error.message}`);
        }
        
        continue;
      }
    }
  }

  async streamContent(prompt, images, issueType, res) {
    const hasImages = images && images.length > 0;
    let fullContent = "";

    res.write(`data: ${JSON.stringify({
      type: 'status',
      message: 'Starting content generation...',
      provider: 'Initializing'
    })}\n\n`);

    try {
      const { content: stream, provider } = await this.generateContent(prompt, images, issueType, true);
      
      res.write(`data: ${JSON.stringify({
        type: 'status',
        message: `Using ${provider}...`,
        provider: provider
      })}\n\n`);

      for await (const chunk of stream) {
        if (chunk.content) {
          fullContent += chunk.content;
          res.write(`data: ${JSON.stringify({
            type: 'chunk',
            content: chunk.content
          })}\n\n`);
        }
      }

      if (!fullContent) {
        throw new Error("No content generated from AI provider");
      }

      const summaryMatch = fullContent.match(
        /(?:h3\. (?:Issue Summary|Task Summary|Story Summary|Summary):|(?:Issue Summary|Task Summary|Story Summary|Summary):)\s*(.+)/
      );
      let summary = summaryMatch?.[1]?.trim();
      
      if (summary) {
        summary = summary.replace(/^\[|\]$/g, '').trim();
      }
      
      let description = fullContent
        .replace(/(?:h3\. (?:Issue Summary|Task Summary|Story Summary|Summary):|(?:Issue Summary|Task Summary|Story Summary|Summary):)\s*.+/, "")
        .trim();
      
      if (description) {
        description = description.replace(/h3\.\s*/g, '').trim();
      }

      res.write(`data: ${JSON.stringify({
        type: 'complete',
        message: `${issueType} preview generated successfully`,
        bugReport: fullContent,
        summary: summary || `${issueType}: Summary not available`,
        description: description || "Description not available",
        provider: provider,
      })}\n\n`);

      logger.info(`Successfully streamed content using ${provider}`);
    } catch (error) {
      logger.error(`Error in streaming: ${error.message}`);
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: `Failed to generate ${issueType} preview`,
        details: error.message
      })}\n\n`);
    }
  }

  getAvailableProviders() {
    return this.providers.map(p => ({
      name: p.name,
      supportsVision: p.supportsVision,
      priority: p.priority
    }));
  }
}

export default new LangChainService();
