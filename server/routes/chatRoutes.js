import express from 'express';
import { sendChatMessage, sendChatMessageStreaming } from '../controllers/chatController.js';

const router = express.Router();

// Regular chat endpoint
router.post('/message', sendChatMessage);

// Streaming chat endpoint
router.post('/stream', sendChatMessageStreaming);

export default router;
