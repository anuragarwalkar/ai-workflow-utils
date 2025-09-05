/**
 * Chat utility functions for message formatting, validation, and common operations
 */

import { CHAT_UI, MESSAGE_STATUS, MESSAGE_TYPES } from '../constants/chat.js';

/**
 * Format timestamp to readable format
 * @param {Date|string|number} timestamp - The timestamp to format
 * @returns {string} Formatted time string
 */
export const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

/**
 * Generate unique session ID
 * @returns {string} Unique session identifier
 */
export const generateSessionId = () => {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validate message content
 * @param {string} message - Message content to validate
 * @returns {object} Validation result with isValid and error properties
 */
export const validateMessage = (message) => {
  if (!message || typeof message !== 'string') {
    return { isValid: false, error: 'Message is required' };
  }
  
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  if (trimmed.length > CHAT_UI.MAX_MESSAGE_LENGTH) {
    return { 
      isValid: false, 
      error: `Message too long (${trimmed.length}/${CHAT_UI.MAX_MESSAGE_LENGTH})` 
    };
  }
  
  return { isValid: true };
};

/**
 * Create a new message object
 * @param {string} content - Message content
 * @param {string} type - Message type from MESSAGE_TYPES
 * @param {string} status - Message status from MESSAGE_STATUS
 * @returns {object} Message object
 */
export const createMessage = (content, type = MESSAGE_TYPES.USER, status = MESSAGE_STATUS.SENT) => {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content,
    type,
    status,
    timestamp: new Date().toISOString(),
    metadata: {},
  };
};

/**
 * Format conversation history for API
 * @param {Array} messages - Array of message objects
 * @returns {Array} Formatted conversation history
 */
export const formatConversationHistory = (messages) => {
  return messages
    .filter(msg => msg.type !== MESSAGE_TYPES.ERROR && msg.status === MESSAGE_STATUS.SENT)
    .map(msg => ({
      role: msg.type === MESSAGE_TYPES.USER ? 'user' : 'assistant',
      content: msg.content,
      timestamp: msg.timestamp,
    }));
};

/**
 * Extract error message from error object
 * @param {any} error - Error object or string
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.data?.message) return error.data.message;
  if (error?.message) return error.message;
  if (error?.data) return JSON.stringify(error.data);
  return 'An unexpected error occurred';
};

/**
 * Check if message is from user
 * @param {object} message - Message object
 * @returns {boolean} True if message is from user
 */
export const isUserMessage = (message) => {
  return message?.type === MESSAGE_TYPES.USER;
};

/**
 * Check if message is from assistant
 * @param {object} message - Message object
 * @returns {boolean} True if message is from assistant
 */
export const isAssistantMessage = (message) => {
  return message?.type === MESSAGE_TYPES.ASSISTANT;
};

/**
 * Get conversation title from first message
 * @param {Array} messages - Array of messages
 * @param {number} maxLength - Maximum title length
 * @returns {string} Conversation title
 */
export const getConversationTitle = (messages, maxLength = 50) => {
  const firstUserMessage = messages.find(msg => msg.type === MESSAGE_TYPES.USER);
  if (!firstUserMessage) return 'New Conversation';
  
  const title = firstUserMessage.content.trim();
  return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
};
