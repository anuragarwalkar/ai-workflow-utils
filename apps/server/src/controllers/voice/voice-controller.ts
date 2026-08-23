import { Request, Response } from 'express';
import geminiVoiceService from '../../services/voice/GeminiVoiceService.ts';
import { ErrorHandler } from '../chat/utils/error-handler.js';
import logger from '../../logger.ts';

export async function startVoiceSession(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId, template = 'CHAT_GENERIC', voice = 'Chime', language = 'en-US' } = req.body;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
      return;
    }

    logger.info(`[VOICE_CONTROLLER] [startVoiceSession] Starting voice session: ${sessionId}`);

    const sessionInfo = await geminiVoiceService.startVoiceSession(String(sessionId), {
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

export async function stopVoiceSession(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = String(req.params.sessionId);

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
      return;
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

export async function sendVoiceTextInput(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = String(req.params.sessionId);
    const { text } = req.body;

    if (!sessionId || !text) {
      res.status(400).json({
        success: false,
        error: 'Session ID and text are required',
      });
      return;
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

export async function sendVoiceAudioInput(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = String(req.params.sessionId);
    const { audioData, mimeType = 'audio/pcm' } = req.body;

    if (!sessionId || !audioData) {
      res.status(400).json({
        success: false,
        error: 'Session ID and audio data are required',
      });
      return;
    }

    logger.info(`[VOICE_CONTROLLER] [sendVoiceAudioInput] Sending audio to session: ${sessionId}`);

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

export async function getActiveVoiceSessions(_req: Request, res: Response): Promise<void> {
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

export async function getVoiceConversationHistory(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = String(req.params.sessionId);

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
      return;
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

export async function voiceWebSocketHandler(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = String(req.params.sessionId);

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'Session ID is required for WebSocket connection',
      });
      return;
    }

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

export async function getVoiceConfig(_req: Request, res: Response): Promise<void> {
  try {
    logger.info('[VOICE_CONTROLLER] [getVoiceConfig] Fetching voice configuration');

    const config = {
      availableVoices: ['Chime', 'Kore', 'Aoede', 'Fenix'],
      supportedLanguages: ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR'],
      supportedAudioFormats: ['audio/pcm', 'audio/wav', 'audio/webm'],
      maxSessionDuration: 3600000,
      isGeminiVoiceAvailable: Boolean(process.env.GOOGLE_API_KEY),
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
