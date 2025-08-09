import ChatLangChainService from '../../../services/langchain/ChatLangChainService.js';
import { ChatResponse } from '../models/chat-response.js';
import logger from '../../../logger.js';

/**
 * Chat Service - Business logic for chat operations
 * Uses the extended ChatLangChainService for AI interactions
 */
class ChatService {
  /**
   * Generate AI response for a chat message
   * @param {Object} params - Chat parameters
   * @param {string} params.message - User message
   * @param {Array} params.conversationHistory - Previous conversation
   * @param {Object} params.options - Additional options
   * @returns {Promise<ChatResponse>} Chat response object
   */
  static async generateResponse({
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
        await this.addConversationHistoryToMemory(
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
        sessionId: options.sessionId || 'error_session',
        provider: 'error',
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Generate streaming AI response for a chat message
   * @param {Object} params - Chat parameters
   * @param {string} params.message - User message
   * @param {Array} params.conversationHistory - Previous conversation
   * @param {Object} params.options - Additional options
   * @param {Object} res - Express response object for streaming
   * @returns {Promise<void>}
   */
  static async generateStreamingResponse(
    { message, conversationHistory = [], options = {} },
    res,
  ) {
    try {
      logger.info('ChatService: Generating streaming response');

      // Generate session ID if not provided
      const sessionId =
        options.sessionId ||
        `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // If conversation history is provided, add it to memory
      if (conversationHistory.length > 0) {
        await this.addConversationHistoryToMemory(
          sessionId,
          conversationHistory,
        );
      }

      // Stream response using ChatLangChainService
      await ChatLangChainService.generateStreamingChatResponse(
        sessionId,
        message,
        token => {
          // Send each token through SSE
          res.write(
            `data: ${JSON.stringify({ type: 'token', content: token })}\n\n`,
          );
        },
        options,
      );

      // Send completion signal
      res.write(
        `data: ${JSON.stringify({
          type: 'complete',
          sessionId,
          timestamp: new Date().toISOString(),
        })}\n\n`,
      );
    } catch (error) {
      logger.error('ChatService: Error generating streaming response:', error);

      // Send error through stream
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          error: 'Failed to generate response. Please try again.',
          timestamp: new Date().toISOString(),
        })}\n\n`,
      );
    }
  }

  /**
   * Add conversation history to memory for a session
   * @param {string} sessionId - Session identifier
   * @param {Array} conversationHistory - Array of message objects
   */
  static async addConversationHistoryToMemory(sessionId, conversationHistory) {
    try {
      // Clear existing memory for this session
      ChatLangChainService.clearConversationMemory(sessionId);

      // Add history messages to memory
      for (const msg of conversationHistory) {
        if (msg.role === 'user') {
          await ChatLangChainService.conversationMemories
            .get(sessionId)
            ?.chatMemory?.addUserMessage(msg.content);
        } else if (msg.role === 'assistant') {
          await ChatLangChainService.conversationMemories
            .get(sessionId)
            ?.chatMemory?.addAIChatMessage(msg.content);
        }
      }

      logger.info(
        `Added ${conversationHistory.length} messages to memory for session ${sessionId}`,
      );
    } catch (error) {
      logger.warn('Failed to add conversation history to memory:', error);
    }
  }

  /**
   * Get conversation history for a session
   * @param {string} sessionId - Session identifier
   * @returns {Promise<Array>} Conversation history
   */
  static async getConversationHistory(sessionId) {
    try {
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
  static clearConversationMemory(sessionId) {
    try {
      ChatLangChainService.clearConversationMemory(sessionId);
      logger.info(`Cleared conversation memory for session: ${sessionId}`);
    } catch (error) {
      logger.error('ChatService: Error clearing conversation memory:', error);
    }
  }

  /**
   * Get chat service statistics
   * @returns {Object} Chat statistics
   */
  static getChatStats() {
    try {
      const langchainStats = ChatLangChainService.getChatStats();

      return {
        ...langchainStats,
        serviceStatus: 'active',
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('ChatService: Error getting chat stats:', error);
      return {
        serviceStatus: 'error',
        error: error.message,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * Test chat functionality
   * @param {string} testMessage - Test message
   * @param {string} providerName - Optional provider name to test
   * @param {Object} options - Additional options including template
   * @returns {Promise<Object>} Test result
   */
  static async testChatFunctionality(
    testMessage = 'Hello, can you help me?',
    providerName = null,
    options = {},
  ) {
    try {
      return await ChatLangChainService.testChatFunctionality(
        testMessage,
        providerName,
        options,
      );
    } catch (error) {
      logger.error('ChatService: Error testing chat functionality:', error);
      return {
        success: false,
        provider: providerName || 'unknown',
        error: error.message,
      };
    }
  }

  /**
   * Get available AI providers
   * @returns {Array} Array of available providers
   */
  static getAvailableProviders() {
    try {
      return ChatLangChainService.getAvailableProviders();
    } catch (error) {
      logger.error('ChatService: Error getting available providers:', error);
      return [];
    }
  }

  /**
   * Re-initialize providers (useful when configuration changes)
   */
  static reinitializeProviders() {
    try {
      ChatLangChainService.initializeProviders();
      logger.info('ChatService: Providers reinitialized');
    } catch (error) {
      logger.error('ChatService: Error reinitializing providers:', error);
    }
  }
}

export default ChatService;
