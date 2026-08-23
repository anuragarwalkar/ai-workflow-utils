import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOpen: false,
  isMinimized: false,
  conversationHistory: [],
  currentMessage: '',
  isLoading: false,
  isStreaming: false,
  streamingContent: '',
  error: null,
  provider: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    toggleChat: state => {
      state.isOpen = !state.isOpen;
      if (state.isOpen) {
        state.isMinimized = false;
      }
    },
    openChat: state => {
      state.isOpen = true;
      state.isMinimized = false;
    },
    closeChat: state => {
      state.isOpen = false;
      state.isMinimized = false;
    },
    minimizeChat: state => {
      state.isMinimized = true;
    },
    maximizeChat: state => {
      state.isMinimized = false;
    },
    setCurrentMessage: (state, action) => {
      state.currentMessage = action.payload;
    },
    addMessage: (state, action) => {
      state.conversationHistory.push(action.payload);
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setStreaming: (state, action) => {
      state.isStreaming = action.payload;
      if (!action.payload) {
        state.streamingContent = '';
      }
    },
    setStreamingContent: (state, action) => {
      state.streamingContent = action.payload;
    },
    appendStreamingContent: (state, action) => {
      state.streamingContent += action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
      state.isStreaming = false;
    },
    clearError: state => {
      state.error = null;
    },
    setProvider: (state, action) => {
      state.provider = action.payload;
    },
    clearConversation: state => {
      state.conversationHistory = [];
      state.currentMessage = '';
      state.streamingContent = '';
      state.error = null;
    },
  },
});

export const {
  toggleChat,
  openChat,
  closeChat,
  minimizeChat,
  maximizeChat,
  setCurrentMessage,
  addMessage,
  setLoading,
  setStreaming,
  setStreamingContent,
  appendStreamingContent,
  setError,
  clearError,
  setProvider,
  clearConversation,
} = chatSlice.actions;

export default chatSlice.reducer;
