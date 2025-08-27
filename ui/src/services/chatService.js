/**
 * Chat service for AI Chat Assistant functionality
 * Handles all API interactions with the chat backend endpoints
 */

import axios from 'axios';
import { createLogger } from '../utils/log.js';

const logger = createLogger('ChatService');

// Base URL for chat endpoints
const BASE_URL = import.meta.env.PROD 
  ? '/api/chat' 
  : 'http://localhost:3000/api/chat';

/**
 * Send a regular chat message
 * @param {string} message - The message to send
 * @param {string} sessionId - Optional session ID for conversation continuity
 * @returns {Promise<object>} Response with AI message
 */
export const sendChatMessage = async (message, sessionId = null) => {
  logger.info('sendChatMessage', 'Sending chat message', { 
    messageLength: message.length, 
    sessionId 
  });

  try {
    const response = await axios.post(`${BASE_URL}/message`, {
      message,
      sessionId,
    });

    logger.info('sendChatMessage', 'Received response', { 
      responseId: response.data.id 
    });

    return response.data;
  } catch (error) {
    logger.error('sendChatMessage', 'Failed to send message', error);
    throw error;
  }
};

/**
 * Process streaming chunks from response
 * @param {ReadableStreamDefaultReader} reader - Stream reader
 * @param {function} onChunk - Callback for chunks
 */
const processStreamingResponse = async (reader, onChunk) => {
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          onChunk(data);
        } catch (parseError) {
          logger.error('processStreamingResponse', 'Failed to parse chunk', parseError);
        }
      }
    }
  }
};

/**
 * Send a streaming chat message
 * @param {string} message - The message to send
 * @param {string} sessionId - Optional session ID for conversation continuity
 * @param {function} onChunk - Callback for receiving streaming chunks
 * @returns {Promise<void>}
 */
export const sendStreamingChatMessage = async (message, sessionId = null, onChunk) => {
  logger.info('sendStreamingChatMessage', 'Starting streaming chat', { 
    messageLength: message.length, 
    sessionId 
  });

  try {
    const response = await fetch(`${BASE_URL}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    await processStreamingResponse(reader, onChunk);

    logger.info('sendStreamingChatMessage', 'Streaming completed');
  } catch (error) {
    logger.error('sendStreamingChatMessage', 'Streaming failed', error);
    throw error;
  }
};

/**
 * Get chat configuration
 * @returns {Promise<object>} Chat configuration
 */
export const getChatConfig = async () => {
  logger.info('getChatConfig', 'Fetching chat configuration');

  try {
    const response = await axios.get(`${BASE_URL}/config`);
    return response.data;
  } catch (error) {
    logger.error('getChatConfig', 'Failed to fetch config', error);
    throw error;
  }
};

/**
 * Check provider health
 * @returns {Promise<object>} Health status
 */
export const checkProviderHealth = async () => {
  logger.info('checkProviderHealth', 'Checking provider health');

  try {
    const response = await axios.get(`${BASE_URL}/health`);
    return response.data;
  } catch (error) {
    logger.error('checkProviderHealth', 'Health check failed', error);
    throw error;
  }
};

/**
 * Get chat statistics
 * @returns {Promise<object>} Chat statistics
 */
export const getChatStats = async () => {
  logger.info('getChatStats', 'Fetching chat statistics');

  try {
    const response = await axios.get(`${BASE_URL}/stats`);
    return response.data;
  } catch (error) {
    logger.error('getChatStats', 'Failed to fetch stats', error);
    throw error;
  }
};

/**
 * Get conversation history
 * @param {string} sessionId - Session ID to fetch history for
 * @returns {Promise<object>} Conversation history
 */
export const getConversationHistory = async (sessionId) => {
  logger.info('getConversationHistory', 'Fetching conversation history', { sessionId });

  try {
    const response = await axios.get(`${BASE_URL}/conversation/${sessionId}`);
    return response.data;
  } catch (error) {
    logger.error('getConversationHistory', 'Failed to fetch history', error);
    throw error;
  }
};

/**
 * Clear conversation memory
 * @param {string} sessionId - Session ID to clear
 * @returns {Promise<object>} Clear confirmation
 */
export const clearConversationMemory = async (sessionId) => {
  logger.info('clearConversationMemory', 'Clearing conversation memory', { sessionId });

  try {
    const response = await axios.delete(`${BASE_URL}/conversation/${sessionId}`);
    return response.data;
  } catch (error) {
    logger.error('clearConversationMemory', 'Failed to clear memory', error);
    throw error;
  }
};

/**
 * Test chat functionality
 * @param {object} testData - Test configuration
 * @returns {Promise<object>} Test results
 */
export const testChatFunctionality = async (testData) => {
  logger.info('testChatFunctionality', 'Testing chat functionality');

  try {
    const response = await axios.post(`${BASE_URL}/test`, testData);
    return response.data;
  } catch (error) {
    logger.error('testChatFunctionality', 'Test failed', error);
    throw error;
  }
};

// Placeholder functions for future features

/**
 * Upload and process file attachment (placeholder)
 * @param {File} file - File to upload
 * @param {string} sessionId - Session ID
 * @returns {Promise<object>} Upload result
 */
export const uploadFileAttachment = async (file, sessionId) => {
  logger.info('uploadFileAttachment', 'File upload placeholder', { 
    fileName: file.name, 
    sessionId 
  });
  
  // TODO: Implement file upload functionality
  throw new Error('File upload not yet implemented');
};

/**
 * Process voice recording (placeholder)
 * @param {Blob} audioBlob - Audio recording
 * @param {string} sessionId - Session ID
 * @returns {Promise<object>} Voice processing result
 */
export const processVoiceRecording = async (audioBlob, sessionId) => {
  logger.info('processVoiceRecording', 'Voice processing placeholder', { sessionId });
  
  // TODO: Implement voice processing functionality
  throw new Error('Voice processing not yet implemented');
};

/**
 * Generate image from prompt (placeholder)
 * @param {string} prompt - Image generation prompt
 * @param {string} sessionId - Session ID
 * @returns {Promise<object>} Generated image result
 */
export const generateImage = async (prompt, sessionId) => {
  logger.info('generateImage', 'Image generation placeholder', { 
    promptLength: prompt.length, 
    sessionId 
  });
  
  // TODO: Implement image generation functionality
  throw new Error('Image generation not yet implemented');
};

/**
 * Perform web search (placeholder)
 * @param {string} query - Search query
 * @param {string} sessionId - Session ID
 * @returns {Promise<object>} Search results
 */
export const performWebSearch = async (query, sessionId) => {
  logger.info('performWebSearch', 'Web search placeholder', { 
    queryLength: query.length, 
    sessionId 
  });
  
  // TODO: Implement web search functionality
  throw new Error('Web search not yet implemented');
};
