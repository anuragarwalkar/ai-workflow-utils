import ChatLangChainService from '../../../services/langchain/ChatLangChainService.js';
import { ChatResponse } from '../models/chat-response.js';
import logger from '../../../logger.js';

/**
 * Chat Service - Business logic for chat operations
 * Uses the extended ChatLangChainService for AI interactions
 */
/**
 * Generate AI response for a chat message
 * @param {Object} params - Chat parameters
 * @param {string} params.message - User message
 * @param {Array} params.conversationHistory - Previous conversation
 * @param {Object} params.options - Additional options
 * @returns {Promise<ChatResponse>} Chat response object
 */
export async function generateChatResponse({
  message,
  conversationHistory = [],
  options = {},
}) {
  try {
    logger.info('ChatService: Generating response');

    // Generate session ID if not provided
    const sessionId =
      options.sessionId ||
      `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // If conversation history is provided, add it to memory
    if (conversationHistory.length > 0) {
      await addConversationHistoryToMemory(
        sessionId,
        conversationHistory,
      );
    }

    // Generate response using ChatLangChainService
    const result = await ChatLangChainService.generateChatResponse(
      sessionId,
      message,
      options,
    );

    // Create and return ChatResponse object
    return new ChatResponse({
      content: result.content,
      sessionId: result.sessionId,
      provider: result.provider,
      timestamp: result.timestamp,
      success: result.success,
    });
  } catch (error) {
    logger.error('ChatService: Error generating response:', error);

    // Return error response
    return new ChatResponse({
      content:
        'I apologize, but I encountered an error while processing your message. Please try again.',
      success: false,
      error: error.message,
    });
  }
}

/**
 * Add conversation history to memory (if supported by provider)
 * @param {string} sessionId
 * @param {Array} conversationHistory
 */
export async function addConversationHistoryToMemory(_sessionId, _conversationHistory) {
  // Implement memory logic if needed, or leave as a stub for now
  // This can be extended for providers that support memory
  return Promise.resolve();
}

/**
 * Generate streaming AI response for a chat message
 * @param {Object} params - Chat parameters
 * @param {string} params.message - User message
 * @param {Array} params.conversationHistory - Previous conversation
 * @param {Object} params.options - Additional options
 * @param {Object} res - Express response object for streaming
 */
export async function generateStreamingResponse({
  message,
  conversationHistory = [],
  options = {},
}, res) {
  try {
    logger.info('ChatService: Generating streaming response');

    // Generate session ID if not provided
    const sessionId =
      options.sessionId ||
      `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // If conversation history is provided, add it to memory
    if (conversationHistory.length > 0) {
      await addConversationHistoryToMemory(
        sessionId,
        conversationHistory,
      );
    }

    // Import streaming processor functions
    const { sendChunk, sendComplete, sendStatus } = await import('../processors/streaming-processor.js');

    // Send initial status
    sendStatus(res, 'Starting chat response...', 'Initializing');

    // Create onToken callback for streaming
    const onToken = (content) => {
      sendChunk(res, content);
    };

    // Generate streaming response using ChatLangChainService
    const result = await ChatLangChainService.generateStreamingChatResponse(
      sessionId,
      message,
      onToken,
      options,
    );

    // Send completion message
    sendComplete(res, result.content, result.provider);

  } catch (error) {
    logger.error('ChatService: Error generating streaming response:', error);
    throw error;
  }
}

/**
 * Get conversation history for a session
 * @param {string} sessionId - Session identifier
 * @returns {Promise<Array>} Conversation history
 */
export async function getConversationHistory(sessionId) {
  try {
    logger.info(`ChatService: Getting conversation history for session ${sessionId}`);
    return await ChatLangChainService.getConversationHistory(sessionId);
  } catch (error) {
    logger.error('ChatService: Error getting conversation history:', error);
    return [];
  }
}

/**
 * Clear conversation memory for a session
 * @param {string} sessionId - Session identifier
 */
export function clearConversationMemory(sessionId) {
  try {
    logger.info(`ChatService: Clearing conversation memory for session ${sessionId}`);
    ChatLangChainService.clearConversationMemory(sessionId);
  } catch (error) {
    logger.error('ChatService: Error clearing conversation memory:', error);
    throw error;
  }
}

/**
 * Get chat service statistics
 * @returns {Object} Chat statistics
 */
export function getChatStats() {
  try {
    logger.info('ChatService: Getting chat statistics');
    return ChatLangChainService.getChatStats();
  } catch (error) {
    logger.error('ChatService: Error getting chat statistics:', error);
    return {
      totalMessages: 0,
      totalSessions: 0,
      errors: 0,
    };
  }
}

/**
 * Test chat functionality with specific message and provider
 * @param {string} testMessage - Test message
 * @param {string} provider - Provider to test (optional)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Test result
 */
export async function testChatFunctionality(testMessage, provider, options = {}) {
  try {
    logger.info('ChatService: Testing chat functionality');
    return await ChatLangChainService.testChatFunctionality(testMessage, provider, options);
  } catch (error) {
    logger.error('ChatService: Error testing chat functionality:', error);
    throw error;
  }
}

