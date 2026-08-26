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

router.post('/message', sendChatMessage);
router.post('/stream', sendChatMessageStreaming);
router.get('/config', getChatConfig);
router.get('/health', checkProviderHealth);
router.post('/test-template', testChatTemplate);
router.post('/test', testChatFunctionalityHandler);
router.get('/stats', getChatStatsHandler);
router.get('/conversation/:sessionId', getConversationHistoryHandler);
router.delete('/conversation/:sessionId', clearConversationMemoryHandler);

export default router;
