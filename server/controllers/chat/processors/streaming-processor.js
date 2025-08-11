import logger from '../../../logger.js';

/**
 * Streaming Processor - Handles real-time streaming response processing
 * Follows processor pattern for data transformation utilities
 */
/**
 * Set up Server-Sent Events headers for streaming responses
 * @param {Object} res - Express response object
 */

export function setupSSEHeaders(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });
}

/**
 * Send completion message to streaming client
 * @param {Object} res - Express response object
 * @param {string} fullResponse - Complete response content
 * @param {string} provider - Provider that generated the response
 */

/**
 * Send status update to streaming client
 * @param {Object} res - Express response object
 * @param {string} message - Status message
 * @param {string} provider - Provider name
 */
export function sendStatus(res, message, provider) {
  const statusData = {
    type: 'status',
    message,
    provider,
  };
  res.write(`data: ${JSON.stringify(statusData)}\n\n`);
  logger.debug(`Streaming status: ${message} (${provider})`);
}

/**
 * Send content chunk to streaming client
 * @param {Object} res - Express response object
 * @param {string} content - Content chunk
 */
export function sendChunk(res, content) {
  const chunkData = {
    type: 'chunk',
    content,
  };
  res.write(`data: ${JSON.stringify(chunkData)}\n\n`);
}

export function sendComplete(res, fullResponse, provider) {
  const completeData = {
    type: 'complete',
    response: fullResponse,
    provider,
  };
  res.write(`data: ${JSON.stringify(completeData)}\n\n`);
  logger.info(`Streaming complete: ${fullResponse.length} characters from ${provider}`);
}

/**
 * Send error message to streaming client
 * @param {Object} res - Express response object
 * @param {string} error - Error message
 * @param {string} context - Error context
 */
export function sendError(res, error, context) {
  const errorData = {
    type: 'error',
    error,
    context,
  };
  res.write(`data: ${JSON.stringify(errorData)}\n\n`);
  logger.error(`Streaming error in ${context}: ${error}`);
}

/**
 * Validate and sanitize streaming data
 * @param {string} data - Raw data to validate
 * @returns {string} Sanitized data
 */
export function sanitizeStreamData(data) {
  if (typeof data !== 'string') {
    return '';
  }
  // Remove any potential SSE-breaking characters
  return data.replace(/\n\n/g, ' ').replace(/data:/g, '');
}

/**
 * Check if streaming response is complete based on provider-specific markers
 * @param {string} data - Raw response data
 * @param {string} provider - Provider name
 * @returns {boolean} True if response is complete
 */
export function isStreamComplete(data, provider) {
  if (provider === 'OpenAI Compatible') {
    return data === '[DONE]';
  } else if (provider === 'Ollama') {
    try {
      const parsed = JSON.parse(data);
      return parsed.done === true;
    } catch {
      return false;
    }
  }
  return false;
}
