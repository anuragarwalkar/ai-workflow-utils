import { ChatOpenAI } from '@langchain/openai';
import { ChatOllama } from '@langchain/ollama';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage } from '@langchain/core/messages';
import { PromptTemplate } from '@langchain/core/prompts';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { createReactAgent } from 'langchain/agents';
import { pull } from 'langchain/hub';
import logger from '../../logger.js';
import templateDbService from '../templateDbService.js';
import mcpService from '../mcpService.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Base LangChain service class that handles provider initialization and common functionality
 */
export class BaseLangChainService {
  constructor() {
    this.providers = [];
    this.mcpClient = null;
    this.mcpAgent = null;
  }

  /**
   * Initialize AI providers based on environment configuration
   */
  async initializeProviders() {
    // Reset providers to avoid duplicates on reinitialization
    this.providers = [];

    // 1. OpenAI (Official ChatGPT API)
    if (process.env.OPENAI_API_KEY) {
      this.providers.push({
        name: 'OpenAI ChatGPT',
        model: new ChatOpenAI({
          openAIApiKey: process.env.OPENAI_API_KEY,
          modelName: process.env.OPENAI_MODEL || 'gpt-4-vision-preview',
          temperature: 0.4,
        }),
        supportsVision: this.modelSupportsVision(
          process.env.OPENAI_MODEL || 'gpt-4-vision-preview'
        ),
        priority: 1,
      });
    }

    // 2. OpenAI-Compatible APIs (Anthropic Claude, local models, etc.)
    if (process.env.OPENAI_COMPATIBLE_BASE_URL && process.env.OPENAI_COMPATIBLE_API_KEY) {
      this.providers.push({
        name: 'OpenAI Compatible',
        model: new ChatOpenAI({
          apiKey: process.env.OPENAI_COMPATIBLE_API_KEY,
          model: process.env.OPENAI_COMPATIBLE_MODEL || 'claude-3-sonnet-20240229',
          temperature: 0.4,
          configuration: {
            baseURL: process.env.OPENAI_COMPATIBLE_BASE_URL,
          },
        }),
        supportsVision: this.modelSupportsVision(process.env.OPENAI_COMPATIBLE_MODEL),
        priority: 2,
      });
    }

    // 3. Google Gemini
    if (process.env.GOOGLE_API_KEY) {
      this.providers.push({
        name: 'Google Gemini',
        model: new ChatGoogleGenerativeAI({
          apiKey: process.env.GOOGLE_API_KEY,
          modelName: process.env.GOOGLE_MODEL || 'gemini-pro-vision',
          temperature: 0.4,
        }),
        supportsVision: true,
        priority: 3,
      });
    }

    // 4. Ollama (Local models)
    if (process.env.OLLAMA_BASE_URL) {
      this.providers.push({
        name: 'Ollama',
        model: new ChatOllama({
          baseUrl: process.env.OLLAMA_BASE_URL,
          model: process.env.OLLAMA_MODEL || 'llava',
          temperature: 0.4,
        }),
        supportsVision: true,
        priority: 4,
      });
    }

    // Sort providers by priority
    this.providers.sort((a, b) => a.priority - b.priority);

    logger.info(
      `Initialized ${this.providers.length} AI providers: ${this.providers.map(p => p.name).join(', ')}`
    );

    // Initialize MCP clients after providers are set up
    await this.initializeMCPClients();
  }

  /**
   * Initialize MCP clients and create React agent
   */
  async initializeMCPClients() {
    try {
      const mcpClients = await mcpService.getEnabledClients();
      
      if (mcpClients.length === 0) {
        logger.info('No enabled MCP clients found');
        return;
      }

      const mcpClientConfig = this.createMCPClientConfig(mcpClients);
      this.mcpClient = new MultiServerMCPClient(mcpClientConfig);

      // Try to initialize the MCP client
      await this.connectMCPClient();

      // Load MCP tools and create React agent
      await this.createMCPAgent();

      logger.info(`Initialized ${mcpClients.length} MCP clients: ${mcpClients.map(c => c.name).join(', ')}`);
    } catch (error) {
      logger.error('Failed to initialize MCP clients:', error);
    }
  }

  /**
   * Create MCP client configuration for single or multiple clients
   */
  createMCPClientConfig(mcpClients) {
    if (mcpClients.length === 1) {
      return BaseLangChainService.createSingleClientConfig(mcpClients[0]);
    } else {
      return BaseLangChainService.createMultipleClientsConfig(mcpClients);
    }
  }

  /**
   * Create configuration for single MCP client
   */
  static createSingleClientConfig(client) {
    const serverConfig = {};
    
    if (client.url) {
      serverConfig.url = client.url;
    } else if (client.command) {
      serverConfig.command = client.command;
      serverConfig.args = client.args || [];
    }

    if (client.token) {
      serverConfig.token = client.token;
    }

    return {
      mcpServers: {
        [client.name.toLowerCase().replace(/[^a-z0-9]/g, '_')]: serverConfig
      }
    };
  }

  /**
   * Create configuration for multiple MCP clients
   */
  static createMultipleClientsConfig(mcpClients) {
    const mcpServers = {};
    
    mcpClients.forEach(client => {
      const serverConfig = {};
      
      if (client.url) {
        serverConfig.url = client.url;
        serverConfig.automaticSSEFallback = false;
      } else if (client.command) {
        serverConfig.command = client.command;
        serverConfig.args = client.args || [];
      }

      if (client.token) {
        serverConfig.token = client.token;
      }

      // Use client name as the server key (sanitize for valid object key)
      const serverKey = client.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      mcpServers[serverKey] = serverConfig;
    });

    return { mcpServers };
  }

  /**
   * Connect to MCP client
   */
  async connectMCPClient() {
    if (typeof this.mcpClient.connect === 'function') {
      await this.mcpClient.connect();
    } else if (typeof this.mcpClient.initialize === 'function') {
      await this.mcpClient.initialize();
    }
  }

  /**
   * Create MCP agent with tools
   */
  async createMCPAgent() {
    if (this.providers.length > 0) {
      try {
        logger.info('Attempting to load MCP tools...');
        logger.info('MCP client type:', typeof this.mcpClient);
        logger.info('MCP client methods:', Object.getOwnPropertyNames(this.mcpClient).filter(name => typeof this.mcpClient[name] === 'function'));
        
        // Use direct getTools() method like in the working index.js
        const mcpTools = await this.mcpClient.getTools();
        logger.info('MCP tools loaded successfully:', mcpTools.length);
        
        // Create React agent with MCP tools
        const prompt = await pull("hwchase17/react");
        this.mcpAgent = await createReactAgent({
          llm: this.providers[0].model, // Use primary provider
          tools: mcpTools,
          prompt
        });
        
        logger.info('MCP React agent created successfully with tools');
      } catch (agentError) {
        logger.warn('Failed to create React agent, MCP tools will be available directly:', agentError.message);
        logger.debug('Full error:', agentError);
        // MCP client is still available for direct use
      }
    }
  }

  /**
   * Check if a model supports vision capabilities
   */
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

  /**
   * Create a prompt template for a specific issue type
   */
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
          .replace(/\{imageReference\}/g, '& image')
          .replace(/\{imageContext\}/g, 'visible in the image');
      } else {
        templateString = templateString
          .replace(/\{imageReference\}/g, '')
          .replace(/\{imageContext\}/g, 'described in the prompt');
      }

      return PromptTemplate.fromTemplate(templateString);
    } catch (error) {
      logger.error(`Error creating prompt template for ${issueType}:`, error);
      // Fallback to a basic template
      return PromptTemplate.fromTemplate(
        `{prompt} - Generate a detailed ${issueType} description based on the provided information.`
      );
    }
  }

  /**
   * Prepare message content with optional images
   */
  prepareMessageContent(prompt, images) {
    if (!images || images.length === 0) {
      return prompt;
    }

    const imageContent = images.map(image => {
      let base64Data = image;
      let mediaType = 'image/jpeg';

      if (image.startsWith('data:')) {
        const [header, data] = image.split(',');
        base64Data = data;
        const mediaTypeMatch = header.match(/data:([^;]+)/);
        if (mediaTypeMatch) {
          // eslint-disable-next-line no-undef
          [_, mediaType] = mediaTypeMatch;
        }
      } else {
        if (image.startsWith('/9j/') || image.startsWith('iVBORw0KGgo')) {
          mediaType = image.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
        }
      }

      return {
        type: 'image_url',
        image_url: {
          url: `data:${mediaType};base64,${base64Data}`,
        },
      };
    });

    return [{ type: 'text', text: prompt }, ...imageContent];
  }

  /**
   * Enhanced content generation method with MCP agent support
   */
  // eslint-disable-next-line max-params
  async generateContent(
    promptTemplateFormatter,
    images,
    promptTemplateIdentifier,
    streaming = false,
    useMCPAgent = false
  ) {
    const hasImages = images && images.length > 0;

    if (this.providers.length === 0) {
      throw new Error('No AI providers are configured');
    }

    const promptTemplate = await this.createPromptTemplate(promptTemplateIdentifier, hasImages);
    const formattedPrompt = await promptTemplate.format({
      ...promptTemplateFormatter,
    });

    // If MCP agent is available and requested, use it
    if (useMCPAgent && this.mcpAgent) {
      // eslint-disable-next-line max-lines
      try {
        logger.info('Using MCP agent for content generation');
        
        if (streaming) {
          const stream = await this.mcpAgent.streamEvents({
            input: formattedPrompt,
            ...(hasImages && { images })
          });
          return { content: stream, provider: 'MCP Agent', usedMCP: true };
        } else {
          const response = await this.mcpAgent.invoke({
            input: formattedPrompt,
            ...(hasImages && { images })
          });
          return { content: response.output, provider: 'MCP Agent', usedMCP: true };
        }
      } catch (error) {
        logger.warn(`MCP agent failed, falling back to regular providers: ${error.message}`);
      }
    }

    return this.generateWithProviders(formattedPrompt, images, hasImages, streaming);
  }

  /**
   * Generate content using available providers
   */
  // eslint-disable-next-line max-statements
  async generateWithProviders(formattedPrompt, images, hasImages, streaming) {
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
          return { content: stream, provider: provider.name, usedMCP: false };
        } else {
          const response = await provider.model.invoke([message]);
          logger.info(`Successfully generated content using ${provider.name}`);
          return { content: response.content, provider: provider.name, usedMCP: false };
        }
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
   * Get available providers and MCP status
   */
  getAvailableProviders() {
    return {
      providers: this.providers.map(p => ({
        name: p.name,
        supportsVision: p.supportsVision,
        priority: p.priority,
      })),
      mcpAgent: {
        // eslint-disable-next-line max-lines
        available: !!this.mcpAgent,
        clientsConnected: this.mcpClient ? true : false
      }
    };
  }

  /**
   * Cleanup MCP connections
   */
  async cleanup() {
    if (this.mcpClient) {
      try {
        if (typeof this.mcpClient.disconnect === 'function') {
          await this.mcpClient.disconnect();
        } else if (typeof this.mcpClient.close === 'function') {
          await this.mcpClient.close();
        }
        logger.info('MCP client disconnected');
      } catch (error) {
        logger.error('Error disconnecting MCP client:', error);
      }
    }
  }
}
