import { io } from 'socket.io-client';
import store from '../store';
import { addBuildLog, setBranchName, setBuildError } from '../store/slices/buildSlice';
import { API_BASE_URL } from '../config/environment.js';
import { createLogger } from '../utils/log.js';

const logger = createLogger('SOCKET_SERVICE');

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    this.socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      logger.info('connect', 'Connected to WebSocket server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      logger.info('disconnect', 'Disconnected from WebSocket server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', error => {
      logger.error('connect_error', 'WebSocket connection error:', error);
      store.dispatch(setBuildError('Failed to connect to build service'));
    });

    // Listen for build progress events
    this.socket.on('build-progress', data => {
      logger.info('build-progress', 'Build progress received:', data);
      store.dispatch(addBuildLog(data));

      // Check if the message contains branch name information
      if (data.message && typeof data.message === 'string') {
        // Look for branch name patterns in the message
        const branchNameMatch =
          data.message.match(/(?:branch|Branch):\s*([^\s\n]+)/i) ||
          data.message.match(/(?:created branch|switching to branch|on branch):\s*([^\s\n]+)/i) ||
          data.message.match(/(?:git checkout -b|git branch)\s+([^\s\n]+)/i);

        if (branchNameMatch && branchNameMatch[1]) {
          const branchName = branchNameMatch[1].trim();
          logger.info('build-progress', 'Captured branch name from WebSocket:', branchName);
          store.dispatch(setBranchName(branchName));
        }
      }

      // Also check if data has a specific branchName field
      if (data.branchName) {
        logger.info('build-progress', 'Captured branch name from WebSocket data:', data.branchName);
        store.dispatch(setBranchName(data.branchName));
      }
    });

        // Listen for voice assistant events
    this.socket.on('voice-session-connected', data => {
      logger.info('voice-session-connected', 'Voice session connected:', data);
      this.emit('voice-session-connected', data);
    });

    this.socket.on('voice-session-ready', data => {
      logger.info('voice-session-ready', 'Voice session ready:', data);
      this.emit('voice-session-ready', data);
    });

    this.socket.on('voice-text', data => {
      logger.info('voice-text', 'Voice text received:', data);
      this.emit('voice-text', data);
    });

    this.socket.on('voice-audio', data => {
      logger.info('voice-audio', 'Voice audio received:', data);
      this.emit('voice-audio', data);
    });

    this.socket.on('voice-session-disconnected', data => {
      logger.info('voice-session-disconnected', 'Voice session disconnected:', data);
      this.emit('voice-session-disconnected', data);
    });

    this.socket.on('voice-session-error', data => {
      logger.error('voice-session-error', 'Voice session error:', data);
      this.emit('voice-session-error', data);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  // Method to emit events if needed in the future
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  // Voice assistant specific methods
  startVoiceSession(sessionData) {
    logger.info('startVoiceSession', 'Starting voice session:', sessionData);
    this.emit('start-voice-session', sessionData);
  }

  stopVoiceSession(sessionId) {
    logger.info('stopVoiceSession', 'Stopping voice session:', sessionId);
    this.emit('stop-voice-session', { sessionId });
  }

  sendVoiceAudio(sessionId, audioData) {
    logger.info('sendVoiceAudio', 'Sending voice audio for session:', sessionId);
    this.emit('voice-audio-input', { sessionId, audioData });
  }

  sendVoiceText(sessionId, text) {
    logger.info('sendVoiceText', 'Sending voice text for session:', sessionId);
    this.emit('voice-text-input', { sessionId, text });
  }

  // Event listener management for voice events
  onVoiceEvent(eventName, callback) {
    if (this.socket) {
      this.socket.on(eventName, callback);
    }
  }

  offVoiceEvent(eventName, callback) {
    if (this.socket) {
      this.socket.off(eventName, callback);
    }
  }
}

// Create a singleton instance
const socketService = new SocketService();

export default socketService;
