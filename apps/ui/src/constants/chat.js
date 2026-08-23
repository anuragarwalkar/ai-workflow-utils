/**
 * Chat constants for consistent values across chat functionality
 */

// Message types
export const MESSAGE_TYPES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
  ERROR: 'error',
};

// Message statuses
export const MESSAGE_STATUS = {
  PENDING: 'pending',
  SENDING: 'sending',
  SENT: 'sent',
  FAILED: 'failed',
  STREAMING: 'streaming',
  COMPLETED: 'completed',
};

// Chat templates
export const CHAT_TEMPLATES = {
  GENERIC: 'CHAT_GENERIC',
  CODE_REVIEW: 'CHAT_CODE_REVIEW',
  DOCUMENTATION: 'CHAT_DOCUMENTATION',
  DEBUGGING: 'CHAT_DEBUGGING',
};

// Feature placeholders for future implementation
export const FUTURE_FEATURES = {
  ATTACHMENTS: {
    PHOTOS: 'photos',
    VIDEOS: 'videos',
    FILES: 'files',
  },
  COMMANDS: {
    VOICE: 'voice',
    WEB_SEARCH: 'web_search',
    CREATE_IMAGE: 'create_image',
  },
};

// UI Constants
export const CHAT_UI = {
  MAX_MESSAGE_LENGTH: 4000,
  MESSAGES_PER_PAGE: 50,
  SIDEBAR_WIDTH: 260,
  INPUT_MIN_HEIGHT: 44,
  INPUT_MAX_HEIGHT: 200,
};

// Conversation states
export const CONVERSATION_STATE = {
  IDLE: 'idle',
  ACTIVE: 'active',
  LOADING: 'loading',
  ERROR: 'error',
};
