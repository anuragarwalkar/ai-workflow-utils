import express from 'express';
import {
  checkProviderHealth,
  clearConversationMemoryHandler,
  getChatConfig,
  getChatStatsHandler,
  getConversationHistoryHandler,
  sendChatMessage,
  sendChatMessageStreaming,
  testChatFunctionalityHandler,
  testChatTemplate,
} from '../controllers/chat/index.js';

const router = express.Router();

// Regular chat endpoint
router.post('/message', sendChatMessage);

// Streaming chat endpoint
router.post('/stream', sendChatMessageStreaming);

// Configuration endpoint
router.get('/config', getChatConfig);

// Health check endpoint
router.get('/health', checkProviderHealth);

// Chat testing endpoints
router.post('/test-template', testChatTemplate);
router.post('/test', testChatFunctionalityHandler);

// Chat statistics
router.get('/stats', getChatStatsHandler);

// Conversation management endpoints
router.get('/conversation/:sessionId', getConversationHistoryHandler);
router.delete('/conversation/:sessionId', clearConversationMemoryHandler);

export default router;
