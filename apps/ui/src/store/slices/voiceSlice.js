import { createSlice } from '@reduxjs/toolkit';

/**
 * Voice Slice - Redux state management for voice assistant
 * Handles voice session state, audio recording, and conversation history
 */
const initialState = {
  // Session management
  activeSessionId: null,
  sessionStatus: 'disconnected', // disconnected, connecting, connected, ready, error
  sessionConfig: {
    template: 'CHAT_GENERIC',
    voice: 'Chime',
    language: 'en-US',
  },

  // Audio recording
  isRecording: false,
  audioBlob: null,
  audioUrl: null,
  recordingDuration: 0,

  // Voice responses
  isPlayingAudio: false,
  currentAudioUrl: null,

  // Conversation
  conversationHistory: [],
  
  // UI state
  isVoiceEnabled: false,
  showVoiceControls: false,
  voiceError: null,
  
  // Configuration
  availableVoices: ['Chime', 'Kore', 'Aoede', 'Fenix'],
  supportedLanguages: ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR'],
};

const voiceSlice = createSlice({
  name: 'voice',
  initialState,
  reducers: {
    // Session management
    setActiveSessionId: (state, action) => {
      state.activeSessionId = action.payload;
    },

    setSessionStatus: (state, action) => {
      state.sessionStatus = action.payload;
    },

    updateSessionConfig: (state, action) => {
      state.sessionConfig = { ...state.sessionConfig, ...action.payload };
    },

    // Audio recording
    setIsRecording: (state, action) => {
      state.isRecording = action.payload;
    },

    setAudioBlob: (state, action) => {
      state.audioBlob = action.payload;
    },

    setAudioUrl: (state, action) => {
      state.audioUrl = action.payload;
    },

    setRecordingDuration: (state, action) => {
      state.recordingDuration = action.payload;
    },

    // Voice responses
    setIsPlayingAudio: (state, action) => {
      state.isPlayingAudio = action.payload;
    },

    setCurrentAudioUrl: (state, action) => {
      state.currentAudioUrl = action.payload;
    },

    // Conversation
    addToConversationHistory: (state, action) => {
      state.conversationHistory.push(action.payload);
    },

    clearConversationHistory: (state) => {
      state.conversationHistory = [];
    },

    updateLastMessage: (state, action) => {
      if (state.conversationHistory.length > 0) {
        const lastIndex = state.conversationHistory.length - 1;
        state.conversationHistory[lastIndex] = {
          ...state.conversationHistory[lastIndex],
          ...action.payload,
        };
      }
    },

    // UI state
    setIsVoiceEnabled: (state, action) => {
      state.isVoiceEnabled = action.payload;
    },

    setShowVoiceControls: (state, action) => {
      state.showVoiceControls = action.payload;
    },

    setVoiceError: (state, action) => {
      state.voiceError = action.payload;
    },

    clearVoiceError: (state) => {
      state.voiceError = null;
    },

    // Configuration
    setAvailableVoices: (state, action) => {
      state.availableVoices = action.payload;
    },

    setSupportedLanguages: (state, action) => {
      state.supportedLanguages = action.payload;
    },

    // Reset all state
    resetVoiceState: (state) => {
      Object.assign(state, initialState);
    },

    // Handle voice session connection
    handleVoiceSessionConnected: (state, action) => {
      state.sessionStatus = 'connected';
      state.activeSessionId = action.payload.sessionId;
      state.voiceError = null;
    },

    // Handle voice session ready
    handleVoiceSessionReady: (state, _action) => {
      state.sessionStatus = 'ready';
      state.voiceError = null;
    },

    // Handle voice session disconnected
    handleVoiceSessionDisconnected: (state, _action) => {
      state.sessionStatus = 'disconnected';
      state.activeSessionId = null;
      state.isRecording = false;
      state.isPlayingAudio = false;
    },

    // Handle voice session error
    handleVoiceSessionError: (state, action) => {
      state.sessionStatus = 'error';
      state.voiceError = action.payload.error || 'Voice session error occurred';
      state.isRecording = false;
      state.isPlayingAudio = false;
    },

    // Handle incoming voice text
    handleVoiceTextReceived: (state, action) => {
      const { text, timestamp } = action.payload;
      state.conversationHistory.push({
        role: 'assistant',
        content: text,
        timestamp,
        type: 'voice-text',
      });
    },

    // Handle incoming voice audio
    handleVoiceAudioReceived: (state, action) => {
      const { audioData, mimeType, timestamp } = action.payload;
      
      // Create audio URL from base64 data
      const audioUrl = `data:${mimeType};base64,${audioData}`;
      state.currentAudioUrl = audioUrl;
      
      // Add to conversation history
      state.conversationHistory.push({
        role: 'assistant',
        content: '[Voice Response]',
        timestamp,
        type: 'voice-audio',
        audioUrl,
      });
    },
  },
});

export const {
  setActiveSessionId,
  setSessionStatus,
  updateSessionConfig,
  setIsRecording,
  setAudioBlob,
  setAudioUrl,
  setRecordingDuration,
  setIsPlayingAudio,
  setCurrentAudioUrl,
  addToConversationHistory,
  clearConversationHistory,
  updateLastMessage,
  setIsVoiceEnabled,
  setShowVoiceControls,
  setVoiceError,
  clearVoiceError,
  setAvailableVoices,
  setSupportedLanguages,
  resetVoiceState,
  handleVoiceSessionConnected,
  handleVoiceSessionReady,
  handleVoiceSessionDisconnected,
  handleVoiceSessionError,
  handleVoiceTextReceived,
  handleVoiceAudioReceived,
} = voiceSlice.actions;

export default voiceSlice.reducer;
