import { Request, Response } from 'express';
import {
  clearConversationMemory,
  generateChatResponse,
  generateStreamingResponse,
  getChatStats,
  getConversationHistory,
  testChatFunctionality,
} from './services/chat-service.js';
import { sendError, setupSSEHeaders } from './processors/streaming-processor.js';
import { ErrorHandler } from './utils/error-handler.js';
import logger from '../../logger.ts';

export async function sendChatMessage(req: Request, res: Response): Promise<void> {
  try {
    const { message, conversationHistory = [], template = 'CHAT_GENERIC', sessionId } = req.body;

    const response = await generateChatResponse({
      message,
      conversationHistory,
      options: { template, sessionId },
    });

    res.json(response.toApiResponse());
  } catch (error) {
    ErrorHandler.handleApiError(error, 'sendChatMessage', res);
  }
}

export async function sendChatMessageStreaming(req: Request, res: Response): Promise<void> {
  try {
    const { message, conversationHistory = [], template = 'CHAT_GENERIC', sessionId } = req.body;

    if (!message) {
      res.status(400).json({
        success: false,
        error: 'Message is required',
      });
      return;
    }

    setupSSEHeaders(res);

    await generateStreamingResponse(
      {
        message,
        conversationHistory,
        options: { template, sessionId },
      },
      res
    );
  } catch (error) {
    logger.error('Error in streaming chat controller:', error);

    if (res.headersSent) {
      sendError(
        res,
        'Failed to process chat message. Please try again.',
        'sendChatMessageStreaming'
      );
    } else {
      ErrorHandler.handleApiError(error, 'sendChatMessageStreaming', res);
    }
  }

  res.end();
}

export async function getChatConfig(_req: Request, res: Response): Promise<void> {
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

export async function checkProviderHealth(_req: Request, res: Response): Promise<void> {
  try {
    const { OllamaService } = await import('./services/ollama-service.js');
    const { ChatProviderConfig } = await import('./utils/chat-config.js');

    const health: any = {
      openai: {
        configured: ChatProviderConfig.isOpenAIConfigValid(),
        status: ChatProviderConfig.isOpenAIConfigValid() ? 'ready' : 'not_configured',
      },
      ollama: {
        configured: ChatProviderConfig.isOllamaConfigValid(),
        status: 'checking...',
      },
    };

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

export async function getConversationHistoryHandler(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
      return;
    }

    const history = await getConversationHistory(sessionId);

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

export async function clearConversationMemoryHandler(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
      return;
    }

    clearConversationMemory(sessionId);

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

export async function testChatTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { template = 'CHAT_GENERIC', message = 'Hello, can you help me?' } = req.body;

    const result = await testChatFunctionality(message, null, {
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

export async function getChatStatsHandler(_req: Request, res: Response): Promise<void> {
  try {
    const stats = getChatStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    ErrorHandler.handleApiError(error, 'getChatStats', res);
  }
}

export async function testChatFunctionalityHandler(req: Request, res: Response): Promise<void> {
  try {
    const { testMessage, provider } = req.body;

    const result = await testChatFunctionality(testMessage, provider);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    ErrorHandler.handleApiError(error, 'testChatFunctionality', res);
  }
}
