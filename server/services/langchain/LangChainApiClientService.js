import { BaseLangChainService } from './BaseLangChainService.js';
import { z } from 'zod';
import { OutputFixingParser, StructuredOutputParser } from 'langchain/output_parsers';
import logger from '../../logger.js';

// Zod schema for API request structure
const ApiRequestSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).describe('HTTP method'),
  url: z.string().describe('Complete URL for the API request'),
  headers: z.object({}).passthrough().optional().describe('HTTP headers as key-value pairs'),
  params: z.object({}).passthrough().optional().describe('Query parameters as key-value pairs'),
  body: z.any().optional().describe('Request body data'),
  bodyType: z.enum(['json', 'form-data', 'x-www-form-urlencoded', 'raw']).optional().describe('Type of request body'),
  auth: z.object({
    type: z.enum(['bearer', 'basic', 'apikey', 'none']).optional(),
    token: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    apiKey: z.string().optional(),
    apiKeyHeader: z.string().optional()
  }).optional().describe('Authentication configuration'),
  description: z.string().optional().describe('Human-readable description of what this API call does')
});

/**
 * LangChain service specifically for API client natural language processing
 * Extends BaseLangChainService to leverage AI providers and MCP capabilities
 */
export class LangChainApiClientService extends BaseLangChainService {
  constructor() {
    super();
    this.outputParser = StructuredOutputParser.fromZodSchema(ApiRequestSchema);
    this.fixingParser = null;
  }

  /**
   * Initialize the service with providers and output parsers
   */
  async initialize() {
    await this.initializeProviders();
    
    // Create a fixing parser that can handle malformed outputs
    if (this.providers.length > 0) {
      this.fixingParser = OutputFixingParser.fromLLM(
        this.providers[0].model,
        this.outputParser
      );
    }
    
    logger.info('LangChain API Client Service initialized');
  }

  /**
   * Convert natural language to API request configuration
   */
  async convertNaturalLanguageToApiRequest(naturalLanguagePrompt, streamCallback = null) {
    try {
      if (this.providers.length === 0) {
        throw new Error('No AI providers are configured');
      }

      // Get the template for API client requests
      const template = await this.getApiClientTemplate();
      const prompt = await template.format({
        naturalLanguagePrompt,
        formatInstructions: this.outputParser.getFormatInstructions()
      });

      logger.info('Converting natural language to API request:', {
        prompt: `${naturalLanguagePrompt.substring(0, 100)}...`
      });

      // Generate response (streaming or regular)
      const response = await this.generateApiResponse(prompt, streamCallback);
      
      // Parse and enhance the response
      const apiRequest = await this.parseAndEnhanceResponse(response.content);

      logger.info('Successfully converted natural language to API request', {
        method: apiRequest.method,
        url: apiRequest.url,
        provider: response.provider
      });

      return {
        success: true,
        apiRequest,
        provider: response.provider,
        originalPrompt: naturalLanguagePrompt
      };

    } catch (error) {
      logger.error('Error converting natural language to API request:', error);
      throw new Error(`Failed to convert natural language to API request: ${error.message}`);
    }
  }

  /**
   * Generate API response with streaming or regular mode
   */
  async generateApiResponse(prompt, streamCallback) {
    if (streamCallback && typeof streamCallback === 'function') {
      return this.generateStreamingResponse(prompt, streamCallback);
    } else {
      return this.generateWithProviders(prompt, null, false, false);
    }
  }

  /**
   * Parse and enhance the AI response
   */
  async parseAndEnhanceResponse(response) {
    let parsedResponse;
    try {
      parsedResponse = await this.outputParser.parse(response);
    } catch (parseError) {
      logger.warn('Initial parsing failed, attempting to fix:', parseError.message);
      
      if (this.fixingParser) {
        parsedResponse = await this.fixingParser.parse(response);
      } else {
        throw new Error(`Failed to parse API request structure: ${parseError.message}`);
      }
    }

    return LangChainApiClientService.enhanceApiRequest(parsedResponse);
  }

  /**
   * Generate streaming response for real-time API request building
   */
  async generateStreamingResponse(prompt, streamCallback) {
    for (const provider of this.providers) {
      try {
        logger.info(`Streaming with provider: ${provider.name}`);

        const stream = await provider.model.stream([
          { role: 'user', content: prompt }
        ]);

        let fullResponse = '';
        for await (const chunk of stream) {
          const content = chunk.content || '';
          fullResponse += content;
          
          // Call the callback with incremental content
          if (streamCallback) {
            streamCallback({
              type: 'chunk',
              content,
              fullContent: fullResponse,
              provider: provider.name
            });
          }
        }

        // Signal completion
        if (streamCallback) {
          streamCallback({
            type: 'complete',
            fullContent: fullResponse,
            provider: provider.name
          });
        }

        return { content: fullResponse, provider: provider.name };

      } catch (error) {
        logger.warn(`Streaming failed with provider ${provider.name}: ${error.message}`);
        
        if (provider === this.providers[this.providers.length - 1]) {
          throw error;
        }
        continue;
      }
    }
  }

  /**
   * Get the template for API client natural language processing
   */
  async getApiClientTemplate() {
    return this.createPromptTemplate('API_CLIENT_NL', false);
  }

  /**
   * Enhance and validate the parsed API request
   */
  static enhanceApiRequest(parsedRequest) {
    // Set defaults
    const enhanced = {
      method: 'GET',
      url: '',
      headers: {},
      params: {},
      body: null,
      bodyType: 'json',
      auth: { type: 'none' },
      description: '',
      ...parsedRequest
    };

    // Validate required fields
    if (!enhanced.url) {
      throw new Error('URL is required for API request');
    }

    if (!enhanced.method) {
      enhanced.method = 'GET';
    }

    // Set appropriate content type for POST/PUT/PATCH with body
    if (['POST', 'PUT', 'PATCH'].includes(enhanced.method.toUpperCase()) && enhanced.body) {
      if (!enhanced.headers['Content-Type'] && enhanced.bodyType === 'json') {
        enhanced.headers['Content-Type'] = 'application/json';
      }
    }

    // Ensure body is properly formatted for JSON
    if (enhanced.bodyType === 'json' && enhanced.body && typeof enhanced.body === 'object') {
      // Body is already an object, which is good for our API client
    }

    return enhanced;
  }

  /**
   * Validate API request before execution
   */
  static validateApiRequest(apiRequest) {
    const errors = [];

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

    // Validate URL format
    try {
      new URL(apiRequest.url);
    } catch {
      errors.push('Invalid URL format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get service status and capabilities
   */
  getServiceStatus() {
    return {
      ...this.getAvailableProviders(),
      outputParser: !!this.outputParser,
      fixingParser: !!this.fixingParser,
      ready: this.providers.length > 0
    };
  }
}

// Create singleton instance
const langchainApiClientService = new LangChainApiClientService();

export default langchainApiClientService;
