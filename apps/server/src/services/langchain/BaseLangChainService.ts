/* eslint-disable max-statements */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-lines */
import { ChatOpenAI } from '@langchain/openai';
import { ChatOllama } from '@langchain/ollama';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage } from '@langchain/core/messages';
import { PromptTemplate } from '@langchain/core/prompts';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { createReactAgent } from '@langchain/classic/agents';
import { pull } from '@langchain/classic/hub';
import logger from '../../logger.ts';
import templateDbService from '../templateDbService.ts';
import mcpService from '../mcpService.ts';
import environmentDbService from '../environmentDbService.ts';
import dotenv from 'dotenv';

dotenv.config();

export interface AIProvider {
  name: string;
  model: any;
  supportsVision: boolean;
  priority: number;
}

export interface ContentGenerationOptions {
  promptTemplateFormatter?: Record<string, any>;
  images?: any;
  promptTemplateIdentifier?: string;
  streaming?: boolean;
  useMCPAgent?: boolean;
  preferredProvider?: string | null;
}

/**
 * Base LangChain service class that handles provider initialization and common functionality
 */
export class BaseLangChainService {
  providers: AIProvider[];
  mcpClient: any;
  mcpAgents: Map<string, any>;
  private _initializingPromise: Promise<void> | null;

  constructor() {
    this.providers = [];
    this.mcpClient = null;
    this.mcpAgents = new Map();
    this._initializingPromise = null;
  }

  /**
   * Initialize AI providers based on environment configuration
   */
  async initializeProviders(): Promise<void> {
    if (this._initializingPromise) {
      return this._initializingPromise;
    }

    this._initializingPromise = (async () => {
      try {
        const newProviders: AIProvider[] = [];
        const settings = await environmentDbService.getSettings();

        // 1. OpenAI (Official ChatGPT API)
        if (process.env.OPENAI_API_KEY) {
          const temperature = parseFloat(settings.OPENAI_TEMPERATURE || '0');
          newProviders.push({
            name: 'OpenAI ChatGPT',
            model: new ChatOpenAI({
              openAIApiKey: process.env.OPENAI_API_KEY,
              modelName: process.env.OPENAI_MODEL || 'gpt-4-vision-preview',
              temperature,
            }),
            supportsVision: this.modelSupportsVision(process.env.OPENAI_MODEL || 'gpt-4-vision-preview'),
            priority: 1,
          });
          logger.info(`OpenAI ChatGPT provider initialized with temperature: ${temperature}`);
        }

        // 2. OpenAI-Compatible APIs
        if (process.env.OPENAI_COMPATIBLE_BASE_URL && process.env.OPENAI_COMPATIBLE_API_KEY) {
          const temperature = parseFloat(settings.OPENAI_COMPATIBLE_TEMPERATURE || '0');
          newProviders.push({
            name: 'OpenAI Compatible',
            model: new ChatOpenAI({
              apiKey: process.env.OPENAI_COMPATIBLE_API_KEY,
              model: process.env.OPENAI_COMPATIBLE_MODEL || 'claude-3-sonnet-20240229',
              temperature,
              configuration: {
                baseURL: process.env.OPENAI_COMPATIBLE_BASE_URL,
              },
            }),
            supportsVision: this.modelSupportsVision(process.env.OPENAI_COMPATIBLE_MODEL),
            priority: 2,
          });
          logger.info(`OpenAI Compatible provider initialized with temperature: ${temperature}`);
        }

        // 3. Google Gemini
        if (process.env.GOOGLE_API_KEY) {
          try {
            const googleModel = process.env.GOOGLE_MODEL || 'gemini-1.5-flash';
            const temperature = parseFloat(settings.GOOGLE_TEMPERATURE || '0');

            newProviders.push({
              name: 'Google Gemini',
              model: new ChatGoogleGenerativeAI({
                apiKey: process.env.GOOGLE_API_KEY,
                model: googleModel,
                temperature,
              }),
              supportsVision: true,
              priority: 3,
            });

            logger.info(
              `Google Gemini provider initialized with model: ${googleModel}, temperature: ${temperature}`
            );
          } catch (error: any) {
            logger.error('Failed to initialize Google Gemini provider:', error.message);
          }
        }

        // 4. Ollama (Local models)
        if (process.env.OLLAMA_BASE_URL) {
          const temperature = parseFloat(settings.OLLAMA_TEMPERATURE || '0');
          newProviders.push({
            name: 'Ollama',
            model: new ChatOllama({
              baseUrl: process.env.OLLAMA_BASE_URL,
              model: process.env.OLLAMA_MODEL || 'llava',
              temperature,
            }),
            supportsVision: true,
            priority: 4,
          });
          logger.info(`Ollama provider initialized with temperature: ${temperature}`);
        }

        newProviders.sort((a, b) => a.priority - b.priority);

        const seenNames = new Set<string>();
        this.providers = newProviders.filter(p => {
          if (seenNames.has(p.name)) return false;
          seenNames.add(p.name);
          return true;
        });

        logger.info(
          `Initialized ${this.providers.length} AI providers: ${this.providers.map(p => p.name).join(', ')}`
        );

        await this.initializeMCPClients();
      } finally {
        this._initializingPromise = null;
      }
    })();

    return this._initializingPromise;
  }

  async initializeMCPClients(): Promise<void> {
    try {
      const mcpClients = await mcpService.getEnabledClients();

      if (mcpClients.length === 0) {
        logger.info('No enabled MCP clients found');
        return;
      }

      const mcpClientConfig = this.createMCPClientConfig(mcpClients);
      this.mcpClient = new MultiServerMCPClient(mcpClientConfig);

      await this.connectMCPClient();
      await this.createMCPAgent();

      logger.info(`Initialized ${mcpClients.length} MCP clients: ${mcpClients.map(c => c.name).join(', ')}`);
    } catch (error: any) {
      logger.error('Failed to initialize MCP clients:', error);
    }
  }

  createMCPClientConfig(mcpClients: any[]): any {
    if (mcpClients.length === 1) {
      return BaseLangChainService.createSingleClientConfig(mcpClients[0]);
    } else {
      return BaseLangChainService.createMultipleClientsConfig(mcpClients);
    }
  }

  static createSingleClientConfig(client: any): any {
    const serverConfig: any = {};

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
        [client.name.toLowerCase().replace(/[^a-z0-9]/g, '_')]: serverConfig,
      },
    };
  }

  static createMultipleClientsConfig(mcpClients: any[]): any {
    const mcpServers: Record<string, any> = {};

    mcpClients.forEach(client => {
      const serverConfig: any = {};

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

      const serverKey = client.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      mcpServers[serverKey] = serverConfig;
    });

    return { mcpServers };
  }

  async connectMCPClient(): Promise<void> {
    if (typeof this.mcpClient.connect === 'function') {
      await this.mcpClient.connect();
    } else if (typeof this.mcpClient.initialize === 'function') {
      await this.mcpClient.initialize();
    }
  }

  async createMCPAgent(): Promise<void> {
    if (this.providers.length === 0) {
      logger.warn('No providers available for MCP agent creation');
      return;
    }

    try {
      logger.info('Attempting to load MCP tools...');
      const mcpTools = await this.mcpClient.getTools();
      logger.info('MCP tools loaded successfully:', mcpTools.length);

      const prompt: any = await pull('hwchase17/react');

      for (const provider of this.providers) {
        try {
          const mcpAgent = await createReactAgent({
            llm: provider.model,
            tools: mcpTools,
            prompt,
          });

          this.mcpAgents.set(provider.name, mcpAgent);
          logger.info(`MCP React agent created successfully for provider: ${provider.name}`);
        } catch (agentError: any) {
          logger.warn(`Failed to create MCP agent for provider ${provider.name}:`, agentError.message);
        }
      }

      logger.info(`Created ${this.mcpAgents.size} MCP agents out of ${this.providers.length} providers`);
    } catch (agentError: any) {
      logger.warn('Failed to create React agents, MCP tools will be available directly:', agentError.message);
      logger.debug('Full error:', agentError);
    }
  }

  modelSupportsVision(modelName?: string): boolean {
    if (!modelName) return false;
    return (
      modelName.includes('vision') ||
      modelName.includes('gpt-4') ||
      modelName.includes('claude-3') ||
      modelName.includes('llava') ||
      modelName.includes('gemini')
    );
  }

  async createPromptTemplate(issueType?: string, hasImages?: boolean): Promise<PromptTemplate> {
    try {
      await templateDbService.init();

      const template = issueType ? await templateDbService.getActiveTemplate(issueType) : null;
      let templateString: string;

      if (template && template.content) {
        templateString = template.content;
        logger.info(`Using template for ${issueType}: ${template.name}`);
      } else {
        logger.warn(`No template found for ${issueType}, using basic fallback`);
        templateString = `{prompt} - Generate a detailed ${issueType || 'content'} description based on the provided information.`;
      }

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
    } catch (error: any) {
      logger.error(`Error creating prompt template for ${issueType}:`, error);
      return PromptTemplate.fromTemplate(
        `{prompt} - Generate a detailed ${issueType || 'content'} description based on the provided information.`
      );
    }
  }

  prepareMessageContent(prompt: string, images?: any): any {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return prompt;
    }

    try {
      const imageContent = images
        .filter(image => image && typeof image === 'string')
        .map(image => {
          let base64Data = image;
          let mediaType = 'image/jpeg';

          if (image.startsWith('data:')) {
            const [header, data] = image.split(',');
            base64Data = data;
            const mediaTypeMatch = header.match(/data:([^;]+)/);
            if (mediaTypeMatch) {
              [, mediaType] = mediaTypeMatch;
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
    } catch (error: any) {
      logger.warn(`Error preparing message content with images: ${error.message}`);
      return prompt;
    }
  }

  async generateContent({
    promptTemplateFormatter,
    images,
    promptTemplateIdentifier,
    streaming = false,
    useMCPAgent = false,
    preferredProvider = null,
  }: ContentGenerationOptions): Promise<any> {
    const normalizedImages = Array.isArray(images) ? images : images ? [images] : [];
    const hasImages = normalizedImages.length > 0;

    logger.debug('generateContent called with:', {
      hasImages,
      imagesCount: normalizedImages.length,
      imagesType: typeof images,
      useMCPAgent,
      preferredProvider,
    });

    if (this.providers.length === 0) {
      throw new Error('No AI providers are configured');
    }

    const promptTemplate = await this.createPromptTemplate(promptTemplateIdentifier, hasImages);
    const formattedPrompt = await promptTemplate.format({
      ...promptTemplateFormatter,
    });

    if (useMCPAgent && this.mcpAgents.size > 0) {
      const mcpResult = await this.tryMCPAgent({
        formattedPrompt,
        images: normalizedImages,
        hasImages,
        streaming,
        preferredProvider,
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
      preferredProvider,
    });
  }

  async tryMCPAgent({
    formattedPrompt,
    images,
    hasImages,
    streaming,
    preferredProvider,
  }: {
    formattedPrompt: string;
    images: any[];
    hasImages: boolean;
    streaming: boolean;
    preferredProvider?: string | null;
  }): Promise<any> {
    try {
      const { selectedAgent, selectedProviderName } = this.selectMCPAgent(preferredProvider);

      if (selectedAgent) {
        return await this.invokeMCPAgent({
          agent: selectedAgent,
          providerName: selectedProviderName!,
          formattedPrompt,
          images,
          hasImages,
          streaming,
        });
      }
    } catch (error: any) {
      logger.warn(`MCP agent failed, falling back to regular providers: ${error.message}`);
    }

    return null;
  }

  selectMCPAgent(preferredProvider?: string | null): { selectedAgent: any; selectedProviderName: string | null } {
    let selectedAgent: any = null;
    let selectedProviderName: string | null = null;

    if (preferredProvider && this.mcpAgents.has(preferredProvider)) {
      selectedAgent = this.mcpAgents.get(preferredProvider);
      selectedProviderName = preferredProvider;
    } else {
      const firstEntry = this.mcpAgents.entries().next().value;
      if (firstEntry) {
        [selectedProviderName, selectedAgent] = firstEntry;
      }
    }

    return { selectedAgent, selectedProviderName };
  }

  async invokeMCPAgent({
    agent,
    providerName,
    formattedPrompt,
    images,
    hasImages,
    streaming,
  }: {
    agent: any;
    providerName: string;
    formattedPrompt: string;
    images: any[];
    hasImages: boolean;
    streaming: boolean;
  }): Promise<any> {
    logger.info(`Using MCP agent for provider: ${providerName}`);

    let mcpPrompt = formattedPrompt;
    if (hasImages && images && images.length > 0) {
      mcpPrompt += `\n\nNote: ${images.length} image(s) were provided with this request. The images contain visual context that may be relevant to the task.`;
    }

    if (streaming) {
      const stream = agent.streamEvents({
        input: mcpPrompt,
      });
      return { content: stream, provider: `MCP Agent (${providerName})`, usedMCP: true };
    } else {
      const response = await agent.invoke({
        input: mcpPrompt,
      });
      return { content: response.output, provider: `MCP Agent (${providerName})`, usedMCP: true };
    }
  }

  async generateWithProviders({
    formattedPrompt,
    images,
    hasImages,
    streaming,
    preferredProvider = null,
  }: {
    formattedPrompt: string;
    images: any[];
    hasImages: boolean;
    streaming: boolean;
    preferredProvider?: string | null;
  }): Promise<any> {
    logger.info(`generateWithProviders called with ${this.providers.length} providers available`);

    if (preferredProvider) {
      const provider = this.providers.find(p => p.name === preferredProvider);
      if (provider) {
        try {
          logger.info(`Trying preferred provider: ${preferredProvider}`);
          const result = await this.tryProvider({ provider, formattedPrompt, images, hasImages, streaming });
          if (result) return result;
        } catch (error: any) {
          logger.warn(`Preferred provider ${preferredProvider} failed: ${error.message}`);
        }
      } else {
        logger.warn(`Preferred provider ${preferredProvider} not found in available providers`);
      }
    }

    let lastError: any = null;
    for (const provider of this.providers) {
      if (preferredProvider && provider.name === preferredProvider) {
        continue;
      }

      try {
        logger.info(`Attempting provider: ${provider.name} (priority: ${provider.priority})`);
        const result = await this.tryProvider({ provider, formattedPrompt, images, hasImages, streaming });
        if (result) return result;
      } catch (error: any) {
        lastError = error;
        logger.warn(`Provider ${provider.name} failed: ${error.message}`);
        continue;
      }
    }

    const providerNames = this.providers.map(p => p.name).join(', ');
    throw new Error(
      `All ${this.providers.length} providers failed (${providerNames}). Last error: ${lastError?.message || 'Unknown error'}`
    );
  }

  async tryProvider({
    provider,
    formattedPrompt,
    images,
    hasImages,
    streaming,
  }: {
    provider: AIProvider;
    formattedPrompt: string;
    images: any[];
    hasImages: boolean;
    streaming: boolean;
  }): Promise<any> {
    logger.info(`Trying provider: ${provider.name}`);

    try {
      const useImages = hasImages && provider.supportsVision;
      let messageContent: any;

      if (useImages) {
        logger.debug(`Preparing message content with images for ${provider.name}`);
        messageContent = this.prepareMessageContent(formattedPrompt, images);
      } else {
        messageContent = formattedPrompt;
        if (hasImages && !provider.supportsVision) {
          messageContent += " (note: images were provided but this model doesn't support vision)";
        }
      }

      if (provider.name === 'Google Gemini') {
        if (!messageContent || (typeof messageContent === 'string' && messageContent.trim().length < 3)) {
          throw new Error('Prompt too short for Google Gemini');
        }

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
    } catch (error: any) {
      const errorInfo: any = {
        error: error.message,
        provider: provider.name,
        hasImages,
        imagesType: typeof images,
        imagesLength: Array.isArray(images) ? images.length : 'not array',
        messageContentType: typeof formattedPrompt,
        promptLength: typeof formattedPrompt === 'string' ? formattedPrompt.length : 'not string',
      };

      if (provider.name === 'Google Gemini') {
        errorInfo.modelName = provider.model.modelName;
        errorInfo.apiKeyPresent = !!process.env.GOOGLE_API_KEY;
      }

      logger.error(`Error in tryProvider for ${provider.name}:`, errorInfo);
      throw error;
    }
  }

  getAvailableProviders(): any {
    return {
      providers: this.providers.map(p => ({
        name: p.name,
        model: p.model?.modelName || p.model?.model || '',
        supportsVision: p.supportsVision,
        priority: p.priority,
        mcpAgentAvailable: this.mcpAgents.has(p.name),
      })),
      mcpAgents: {
        available: this.mcpAgents.size > 0,
        count: this.mcpAgents.size,
        providers: Array.from(this.mcpAgents.keys()),
        clientsConnected: Boolean(this.mcpClient),
      },
    };
  }

  getMCPAgent(providerName: string): any {
    return this.mcpAgents.get(providerName) || null;
  }

  hasMCPAgent(providerName: string): boolean {
    return this.mcpAgents.has(providerName);
  }

  async updateTemperatureSettings(temperatureSettings: Record<string, any> | null = null): Promise<void> {
    try {
      const settings = temperatureSettings || (await environmentDbService.getSettings());

      this.providers.forEach(provider => {
        let newTemperature = 0;

        switch (provider.name) {
          case 'OpenAI ChatGPT':
            newTemperature = parseFloat(settings.OPENAI_TEMPERATURE || '0');
            break;
          case 'OpenAI Compatible':
            newTemperature = parseFloat(settings.OPENAI_COMPATIBLE_TEMPERATURE || '0');
            break;
          case 'Google Gemini':
            newTemperature = parseFloat(settings.GOOGLE_TEMPERATURE || '0');
            break;
          case 'Ollama':
            newTemperature = parseFloat(settings.OLLAMA_TEMPERATURE || '0');
            break;
          default:
            logger.warn(`Unknown provider for temperature update: ${provider.name}`);
            return;
        }

        if (provider.model && typeof provider.model.temperature !== 'undefined') {
          const oldTemperature = provider.model.temperature;
          provider.model.temperature = newTemperature;
          logger.info(`Updated ${provider.name} temperature from ${oldTemperature} to ${newTemperature}`);
        } else {
          logger.warn(`Cannot update temperature for ${provider.name} - model doesn't support temperature updates`);
        }
      });

      logger.info('Temperature settings updated for all applicable providers');
    } catch (error: any) {
      logger.error('Failed to update temperature settings:', error);
      throw error;
    }
  }

  getCurrentTemperatureSettings(): Record<string, number> {
    const temperatures: Record<string, number> = {};

    this.providers.forEach(provider => {
      if (provider.model && typeof provider.model.temperature !== 'undefined') {
        temperatures[provider.name] = provider.model.temperature;
      }
    });

    return temperatures;
  }

  async cleanup(): Promise<void> {
    if (this.mcpAgents.size > 0) {
      logger.info(`Cleaning up ${this.mcpAgents.size} MCP agents`);
      this.mcpAgents.clear();
    }

    if (this.mcpClient) {
      try {
        if (typeof this.mcpClient.disconnect === 'function') {
          await this.mcpClient.disconnect();
        } else if (typeof this.mcpClient.close === 'function') {
          await this.mcpClient.close();
        }
        logger.info('MCP client disconnected');
      } catch (error: any) {
        logger.error('Error disconnecting MCP client:', error);
      }
    }
  }
}

export default new BaseLangChainService();
