import WebSocket from 'ws';
import { EventEmitter } from 'events';
import logger from '../../logger.ts';
import templateDbService from '../templateDbService.ts';

export interface VoiceConnectionInfo {
  ws: WebSocket;
  sessionId: string;
  template: string;
  voice: string;
  language: string;
  systemPrompt: string;
  isActive: boolean;
  startTime: Date;
}

export interface VoiceSessionOptions {
  template?: string;
  voice?: string;
  language?: string;
}

export interface VoiceMessageHistory {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

class GeminiVoiceService extends EventEmitter {
  activeConnections: Map<string, VoiceConnectionInfo>;
  conversationMemory: Map<string, VoiceMessageHistory[]>;
  connectionRetries: Map<string, number>;
  maxRetries: number;
  baseUrl: string;

  constructor() {
    super();
    this.activeConnections = new Map();
    this.conversationMemory = new Map();
    this.connectionRetries = new Map();
    this.maxRetries = 3;
    this.baseUrl = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';
  }

  async startVoiceSession(sessionId: string, options: VoiceSessionOptions = {}): Promise<any> {
    try {
      logger.info(`[GEMINI_VOICE_SERVICE] [startVoiceSession] Starting: ${sessionId}`);

      const { template = 'CHAT_GENERIC', voice = 'Chime', language = 'en-US' } = options;
      const systemPrompt = await GeminiVoiceService.getSystemPrompt(template);

      const wsUrl = `${this.baseUrl}?key=${process.env.GOOGLE_API_KEY}`;
      const ws = new WebSocket(wsUrl);

      const connectionInfo: VoiceConnectionInfo = {
        ws,
        sessionId,
        template,
        voice,
        language,
        systemPrompt,
        isActive: false,
        startTime: new Date(),
      };

      this.activeConnections.set(sessionId, connectionInfo);
      this.setupWebSocketHandlers(sessionId, connectionInfo);
      await GeminiVoiceService.waitForConnection(ws);
      await GeminiVoiceService.initializeConversation(connectionInfo);

      logger.info(`[GEMINI_VOICE_SERVICE] [startVoiceSession] Started: ${sessionId}`);
      return { sessionId, status: 'active', template, voice, language, startTime: connectionInfo.startTime };
    } catch (error: any) {
      logger.error(`[GEMINI_VOICE_SERVICE] [startVoiceSession] Failed ${sessionId}:`, error);
      this.cleanup(sessionId);
      throw error;
    }
  }

  setupWebSocketHandlers(sessionId: string, connectionInfo: VoiceConnectionInfo): void {
    const { ws } = connectionInfo;

    ws.on('open', () => {
      connectionInfo.isActive = true;
      this.emit('session-connected', { sessionId });
    });

    ws.on('message', (data: WebSocket.Data) => this.handleIncomingMessage(sessionId, data));

    ws.on('error', (error: Error) => {
      logger.error(`[GEMINI_VOICE_SERVICE] WebSocket error ${sessionId}:`, error);
      this.emit('session-error', { sessionId, error: error.message });
      this.handleReconnection(sessionId);
    });

    ws.on('close', (code: number, reason: Buffer) => {
      connectionInfo.isActive = false;
      this.emit('session-disconnected', { sessionId, code, reason: reason.toString() });
      if (code !== 1000) this.handleReconnection(sessionId);
    });
  }

  static async initializeConversation(connectionInfo: VoiceConnectionInfo): Promise<void> {
    const { ws, systemPrompt, voice } = connectionInfo;

    const setupMessage = {
      setup: {
        model: 'models/gemini-2.0-flash-exp',
        generation_config: {
          response_modalities: ['AUDIO'],
          speech_config: { voice_config: { prebuilt_voice_config: { voice_name: voice } } },
        },
        system_instruction: { parts: [{ text: systemPrompt }] },
        tools: [],
      },
    };

    ws.send(JSON.stringify(setupMessage));
  }

  handleIncomingMessage(sessionId: string, data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());

      if (message.setupComplete) {
        this.emit('session-ready', { sessionId });
        return;
      }

      if (message.serverContent?.modelTurn?.parts) {
        message.serverContent.modelTurn.parts.forEach((part: any) => {
          if (part.text) {
            this.emit('voice-text', { sessionId, text: part.text, timestamp: new Date().toISOString() });
            this.addToMemory(sessionId, 'assistant', part.text);
          }

          if (part.inlineData?.mimeType?.startsWith('audio/')) {
            this.emit('voice-audio', {
              sessionId,
              audioData: part.inlineData.data,
              mimeType: part.inlineData.mimeType,
              timestamp: new Date().toISOString(),
            });
          }
        });
      }

      if (message.toolCall) {
        this.emit('tool-call', { sessionId, toolCall: message.toolCall });
      }
    } catch (error: any) {
      logger.error(`[GEMINI_VOICE_SERVICE] Message processing error ${sessionId}:`, error);
    }
  }

  async sendAudioInput(sessionId: string, audioData: Buffer, mimeType = 'audio/pcm'): Promise<void> {
    const connectionInfo = this.activeConnections.get(sessionId);

    if (!connectionInfo?.isActive) {
      throw new Error(`No active voice session: ${sessionId}`);
    }

    const audioMessage = {
      clientContent: {
        turns: [{ role: 'user', parts: [{ inlineData: { mimeType, data: audioData.toString('base64') } }] }],
        turnComplete: true,
      },
    };

    connectionInfo.ws.send(JSON.stringify(audioMessage));
  }

  async sendTextInput(sessionId: string, text: string): Promise<void> {
    const connectionInfo = this.activeConnections.get(sessionId);

    if (!connectionInfo?.isActive) {
      throw new Error(`No active voice session: ${sessionId}`);
    }

    const textMessage = {
      clientContent: {
        turns: [{ role: 'user', parts: [{ text }] }],
        turnComplete: true,
      },
    };

    connectionInfo.ws.send(JSON.stringify(textMessage));
    this.addToMemory(sessionId, 'user', text);
  }

  async stopVoiceSession(sessionId: string): Promise<void> {
    const connectionInfo = this.activeConnections.get(sessionId);

    if (connectionInfo?.ws?.readyState === WebSocket.OPEN) {
      connectionInfo.ws.close(1000, 'Session ended');
    }

    this.cleanup(sessionId);
    this.emit('session-ended', { sessionId });
  }

  getConversationHistory(sessionId: string): VoiceMessageHistory[] {
    return this.conversationMemory.get(sessionId) || [];
  }

  getActiveSessions(): any[] {
    return Array.from(this.activeConnections.entries()).map(([sessionId, info]) => ({
      sessionId,
      template: info.template,
      voice: info.voice,
      language: info.language,
      isActive: info.isActive,
      startTime: info.startTime,
      duration: Date.now() - info.startTime.getTime(),
    }));
  }

  static async getSystemPrompt(templateType: string): Promise<string> {
    try {
      const template = await templateDbService.getActiveTemplate(templateType);
      return (
        template?.content ||
        'You are a helpful AI voice assistant. Provide conversational, clear responses optimized for voice interaction.'
      );
    } catch (error: any) {
      logger.error('[GEMINI_VOICE_SERVICE] Template error:', error);
      return 'You are a helpful AI voice assistant.';
    }
  }

  addToMemory(sessionId: string, role: 'user' | 'assistant', content: string): void {
    if (!this.conversationMemory.has(sessionId)) {
      this.conversationMemory.set(sessionId, []);
    }

    const history = this.conversationMemory.get(sessionId)!;
    history.push({ role, content, timestamp: new Date().toISOString() });

    if (history.length > 50) history.splice(0, history.length - 50);
  }

  async handleReconnection(sessionId: string): Promise<void> {
    const retryCount = this.connectionRetries.get(sessionId) || 0;

    if (retryCount < this.maxRetries) {
      this.connectionRetries.set(sessionId, retryCount + 1);
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));

      try {
        const connectionInfo = this.activeConnections.get(sessionId);
        if (connectionInfo) {
          await this.startVoiceSession(sessionId, {
            template: connectionInfo.template,
            voice: connectionInfo.voice,
            language: connectionInfo.language,
          });
        }
      } catch (error: any) {
        logger.error(`[GEMINI_VOICE_SERVICE] Reconnection failed ${sessionId}:`, error);
      }
    } else {
      this.cleanup(sessionId);
      this.emit('session-failed', { sessionId, reason: 'Max reconnection attempts reached' });
    }
  }

  static waitForConnection(ws: WebSocket): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);

      ws.on('open', () => {
        clearTimeout(timeout);
        resolve();
      });

      ws.on('error', error => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  cleanup(sessionId: string): void {
    this.activeConnections.delete(sessionId);
    this.connectionRetries.delete(sessionId);
  }

  async cleanupAll(): Promise<void> {
    for (const [, connectionInfo] of this.activeConnections) {
      if (connectionInfo.ws?.readyState === WebSocket.OPEN) {
        connectionInfo.ws.close(1000, 'Server shutdown');
      }
    }

    this.activeConnections.clear();
    this.connectionRetries.clear();
    this.conversationMemory.clear();
  }
}

export default new GeminiVoiceService();
