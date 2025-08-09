/**
 * Chat Message Model - Data validation and structure for chat operations
 * Follows modular architecture pattern with validation and payload generation
 */

export class ChatMessage {
  constructor(data) {
    this.message = data.message;
    this.conversationHistory = data.conversationHistory || [];
    this.timestamp = data.timestamp || new Date();
    this.provider = data.provider;
  }

  /**
   * Validate chat message data
   * @param {Object} data - Chat message data to validate
   * @throws {Error} If validation fails
   */
  static validate(data) {
    if (
      !data.message ||
      typeof data.message !== 'string' ||
      data.message.trim() === ''
    ) {
      throw new Error('Message is required and must be a non-empty string');
    }

    if (data.conversationHistory && !Array.isArray(data.conversationHistory)) {
      throw new Error('Conversation history must be an array');
    }

    // Validate conversation history format
    if (data.conversationHistory) {
      for (const msg of data.conversationHistory) {
        if (!msg.role || !msg.content) {
          throw new Error(
            'Conversation history entries must have role and content properties',
          );
        }
        if (!['user', 'assistant', 'system'].includes(msg.role)) {
          throw new Error(
            'Invalid role in conversation history. Must be user, assistant, or system',
          );
        }
      }
    }
  }

  /**
   * Convert to OpenAI API format
   * @returns {Object} OpenAI compatible messages array
   */
  toOpenAIFormat() {
    const messages = [
      {
        role: 'system',
        content:
          'You are a helpful AI assistant integrated into a workflow utility application. You can help users with general questions, provide guidance on using the application features, and assist with various tasks. Be concise and helpful in your responses.',
      },
      ...this.conversationHistory,
      {
        role: 'user',
        content: this.message,
      },
    ];

    return {
      messages,
      max_tokens: 500,
      temperature: 0.7,
    };
  }

  /**
   * Convert to Ollama format
   * @returns {Object} Ollama compatible prompt format
   */
  toOllamaFormat() {
    let fullPrompt =
      'You are a helpful AI assistant integrated into a workflow utility application. You can help users with general questions, provide guidance on using the application features, and assist with various tasks. Be concise and helpful in your responses.\n\n';

    // Add conversation history
    this.conversationHistory.forEach(msg => {
      if (msg.role === 'user') {
        fullPrompt += `User: ${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        fullPrompt += `Assistant: ${msg.content}\n`;
      }
    });

    // Add current message
    fullPrompt += `User: ${this.message}\nAssistant: `;

    return {
      prompt: fullPrompt,
      stream: false,
    };
  }
}

export class ChatResponse {
  constructor(data) {
    this.content = data.content;
    this.provider = data.provider;
    this.timestamp = data.timestamp || new Date();
    this.success = data.success !== undefined ? data.success : true;
    this.error = data.error;
  }

  /**
   * Convert to API response format
   * @returns {Object} Standard API response format
   */
  toApiResponse() {
    if (!this.success) {
      return {
        success: false,
        error: this.error || 'Failed to generate chat response',
      };
    }

    return {
      success: true,
      response: this.content,
      provider: this.provider,
      timestamp: this.timestamp,
    };
  }
}

export default ChatMessage;
