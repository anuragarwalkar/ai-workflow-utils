import axios from 'axios';
import logger from '../../../logger.js';
import { ChatProviderConfig } from '../utils/chat-config.js';

/**
 * Ollama Service - Handles Ollama local LLM interactions
 * Follows service pattern with static methods for stateless operations
 */
class OllamaService {
  /**
   * Generate chat response using Ollama API
   * @param {Object} messageData - Formatted message data for Ollama
   * @returns {Promise<string>} AI response content
   */
  static async generateResponse(messageData) {
    const config = ChatProviderConfig.getOllamaConfig();
    
    logger.info(`Making Ollama API request to: ${config.baseUrl}/api/generate`);
    logger.info(`Using model: ${config.model}`);

    const requestPayload = {
      model: config.model,
      ...messageData
    };

    try {
      const response = await axios.post(`${config.baseUrl}/api/generate`, requestPayload, {
        timeout: 120000 // 2 minute timeout for local models
      });

      logger.info(`Ollama API response received`);
      return response.data?.response;
    } catch (error) {
      this._handleApiError(error);
    }
  }

  /**
   * Generate streaming chat response using Ollama API
   * @param {Object} messageData - Formatted message data for Ollama
   * @returns {Promise<Object>} Axios response stream
   */
  static async generateStreamingResponse(messageData) {
    const config = ChatProviderConfig.getOllamaConfig();

    const requestPayload = {
      model: config.model,
      ...messageData,
      stream: true
    };

    try {
      const response = await axios.post(`${config.baseUrl}/api/generate`, requestPayload, {
        responseType: 'stream',
        timeout: 120000
      });

      return response;
    } catch (error) {
      this._handleApiError(error);
    }
  }

  /**
   * Check if Ollama service is available
   * @returns {Promise<boolean>} True if Ollama is accessible
   */
  static async isAvailable() {
    try {
      const config = ChatProviderConfig.getOllamaConfig();
      const response = await axios.get(`${config.baseUrl}/api/tags`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      logger.warn(`Ollama service not available: ${error.message}`);
      return false;
    }
  }

  /**
   * Handle API errors with detailed logging and user-friendly messages
   * @private
   * @param {Error} error - Axios error object
   * @throws {Error} Processed error with user-friendly message
   */
  static _handleApiError(error) {
    if (error.response) {
      logger.error(`Ollama API error - Status: ${error.response.status}`);
      logger.error(`Error data: ${JSON.stringify(error.response.data, null, 2)}`);
      throw new Error(`Ollama API Error (${error.response.status}): ${error.response.data?.error || error.message}`);
    } else if (error.request) {
      logger.error(`Ollama network error: ${error.message}`);
      throw new Error(`Network error: Unable to reach Ollama server`);
    } else {
      logger.error(`Ollama request setup error: ${error.message}`);
      throw new Error(`Ollama request error: ${error.message}`);
    }
  }
}

export default OllamaService;
