import express from 'express';
import { ChatController } from '../controllers/chat/index.js';

const router = express.Router();

// Regular chat endpoint
router.post('/message', ChatController.sendChatMessage);

// Streaming chat endpoint
router.post('/stream', ChatController.sendChatMessageStreaming);

// Configuration endpoint
router.get('/config', ChatController.getChatConfig);

// Health check endpoint
router.get('/health', ChatController.checkProviderHealth);

// Chat testing endpoints
router.post('/test-template', ChatController.testChatTemplate);
router.post('/test', ChatController.testChatFunctionality);

// Chat statistics
router.get('/stats', ChatController.getChatStats);

// Conversation management endpoints
router.get('/conversation/:sessionId', ChatController.getConversationHistory);
router.delete(
  '/conversation/:sessionId',
  ChatController.clearConversationMemory,
);

export default router;
