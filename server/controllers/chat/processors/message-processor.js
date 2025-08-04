/**
 * Message Processor - Handles message formatting and conversation management
 * Follows processor pattern for data transformation utilities
 */
class MessageProcessor {
  /**
   * Process and validate conversation history
   * @param {Array} conversationHistory - Array of conversation messages
   * @returns {Array} Processed and validated conversation history
   */
  static processConversationHistory(conversationHistory = []) {
    if (!Array.isArray(conversationHistory)) {
      return [];
    }

    return conversationHistory
      .filter(msg => msg && msg.role && msg.content)
      .map(msg => ({
        role: this._validateRole(msg.role),
        content: this._sanitizeContent(msg.content),
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
  static formatForProvider(message, conversationHistory, provider) {
    const processedHistory =
      this.processConversationHistory(conversationHistory);
    const sanitizedMessage = this._sanitizeContent(message);

    switch (provider) {
      case 'OpenAI Compatible':
        return this._formatForOpenAI(sanitizedMessage, processedHistory);
      case 'Ollama':
        return this._formatForOllama(sanitizedMessage, processedHistory);
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
  static extractContent(response, provider) {
    switch (provider) {
      case 'OpenAI Compatible':
        return response.data?.choices?.[0]?.message?.content || '';
      case 'Ollama':
        return response.data?.response || '';
      default:
        return '';
    }
  }

  /**
   * Calculate approximate token count for content
   * @param {string} content - Content to analyze
   * @returns {number} Approximate token count
   */
  static estimateTokenCount(content) {
    if (!content || typeof content !== 'string') {
      return 0;
    }

    // Rough approximation: 1 token ≈ 4 characters
    return Math.ceil(content.length / 4);
  }

  /**
   * Truncate content to fit within token limits
   * @param {string} content - Content to truncate
   * @param {number} maxTokens - Maximum allowed tokens
   * @returns {string} Truncated content
   */
  static truncateToTokenLimit(content, maxTokens = 4000) {
    const currentTokens = this.estimateTokenCount(content);

    if (currentTokens <= maxTokens) {
      return content;
    }

    const maxChars = maxTokens * 4;
    return content.slice(0, maxChars) + '...';
  }

  /**
   * Format message for OpenAI compatible APIs
   * @private
   */
  static _formatForOpenAI(message, conversationHistory) {
    return {
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful AI assistant integrated into a workflow utility application. You can help users with general questions, provide guidance on using the application features, and assist with various tasks. Be concise and helpful in your responses.',
        },
        ...conversationHistory,
        {
          role: 'user',
          content: message,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    };
  }

  /**
   * Format message for Ollama API
   * @private
   */
  static _formatForOllama(message, conversationHistory) {
    let fullPrompt =
      'You are a helpful AI assistant integrated into a workflow utility application. You can help users with general questions, provide guidance on using the application features, and assist with various tasks. Be concise and helpful in your responses.\n\n';

    // Add conversation history
    conversationHistory.forEach(msg => {
      if (msg.role === 'user') {
        fullPrompt += `User: ${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        fullPrompt += `Assistant: ${msg.content}\n`;
      }
    });

    // Add current message
    fullPrompt += `User: ${message}\nAssistant: `;

    return {
      prompt: this.truncateToTokenLimit(fullPrompt),
      stream: false,
    };
  }

  /**
   * Validate and normalize message role
   * @private
   */
  static _validateRole(role) {
    const validRoles = ['user', 'assistant', 'system'];
    const normalizedRole = role.toLowerCase();

    if (validRoles.includes(normalizedRole)) {
      return normalizedRole;
    }

    return 'user'; // Default fallback
  }

  /**
   * Sanitize message content
   * @private
   */
  static _sanitizeContent(content) {
    if (typeof content !== 'string') {
      return String(content || '');
    }

    // Remove any potentially harmful or problematic characters
    return content
      .trim()
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\t/g, ' ') // Replace tabs with spaces
      .slice(0, 10000); // Limit content length
  }
}

export default MessageProcessor;
