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

router.post('/session/start', startVoiceSession);
router.delete('/session/:sessionId', stopVoiceSession);

router.post('/session/:sessionId/text', sendVoiceTextInput);
router.post('/session/:sessionId/audio', sendVoiceAudioInput);

router.get('/sessions', getActiveVoiceSessions);
router.get('/session/:sessionId/history', getVoiceConversationHistory);

router.get('/config', getVoiceConfig);
router.get('/session/:sessionId/ws', voiceWebSocketHandler);

export default router;
