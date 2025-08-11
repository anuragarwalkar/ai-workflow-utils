/**
 * Chat Configuration Utility - Manages AI provider configurations
 * Follows utility pattern for common configuration operations
 */
export class ChatProviderConfig {
  /**
   * Get OpenAI compatible provider configuration
   * @returns {Object} OpenAI configuration object
   */
  static getOpenAIConfig() {
    return {
      baseUrl: process.env.OPENAI_COMPATIBLE_BASE_URL || 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_COMPATIBLE_API_KEY,
      model: process.env.OPENAI_COMPATIBLE_MODEL || 'gpt-3.5-turbo',
    };
  }

  /**
   * Get Ollama provider configuration
   * @returns {Object} Ollama configuration object
   */
  static getOllamaConfig() {
    return {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama2',
    };
  }

  /**
   * Validate OpenAI configuration
   * @returns {boolean} True if configuration is valid
   */
  static isOpenAIConfigValid() {
    const config = this.getOpenAIConfig();
    return !!(config.baseUrl && config.apiKey && config.model);
  }

  /**
   * Validate Ollama configuration
   * @returns {boolean} True if configuration is valid
   */
  static isOllamaConfigValid() {
    const config = this.getOllamaConfig();
    return !!(config.baseUrl && config.model);
  }

  /**
   * Get available providers based on configuration
   * @returns {Array<string>} Array of available provider names
   */
  static getAvailableProviders() {
    const providers = [];

    if (this.isOpenAIConfigValid()) {
      providers.push('OpenAI Compatible');
    }

    if (this.isOllamaConfigValid()) {
      providers.push('Ollama');
    }

    return providers;
  }
}

/**
 * Chat constants used throughout the chat module
 */
export const ChatConstants = {
  PROVIDERS: {
    OPENAI: 'OpenAI Compatible',
    OLLAMA: 'Ollama',
  },

  ERROR_TYPES: {
    VALIDATION: 'VALIDATION_ERROR',
    PROVIDER: 'PROVIDER_ERROR',
    NETWORK: 'NETWORK_ERROR',
    RATE_LIMIT: 'RATE_LIMIT_ERROR',
    AUTH: 'AUTH_ERROR',
  },

  TIMEOUTS: {
    OPENAI: 60000, // 60 seconds
    OLLAMA: 120000, // 2 minutes for local models
  },

  DEFAULTS: {
    MAX_TOKENS: 500,
    TEMPERATURE: 0.7,
    SYSTEM_MESSAGE:
      'You are a helpful AI assistant integrated into a workflow utility application. You can help users with general questions, provide guidance on using the application features, and assist with various tasks. Be concise and helpful in your responses.',
  },
};
