import axios from 'axios';
import logger from '../../../logger.js';
import { ChatProviderConfig } from '../utils/chat-config.js';

/**
 * Ollama Service - Handles Ollama local LLM interactions
 * Follows service pattern with static methods for stateless operations
 */
/**
 * Generate chat response using Ollama API
 * @param {Object} messageData - Formatted message data for Ollama
 * @returns {Promise<string>} AI response content
 */
export async function generateOllamaResponse(messageData) {
  const config = ChatProviderConfig.getOllamaConfig();

  logger.info(`Making Ollama API request to: ${config.baseUrl}/api/generate`);
  logger.info(`Using model: ${config.model}`);

  const requestPayload = {
    model: config.model,
    ...messageData,
  };

  try {
    const response = await axios.post(
      `${config.baseUrl}/api/generate`,
      requestPayload,
    );

    logger.info('Ollama API response received');
    return response.data?.response;
  } catch (error) {
    handleOllamaServiceApiError(error);
  }
}

/**
 * Generate streaming chat response using Ollama API
 * @param {Object} messageData - Formatted message data for Ollama
 * @returns {Promise<Object>} Axios response stream
 */
export async function generateOllamaStreamingResponse(messageData) {
  const config = ChatProviderConfig.getOllamaConfig();

  const requestPayload = {
    model: config.model,
    ...messageData,
    stream: true,
  };
  try {
    const response = await axios.post(
      `${config.baseUrl}/api/generate`,
      requestPayload,
      {
        responseType: 'stream',
      },
    );
    return response;
  } catch (error) {
    handleOllamaServiceApiError(error);
  }
}

function handleOllamaServiceApiError(error) {
  logger.error('OllamaService API error:', error);
  throw error;
}

