import express from 'express';
import {
  getActiveVoiceSessions,
  getVoiceConfig,
  getVoiceConversationHistory,
  sendVoiceAudioInput,
  sendVoiceTextInput,
  startVoiceSession,
  stopVoiceSession,
  voiceWebSocketHandler,
} from '../controllers/voice/voice-controller.js';

const router = express.Router();

/**
 * Voice Routes - RESTful API endpoints for AI voice assistant functionality
 * All routes follow the pattern: /api/voice/*
 */

// Voice session management
router.post('/session/start', startVoiceSession);
router.delete('/session/:sessionId', stopVoiceSession);

// Voice input endpoints
router.post('/session/:sessionId/text', sendVoiceTextInput);
router.post('/session/:sessionId/audio', sendVoiceAudioInput);

// Voice session information
router.get('/sessions', getActiveVoiceSessions);
router.get('/session/:sessionId/history', getVoiceConversationHistory);

// Voice configuration
router.get('/config', getVoiceConfig);

// WebSocket endpoint info (actual WebSocket handled in server.js)
router.get('/session/:sessionId/ws', voiceWebSocketHandler);

export default router;
