import ChatService from './services/chat-service.js';
import StreamingProcessor from './processors/streaming-processor.js';
import { ErrorHandler } from './utils/error-handler.js';
import logger from '../../logger.js';

/**
 * Chat Controller - Main orchestrator for chat operations
 * Follows modular architecture pattern with separation of concerns
 */
class ChatController {
  /**
   * Send chat message and get AI response
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async sendChatMessage(req, res) {
    try {
      const {
        message,
        conversationHistory = [],
        template = 'CHAT_GENERIC',
        sessionId,
      } = req.body;

      // Generate response using chat service
      const response = await ChatService.generateResponse({
        message,
        conversationHistory,
        options: { template, sessionId },
      });

      // Send response in standard API format
      res.json(response.toApiResponse());
    } catch (error) {
      ErrorHandler.handleApiError(error, 'sendChatMessage', res);
    }
  }

  /**
   * Send chat message with streaming response
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async sendChatMessageStreaming(req, res) {
    try {
      const {
        message,
        conversationHistory = [],
        template = 'CHAT_GENERIC',
        sessionId,
      } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'Message is required',
        });
      }

      // Set up Server-Sent Events headers
      StreamingProcessor.setupSSEHeaders(res);

      // Generate streaming response using chat service
      await ChatService.generateStreamingResponse(
        {
          message,
          conversationHistory,
          options: { template, sessionId },
        },
        res,
      );
    } catch (error) {
      logger.error('Error in streaming chat controller:', error);

      // Send error through streaming if headers are already sent
      if (res.headersSent) {
        StreamingProcessor.sendError(
          res,
          'Failed to process chat message. Please try again.',
          'sendChatMessageStreaming',
        );
      } else {
        ErrorHandler.handleApiError(error, 'sendChatMessageStreaming', res);
      }
    }

    res.end();
  }

  /**
   * Get chat configuration and available providers
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getChatConfig(req, res) {
    try {
      const { ChatProviderConfig } = await import('./utils/chat-config.js');

      const config = {
        availableProviders: ChatProviderConfig.getAvailableProviders(),
        openaiConfigValid: ChatProviderConfig.isOpenAIConfigValid(),
        ollamaConfigValid: ChatProviderConfig.isOllamaConfigValid(),
      };

      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'getChatConfig', res);
    }
  }

  /**
   * Health check for AI providers
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async checkProviderHealth(req, res) {
    try {
      const { OllamaService } = await import('./services/ollama-service.js');
      const { ChatProviderConfig } = await import('./utils/chat-config.js');

      const health = {
        openai: {
          configured: ChatProviderConfig.isOpenAIConfigValid(),
          status: ChatProviderConfig.isOpenAIConfigValid()
            ? 'ready'
            : 'not_configured',
        },
        ollama: {
          configured: ChatProviderConfig.isOllamaConfigValid(),
          status: 'checking...',
        },
      };

      // Check Ollama availability if configured
      if (health.ollama.configured) {
        const isAvailable = await OllamaService.isAvailable();
        health.ollama.status = isAvailable ? 'ready' : 'unavailable';
      } else {
        health.ollama.status = 'not_configured';
      }

      res.json({
        success: true,
        data: health,
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'checkProviderHealth', res);
    }
  }

  /**
   * Get conversation history for a session
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getConversationHistory(req, res) {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID is required',
        });
      }

      const history = await ChatService.getConversationHistory(sessionId);

      res.json({
        success: true,
        data: {
          sessionId,
          history,
        },
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'getConversationHistory', res);
    }
  }

  /**
   * Clear conversation memory for a session
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async clearConversationMemory(req, res) {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID is required',
        });
      }

      ChatService.clearConversationMemory(sessionId);

      res.json({
        success: true,
        data: {
          sessionId,
          message: 'Conversation memory cleared',
        },
      });
    } catch (error) {
      logger.error('Error in clearing conversation memory:', error);
      ErrorHandler.handleApiError(error, 'clearConversationMemory', res);
    }
  }

  /**
   * Test chat with specific template
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async testChatTemplate(req, res) {
    try {
      const { template = 'CHAT_GENERIC', message = 'Hello, can you help me?' } =
        req.body;

      const result = await ChatService.testChatFunctionality(message, null, {
        template,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'testChatTemplate', res);
    }
  }

  /**
   * Get chat service statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getChatStats(req, res) {
    try {
      const stats = ChatService.getChatStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'getChatStats', res);
    }
  }

  /**
   * Test chat functionality
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async testChatFunctionality(req, res) {
    try {
      const { testMessage, provider } = req.body;

      const result = await ChatService.testChatFunctionality(
        testMessage,
        provider,
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      ErrorHandler.handleApiError(error, 'testChatFunctionality', res);
    }
  }
}

export default ChatController;
