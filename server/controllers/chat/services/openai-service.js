import axios from 'axios';
import logger from '../../../logger.js';
import { ChatProviderConfig } from '../utils/chat-config.js';

/**
 * OpenAI Compatible Service - Handles OpenAI API compatible interactions
 * Follows service pattern with static methods for stateless operations
 */
class OpenAIService {
  /**
   * Generate chat response using OpenAI compatible API
   * @param {Object} messageData - Formatted message data for OpenAI
   * @returns {Promise<string>} AI response content
   */
  static async generateResponse(messageData) {
    const config = ChatProviderConfig.getOpenAIConfig();

    logger.info(
      `Making OpenAI compatible API request to: ${config.baseUrl}/chat/completions`
    );
    logger.info(`Using model: ${config.model}`);

    const requestPayload = {
      model: config.model,
      ...messageData,
    };

    try {
      const response = await axios.post(
        `${config.baseUrl}/chat/completions`,
        requestPayload,
        {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60 second timeout
        }
      );

      logger.info(`OpenAI compatible API response status: ${response.status}`);
      return response.data.choices[0].message.content;
    } catch (error) {
      this._handleApiError(error);
    }
  }

  /**
   * Generate streaming chat response using OpenAI compatible API
   * @param {Object} messageData - Formatted message data for OpenAI
   * @returns {Promise<Object>} Axios response stream
   */
  static async generateStreamingResponse(messageData) {
    const config = ChatProviderConfig.getOpenAIConfig();

    const requestPayload = {
      model: config.model,
      ...messageData,
      stream: true,
    };

    try {
      const response = await axios.post(
        `${config.baseUrl}/chat/completions`,
        requestPayload,
        {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
          timeout: 60000,
        }
      );

      return response;
    } catch (error) {
      this._handleApiError(error);
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
      logger.error(
        `OpenAI compatible API error - Status: ${error.response.status}`
      );
      logger.error(
        `Error data: ${JSON.stringify(error.response.data, null, 2)}`
      );

      // Provide more specific error messages based on status code
      if (error.response.status === 400) {
        throw new Error(
          `Bad Request (400): ${error.response.data?.error?.message || 'Invalid request format or parameters'}`
        );
      } else if (error.response.status === 401) {
        throw new Error(
          `Unauthorized (401): Invalid API key or authentication failed`
        );
      } else if (error.response.status === 429) {
        throw new Error(
          `Rate Limited (429): Too many requests, please try again later`
        );
      } else {
        throw new Error(
          `API Error (${error.response.status}): ${error.response.data?.error?.message || error.message}`
        );
      }
    } else if (error.request) {
      logger.error(`Network error: ${error.message}`);
      throw new Error(
        `Network error: Unable to reach OpenAI compatible server`
      );
    } else {
      logger.error(`Request setup error: ${error.message}`);
      throw new Error(`Request error: ${error.message}`);
    }
  }
}

export default OpenAIService;
