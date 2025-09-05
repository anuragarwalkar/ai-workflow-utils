import geminiVoiceService from '../../services/voice/GeminiVoiceService.js';
import { ErrorHandler } from '../chat/utils/error-handler.js';
import logger from '../../logger.js';

/**
 * Voice Controller - Handles AI voice assistant operations using Gemini Live API
 * Implements functional programming pattern
 */

/**
 * Start a voice session with Gemini Live API
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function startVoiceSession(req, res) {
  try {
    const { sessionId, template = 'CHAT_GENERIC', voice = 'Chime', language = 'en-US' } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
    }

    logger.info(`[VOICE_CONTROLLER] [startVoiceSession] Starting voice session: ${sessionId}`);

    const sessionInfo = await geminiVoiceService.startVoiceSession(sessionId, {
      template,
      voice,
      language,
    });

    res.json({
      success: true,
      data: sessionInfo,
    });
  } catch (error) {
    logger.error(`[VOICE_CONTROLLER] [startVoiceSession] Error:`, error);
    ErrorHandler.handleApiError(error, 'startVoiceSession', res);
  }
}

/**
 * Stop a voice session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function stopVoiceSession(req, res) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
    }

    logger.info(`[VOICE_CONTROLLER] [stopVoiceSession] Stopping voice session: ${sessionId}`);

    await geminiVoiceService.stopVoiceSession(sessionId);

    res.json({
      success: true,
      data: { sessionId, message: 'Voice session stopped successfully' },
    });
  } catch (error) {
    logger.error(`[VOICE_CONTROLLER] [stopVoiceSession] Error:`, error);
    ErrorHandler.handleApiError(error, 'stopVoiceSession', res);
  }
}

/**
 * Send text input to voice session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function sendVoiceTextInput(req, res) {
  try {
    const { sessionId } = req.params;
    const { text } = req.body;

    if (!sessionId || !text) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and text are required',
      });
    }

    logger.info(`[VOICE_CONTROLLER] [sendVoiceTextInput] Sending text to session: ${sessionId}`);

    await geminiVoiceService.sendTextInput(sessionId, text);

    res.json({
      success: true,
      data: { sessionId, message: 'Text input sent successfully' },
    });
  } catch (error) {
    logger.error(`[VOICE_CONTROLLER] [sendVoiceTextInput] Error:`, error);
    ErrorHandler.handleApiError(error, 'sendVoiceTextInput', res);
  }
}

/**
 * Send audio input to voice session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function sendVoiceAudioInput(req, res) {
  try {
    const { sessionId } = req.params;
    const { audioData, mimeType = 'audio/pcm' } = req.body;

    if (!sessionId || !audioData) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and audio data are required',
      });
    }

    logger.info(`[VOICE_CONTROLLER] [sendVoiceAudioInput] Sending audio to session: ${sessionId}`);

    // Convert base64 audio data to buffer
    const audioBuffer = Buffer.from(audioData, 'base64');
    await geminiVoiceService.sendAudioInput(sessionId, audioBuffer, mimeType);

    res.json({
      success: true,
      data: { sessionId, message: 'Audio input sent successfully' },
    });
  } catch (error) {
    logger.error(`[VOICE_CONTROLLER] [sendVoiceAudioInput] Error:`, error);
    ErrorHandler.handleApiError(error, 'sendVoiceAudioInput', res);
  }
}

/**
 * Get active voice sessions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getActiveVoiceSessions(req, res) {
  try {
    logger.info('[VOICE_CONTROLLER] [getActiveVoiceSessions] Fetching active sessions');

    const activeSessions = geminiVoiceService.getActiveSessions();

    res.json({
      success: true,
      data: {
        sessions: activeSessions,
        count: activeSessions.length,
      },
    });
  } catch (error) {
    logger.error(`[VOICE_CONTROLLER] [getActiveVoiceSessions] Error:`, error);
    ErrorHandler.handleApiError(error, 'getActiveVoiceSessions', res);
  }
}

/**
 * Get voice conversation history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getVoiceConversationHistory(req, res) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
    }

    logger.info(`[VOICE_CONTROLLER] [getVoiceConversationHistory] Fetching history for: ${sessionId}`);

    const history = geminiVoiceService.getConversationHistory(sessionId);

    res.json({
      success: true,
      data: {
        sessionId,
        history,
        messageCount: history.length,
      },
    });
  } catch (error) {
    logger.error(`[VOICE_CONTROLLER] [getVoiceConversationHistory] Error:`, error);
    ErrorHandler.handleApiError(error, 'getVoiceConversationHistory', res);
  }
}

/**
 * WebSocket endpoint for real-time voice streaming
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function voiceWebSocketHandler(req, res) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required for WebSocket connection',
      });
    }

    // This will be handled by WebSocket upgrade in routes
    // For now, return session status
    const activeSessions = geminiVoiceService.getActiveSessions();
    const sessionExists = activeSessions.some(session => session.sessionId === sessionId);

    res.json({
      success: true,
      data: {
        sessionId,
        wsEndpoint: `/ws/voice/${sessionId}`,
        sessionExists,
        message: 'Use WebSocket connection for real-time voice streaming',
      },
    });
  } catch (error) {
    logger.error(`[VOICE_CONTROLLER] [voiceWebSocketHandler] Error:`, error);
    ErrorHandler.handleApiError(error, 'voiceWebSocketHandler', res);
  }
}

/**
 * Get voice configuration and available options
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getVoiceConfig(req, res) {
  try {
    logger.info('[VOICE_CONTROLLER] [getVoiceConfig] Fetching voice configuration');

    const config = {
      availableVoices: ['Chime', 'Kore', 'Aoede', 'Fenix'],
      supportedLanguages: ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR'],
      supportedAudioFormats: ['audio/pcm', 'audio/wav', 'audio/webm'],
      maxSessionDuration: 3600000, // 1 hour in milliseconds
      isGeminiVoiceAvailable: !!process.env.GOOGLE_API_KEY,
    };

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    logger.error(`[VOICE_CONTROLLER] [getVoiceConfig] Error:`, error);
    ErrorHandler.handleApiError(error, 'getVoiceConfig', res);
  }
}
