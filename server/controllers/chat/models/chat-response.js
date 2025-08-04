/**
 * ChatResponse Model - Represents a chat response from AI providers
 * Provides standardized response format and API conversion
 */
export class ChatResponse {
  constructor({
    content = '',
    sessionId = '',
    provider = '',
    timestamp = new Date().toISOString(),
    success = true,
    error = null,
    metadata = {},
  }) {
    this.content = content;
    this.sessionId = sessionId;
    this.provider = provider;
    this.timestamp = timestamp;
    this.success = success;
    this.error = error;
    this.metadata = metadata;
  }

  /**
   * Convert to API response format
   * @returns {Object} Standardized API response
   */
  toApiResponse() {
    const response = {
      success: this.success,
      data: {
        content: this.content,
        sessionId: this.sessionId,
        provider: this.provider,
        timestamp: this.timestamp,
        metadata: this.metadata,
      },
    };

    if (!this.success && this.error) {
      response.error = this.error;
    }

    return response;
  }

  /**
   * Convert to streaming response format
   * @returns {Object} Streaming response format
   */
  toStreamResponse() {
    return {
      type: 'response',
      content: this.content,
      sessionId: this.sessionId,
      provider: this.provider,
      timestamp: this.timestamp,
      success: this.success,
      error: this.error,
      metadata: this.metadata,
    };
  }

  /**
   * Validate the chat response
   * @returns {Object} Validation result
   */
  validate() {
    const errors = [];

    if (!this.content && this.success) {
      errors.push('Content is required for successful responses');
    }

    if (!this.sessionId) {
      errors.push('Session ID is required');
    }

    if (!this.provider) {
      errors.push('Provider is required');
    }

    if (!this.timestamp) {
      errors.push('Timestamp is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create an error response
   * @param {string} errorMessage - Error message
   * @param {string} sessionId - Session ID
   * @param {string} provider - Provider name
   * @returns {ChatResponse} Error response instance
   */
  static createErrorResponse(
    errorMessage,
    sessionId = 'error_session',
    provider = 'unknown'
  ) {
    return new ChatResponse({
      content: '',
      sessionId,
      provider,
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Create a success response
   * @param {string} content - Response content
   * @param {string} sessionId - Session ID
   * @param {string} provider - Provider name
   * @param {Object} metadata - Additional metadata
   * @returns {ChatResponse} Success response instance
   */
  static createSuccessResponse(content, sessionId, provider, metadata = {}) {
    return new ChatResponse({
      content,
      sessionId,
      provider,
      success: true,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }
}

export default ChatResponse;
