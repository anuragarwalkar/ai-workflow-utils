import { BaseLangChainService } from './BaseLangChainService.ts';
import { z } from 'zod';
import { OutputFixingParser, StructuredOutputParser } from '@langchain/classic/output_parsers';
import logger from '../../logger.ts';

const ApiRequestSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).describe('HTTP method'),
  url: z.string().describe('Complete URL for the API request'),
  headers: z.object({}).passthrough().optional().describe('HTTP headers as key-value pairs'),
  params: z.object({}).passthrough().optional().describe('Query parameters as key-value pairs'),
  body: z.any().optional().describe('Request body data'),
  bodyType: z.enum(['json', 'form-data', 'x-www-form-urlencoded', 'raw']).optional().describe('Type of request body'),
  auth: z
    .object({
      type: z.enum(['bearer', 'basic', 'apikey', 'none']).optional(),
      token: z.string().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
      apiKey: z.string().optional(),
      apiKeyHeader: z.string().optional(),
    })
    .optional()
    .describe('Authentication configuration'),
  description: z.string().optional().describe('Human-readable description of what this API call does'),
});

export class LangChainApiClientService extends BaseLangChainService {
  outputParser: StructuredOutputParser<typeof ApiRequestSchema>;
  fixingParser: any;

  constructor() {
    super();
    this.outputParser = StructuredOutputParser.fromZodSchema(ApiRequestSchema);
    this.fixingParser = null;
  }

  async initialize(): Promise<void> {
    await this.initializeProviders();

    if (this.providers.length > 0) {
      this.fixingParser = OutputFixingParser.fromLLM(this.providers[0].model, this.outputParser);
    }

    logger.info('LangChain API Client Service initialized');
  }

  async convertNaturalLanguageToApiRequest(naturalLanguagePrompt: string, streamCallback: any = null): Promise<any> {
    try {
      if (this.providers.length === 0) {
        throw new Error('No AI providers are configured');
      }

      const template = await this.getApiClientTemplate();
      const prompt = await template.format({
        naturalLanguagePrompt,
        formatInstructions: this.outputParser.getFormatInstructions(),
      });

      logger.info('Converting natural language to API request:', {
        prompt: `${naturalLanguagePrompt.substring(0, 100)}...`,
      });

      const response = await this.generateApiResponse(prompt, streamCallback);
      const apiRequest = await this.parseAndEnhanceResponse(response.content);

      logger.info('Successfully converted natural language to API request', {
        method: apiRequest.method,
        url: apiRequest.url,
        provider: response.provider,
      });

      return {
        success: true,
        apiRequest,
        provider: response.provider,
        originalPrompt: naturalLanguagePrompt,
      };
    } catch (error: any) {
      logger.error('Error converting natural language to API request:', error);
      throw new Error(`Failed to convert natural language to API request: ${error.message}`);
    }
  }

  async generateApiResponse(prompt: string, streamCallback: any): Promise<any> {
    if (streamCallback && typeof streamCallback === 'function') {
      return this.generateStreamingResponse(prompt, streamCallback);
    } else {
      return this.generateWithProviders({ formattedPrompt: prompt, images: [], hasImages: false, streaming: false });
    }
  }

  async parseAndEnhanceResponse(response: string): Promise<any> {
    let parsedResponse: any;
    try {
      parsedResponse = await this.outputParser.parse(response);
    } catch (parseError: any) {
      logger.warn('Initial parsing failed, attempting to fix:', parseError.message);

      if (this.fixingParser) {
        parsedResponse = await this.fixingParser.parse(response);
      } else {
        throw new Error(`Failed to parse API request structure: ${parseError.message}`);
      }
    }

    return LangChainApiClientService.enhanceApiRequest(parsedResponse);
  }

  async generateStreamingResponse(prompt: string, streamCallback: any): Promise<any> {
    for (const provider of this.providers) {
      try {
        logger.info(`Streaming with provider: ${provider.name}`);

        const stream = await provider.model.stream([{ role: 'user', content: prompt }]);

        let fullResponse = '';
        for await (const chunk of stream) {
          const content = chunk.content || '';
          fullResponse += content;

          if (streamCallback) {
            streamCallback({
              type: 'chunk',
              content,
              fullContent: fullResponse,
              provider: provider.name,
            });
          }
        }

        if (streamCallback) {
          streamCallback({
            type: 'complete',
            fullContent: fullResponse,
            provider: provider.name,
          });
        }

        return { content: fullResponse, provider: provider.name };
      } catch (error: any) {
        logger.warn(`Streaming failed with provider ${provider.name}: ${error.message}`);

        if (provider === this.providers[this.providers.length - 1]) {
          throw error;
        }
        continue;
      }
    }
  }

  async getApiClientTemplate(): Promise<any> {
    return this.createPromptTemplate('API_CLIENT_NL', false);
  }

  static enhanceApiRequest(parsedRequest: any): any {
    const enhanced = {
      method: 'GET',
      url: '',
      headers: {},
      params: {},
      body: null,
      bodyType: 'json',
      auth: { type: 'none' },
      description: '',
      ...parsedRequest,
    };

    if (!enhanced.url) {
      throw new Error('URL is required for API request');
    }

    if (!enhanced.method) {
      enhanced.method = 'GET';
    }

    if (['POST', 'PUT', 'PATCH'].includes(enhanced.method.toUpperCase()) && enhanced.body) {
      if (!enhanced.headers['Content-Type'] && enhanced.bodyType === 'json') {
        enhanced.headers['Content-Type'] = 'application/json';
      }
    }

    return enhanced;
  }

  static validateApiRequest(apiRequest: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!apiRequest.url) {
      errors.push('URL is required');
    }

    if (!apiRequest.method) {
      errors.push('HTTP method is required');
    }

    const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    if (apiRequest.method && !validMethods.includes(apiRequest.method.toUpperCase())) {
      errors.push(`Invalid HTTP method: ${apiRequest.method}`);
    }

    try {
      new URL(apiRequest.url);
    } catch {
      errors.push('Invalid URL format');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  getServiceStatus(): any {
    return {
      ...this.getAvailableProviders(),
      outputParser: Boolean(this.outputParser),
      fixingParser: Boolean(this.fixingParser),
      ready: this.providers.length > 0,
    };
  }
}

const langchainApiClientService = new LangChainApiClientService();

export default langchainApiClientService;
