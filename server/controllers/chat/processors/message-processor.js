/**
 * Message Processor - Handles message formatting and conversation management
 * Follows processor pattern for data transformation utilities
 */

/**
 * Process and validate conversation history
 * @param {Array} conversationHistory - Array of conversation messages
 * @returns {Array} Processed and validated conversation history
 */
export function processConversationHistory(conversationHistory = []) {
  if (!Array.isArray(conversationHistory)) {
    return [];
  }
  return conversationHistory
    .filter(msg => msg && msg.role && msg.content)
    .map(msg => ({
      role: validateRole(msg.role),
      content: sanitizeContent(msg.content),
    }))
    .slice(-10); // Keep last 10 messages to prevent context overflow
}

/**
 * Format message for different AI providers
 * @param {string} message - User message
 * @param {Array} conversationHistory - Conversation history
 * @param {string} provider - Target provider name
 * @returns {Object} Formatted message data
 */
export function formatForProvider(message, conversationHistory, provider) {
  const processedHistory = processConversationHistory(conversationHistory);
  const sanitizedMessage = sanitizeContent(message);
  switch (provider) {
    case 'OpenAI Compatible':
      return formatForOpenAI(sanitizedMessage, processedHistory);
    case 'Ollama':
      return formatForOllama(sanitizedMessage, processedHistory);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Extract content from provider-specific response format
 * @param {Object} response - Provider response
 * @param {string} provider - Provider name
 * @returns {string} Extracted content
 */
export function extractContent(response, provider) {
  switch (provider) {
    case 'OpenAI Compatible':
      return response.data?.choices?.[0]?.message?.content || '';
    case 'Ollama':
      return response.data?.response || '';
    default:
      return '';
  }
}

// Utility functions (formerly private static)
function validateRole(role) {
  if (['user', 'assistant', 'system'].includes(role)) {
    return role;
  }
  return 'user';
}

function sanitizeContent(content) {
  if (typeof content !== 'string') return '';
  return content.trim();
}

function formatForOpenAI(message, conversationHistory) {
  // Implement OpenAI formatting logic here
  return {
    messages: [...conversationHistory, { role: 'user', content: message }],
  };
}

function formatForOllama(message, conversationHistory) {
  // Implement Ollama formatting logic here
  return {
    prompt: [
      ...conversationHistory.map(msg => `${msg.role}: ${msg.content}`),
      `user: ${message}`,
    ].join('\n'),
  };
}
