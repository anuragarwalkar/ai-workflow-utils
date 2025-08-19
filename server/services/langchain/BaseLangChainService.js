/* eslint-disable max-statements */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-lines */
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
    this.mcpAgents = new Map(); // Store MCP agents for each provider
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
      try {
        // Validate the model name for Google Gemini
        const googleModel = process.env.GOOGLE_MODEL || 'gemini-1.5-flash';
        
        // Use a more reliable model name that doesn't include "vision" in the name
        // as the library might be handling vision capabilities automatically
        this.providers.push({
          name: 'Google Gemini',
          model: new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY,
            modelName: googleModel,
            temperature: 0.7, // Add some temperature for better responses
          }),
          supportsVision: true, // Gemini models support vision
          priority: 3,
        });
        
        logger.info(`Google Gemini provider initialized with model: ${googleModel}`);
      } catch (error) {
        logger.error('Failed to initialize Google Gemini provider:', error.message);
      }
    }

    // 4. Ollama (Local models)
    if (process.env.OLLAMA_BASE_URL) {
      this.providers.push({
        name: 'Ollama',
        model: new ChatOllama({
          baseUrl: process.env.OLLAMA_BASE_URL,
          model: process.env.OLLAMA_MODEL || 'llava',
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
   * Create MCP agents with tools for all providers
   */
  async createMCPAgent() {
    if (this.providers.length === 0) {
      logger.warn('No providers available for MCP agent creation');
      return;
    }

    try {
      logger.info('Attempting to load MCP tools...');
      logger.info('MCP client type:', typeof this.mcpClient);
      logger.info('MCP client methods:', Object.getOwnPropertyNames(this.mcpClient).filter(name => typeof this.mcpClient[name] === 'function'));
      
      // Use direct getTools() method like in the working index.js
      const mcpTools = await this.mcpClient.getTools();
      logger.info('MCP tools loaded successfully:', mcpTools.length);
      
      // Create React agents for all providers
      const prompt = await pull("hwchase17/react");
      
      for (const provider of this.providers) {
        try {
          const mcpAgent = await createReactAgent({
            llm: provider.model,
            tools: mcpTools,
            prompt
          });
          
          this.mcpAgents.set(provider.name, mcpAgent);
          logger.info(`MCP React agent created successfully for provider: ${provider.name}`);
        } catch (agentError) {
          logger.warn(`Failed to create MCP agent for provider ${provider.name}:`, agentError.message);
        }
      }
      
      logger.info(`Created ${this.mcpAgents.size} MCP agents out of ${this.providers.length} providers`);
    } catch (agentError) {
      logger.warn('Failed to create React agents, MCP tools will be available directly:', agentError.message);
      logger.debug('Full error:', agentError);
      // MCP client is still available for direct use
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
    // Defensive check for images parameter
    if (!images || !Array.isArray(images) || images.length === 0) {
      return prompt;
    }

    try {
      const imageContent = images.filter(image => image && typeof image === 'string').map(image => {
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
    } catch (error) {
      logger.warn(`Error preparing message content with images: ${error.message}`);
      // Fallback to text-only content
      return prompt;
    }
  }

  /**
   * Enhanced content generation method with MCP agent support
   * @param {Object} options - Generation options
   * @param {Object} options.promptTemplateFormatter - Template formatting data
   * @param {Array} options.images - Array of image data
   * @param {string} options.promptTemplateIdentifier - Template identifier
   * @param {boolean} options.streaming - Whether to use streaming response
   * @param {boolean} options.useMCPAgent - Whether to use MCP agent
   * @param {string} options.preferredProvider - Preferred provider name (optional)
   */
  async generateContent({
    promptTemplateFormatter,
    images,
    promptTemplateIdentifier,
    streaming = false,
    useMCPAgent = false,
    preferredProvider = null
  }) {
    // Ensure images is always an array or null
    const normalizedImages = Array.isArray(images) ? images : (images ? [images] : []);
    const hasImages = normalizedImages.length > 0;

    logger.debug('generateContent called with:', {
      hasImages,
      imagesCount: normalizedImages.length,
      imagesType: typeof images,
      useMCPAgent,
      preferredProvider
    });

    if (this.providers.length === 0) {
      throw new Error('No AI providers are configured');
    }

    const promptTemplate = await this.createPromptTemplate(promptTemplateIdentifier, hasImages);
    const formattedPrompt = await promptTemplate.format({
      ...promptTemplateFormatter,
    });

    // Try MCP agent first if requested
    if (useMCPAgent && this.mcpAgents.size > 0) {
      const mcpResult = await this.tryMCPAgent({
        formattedPrompt,
        images: normalizedImages,
        hasImages,
        streaming,
        preferredProvider
      });
      
      if (mcpResult) {
        return mcpResult;
      }
    }

    return this.generateWithProviders({
      formattedPrompt,
      images: normalizedImages,
      hasImages,
      streaming,
      preferredProvider
    });
  }

  /**
   * Try using MCP agent for content generation
   */
  async tryMCPAgent({ formattedPrompt, images, hasImages, streaming, preferredProvider }) {
    try {
      const { selectedAgent, selectedProviderName } = this.selectMCPAgent(preferredProvider);
      
      if (selectedAgent) {
        return await this.invokeMCPAgent({
          agent: selectedAgent,
          providerName: selectedProviderName,
          formattedPrompt,
          images,
          hasImages,
          streaming
        });
      }
    } catch (error) {
      logger.warn(`MCP agent failed, falling back to regular providers: ${error.message}`);
    }
    
    return null;
  }

  /**
   * Select the appropriate MCP agent based on preference
   */
  selectMCPAgent(preferredProvider) {
    let selectedAgent = null;
    let selectedProviderName = null;

    if (preferredProvider && this.mcpAgents.has(preferredProvider)) {
      selectedAgent = this.mcpAgents.get(preferredProvider);
      selectedProviderName = preferredProvider;
    } else {
      // Use first available MCP agent
      const firstEntry = this.mcpAgents.entries().next().value;
      if (firstEntry) {
        [selectedProviderName, selectedAgent] = firstEntry;
      }
    }

    return { selectedAgent, selectedProviderName };
  }

  /**
   * Invoke the selected MCP agent with the given parameters
   */
  async invokeMCPAgent({ agent, providerName, formattedPrompt, images, hasImages, streaming }) {
    logger.info(`Using MCP agent for provider: ${providerName}`);
    
    // For MCP agents, we include image information in the prompt text since they handle tools differently
    let mcpPrompt = formattedPrompt;
    if (hasImages && images && images.length > 0) {
      mcpPrompt += `\n\nNote: ${images.length} image(s) were provided with this request. The images contain visual context that may be relevant to the task.`;
    }
    
    if (streaming) {
      const stream = agent.streamEvents({
        input: mcpPrompt
      });
      return { content: stream, provider: `MCP Agent (${providerName})`, usedMCP: true };
    } else {
      const response = await agent.invoke({
        input: mcpPrompt
      });
      return { content: response.output, provider: `MCP Agent (${providerName})`, usedMCP: true };
    }
  }

  /**
   * Generate content using available providers
   * @param {Object} options - Generation options
   * @param {string} options.formattedPrompt - The formatted prompt
   * @param {Array} options.images - Array of image data
   * @param {boolean} options.hasImages - Whether images are present
   * @param {boolean} options.streaming - Whether to use streaming
   * @param {string} options.preferredProvider - Preferred provider name (optional)
   */
  async generateWithProviders({ formattedPrompt, images, hasImages, streaming, preferredProvider = null }) {
    logger.info(`generateWithProviders called with ${this.providers.length} providers available`);
    logger.debug('Available providers:', this.providers.map(p => ({ name: p.name, priority: p.priority })));

    // If preferred provider is specified, try it first
    if (preferredProvider) {
      const provider = this.providers.find(p => p.name === preferredProvider);
      if (provider) {
        try {
          logger.info(`Trying preferred provider: ${preferredProvider}`);
          const result = await this.tryProvider({ provider, formattedPrompt, images, hasImages, streaming });
          if (result) return result;
        } catch (error) {
          logger.warn(`Preferred provider ${preferredProvider} failed: ${error.message}`);
        }
      } else {
        logger.warn(`Preferred provider ${preferredProvider} not found in available providers`);
      }
    }

    // Try each provider in order of priority (excluding already tried preferred provider)
    let lastError = null;
    for (const provider of this.providers) {
      if (preferredProvider && provider.name === preferredProvider) {
        continue; // Skip already tried preferred provider
      }

      try {
        logger.info(`Attempting provider: ${provider.name} (priority: ${provider.priority})`);
        const result = await this.tryProvider({ provider, formattedPrompt, images, hasImages, streaming });
        if (result) return result;
      } catch (error) {
        lastError = error;
        logger.warn(`Provider ${provider.name} failed: ${error.message}`);
        
        // Continue to next provider instead of throwing immediately
        continue;
      }
    }

    // If we get here, all providers failed
    const providerNames = this.providers.map(p => p.name).join(', ');
    throw new Error(
      `All ${this.providers.length} providers failed (${providerNames}). Last error: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Try a specific provider for content generation
   * @param {Object} options - Provider options
   * @param {Object} options.provider - Provider object
   * @param {string} options.formattedPrompt - The formatted prompt
   * @param {Array} options.images - Array of image data
   * @param {boolean} options.hasImages - Whether images are present
   * @param {boolean} options.streaming - Whether to use streaming
   */
  async tryProvider({ provider, formattedPrompt, images, hasImages, streaming }) {
    logger.info(`Trying provider: ${provider.name}`);

    try {
      const useImages = hasImages && provider.supportsVision;
      let messageContent;

      if (useImages) {
        logger.debug(`Preparing message content with images for ${provider.name}`);
        messageContent = this.prepareMessageContent(formattedPrompt, images);
      } else {
        messageContent = formattedPrompt;
        if (hasImages && !provider.supportsVision) {
          messageContent += " (note: images were provided but this model doesn't support vision)";
        }
      }

      // Special handling for Google Gemini to avoid known issues
      if (provider.name === 'Google Gemini') {
        // Ensure the prompt is not empty and has reasonable length
        if (!messageContent || (typeof messageContent === 'string' && messageContent.trim().length < 3)) {
          throw new Error('Prompt too short for Google Gemini');
        }
        
        // For Google Gemini, use simpler message format
        if (typeof messageContent === 'string') {
          const message = new HumanMessage({ content: messageContent });
          
          if (streaming) {
            const stream = await provider.model.stream([message]);
            return { content: stream, provider: provider.name, usedMCP: false };
          } else {
            const response = await provider.model.invoke([message]);
            logger.info(`Successfully generated content using ${provider.name}`);
            return { content: response.content, provider: provider.name, usedMCP: false };
          }
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
      // Enhanced error logging for specific providers
      const errorInfo = {
        error: error.message,
        provider: provider.name,
        hasImages,
        imagesType: typeof images,
        imagesLength: Array.isArray(images) ? images.length : 'not array',
        messageContentType: typeof messageContent,
        promptLength: typeof formattedPrompt === 'string' ? formattedPrompt.length : 'not string'
      };

      // Add specific error context for Google Gemini
      if (provider.name === 'Google Gemini') {
        errorInfo.modelName = provider.model.modelName;
        errorInfo.apiKeyPresent = !!process.env.GOOGLE_API_KEY;
      }

      logger.error(`Error in tryProvider for ${provider.name}:`, errorInfo);
      throw error;
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
        mcpAgentAvailable: this.mcpAgents.has(p.name)
      })),
      mcpAgents: {
        available: this.mcpAgents.size > 0,
        count: this.mcpAgents.size,
        providers: Array.from(this.mcpAgents.keys()),
        clientsConnected: this.mcpClient ? true : false
      }
    };
  }

  /**
   * Get MCP agent for a specific provider
   * @param {string} providerName - Name of the provider
   * @returns {Object|null} MCP agent or null if not available
   */
  getMCPAgent(providerName) {
    return this.mcpAgents.get(providerName) || null;
  }

  /**
   * Check if MCP agent is available for a provider
   * @param {string} providerName - Name of the provider
   * @returns {boolean} Whether MCP agent is available
   */
  hasMCPAgent(providerName) {
    return this.mcpAgents.has(providerName);
  }

  /**
   * Cleanup MCP connections
   */
  async cleanup() {
    // Clear MCP agents
    if (this.mcpAgents.size > 0) {
      logger.info(`Cleaning up ${this.mcpAgents.size} MCP agents`);
      this.mcpAgents.clear();
    }

    // Disconnect MCP client
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
