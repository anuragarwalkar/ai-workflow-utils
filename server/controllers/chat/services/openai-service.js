import axios from 'axios';
import logger from '../../../logger.js';
import { ChatProviderConfig } from '../utils/chat-config.js';

/**
 * OpenAI Compatible Service - Handles OpenAI API compatible interactions
 * Follows service pattern with static methods for stateless operations
 */
/**
 * Generate chat response using OpenAI compatible API
 * @param {Object} messageData - Formatted message data for OpenAI
 * @returns {Promise<string>} AI response content
 */
export async function generateOpenAIResponse(messageData) {
  const config = ChatProviderConfig.getOpenAIConfig();

  logger.info(
    `Making OpenAI compatible API request to: ${config.baseUrl}/chat/completions`,
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
      },
    );

    logger.info(`OpenAI compatible API response status: ${response.status}`);
    return response.data.choices[0].message.content;
  } catch (error) {
    handleOpenAIServiceApiError(error);
  }
}

/**
 * Generate streaming chat response using OpenAI compatible API
 * @param {Object} messageData - Formatted message data for OpenAI
 * @returns {Promise<Object>} Axios response stream
 */
export async function generateOpenAIStreamingResponse(messageData) {
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
      },
    );
    return response;
  } catch (error) {
    handleOpenAIServiceApiError(error);
  }
}

function handleOpenAIServiceApiError(error) {
  logger.error('OpenAIService API error:', error);
  throw error;
}

