import logger from '../../../logger.js';

/**
 * Streaming Processor - Handles Server-Sent Events (SSE) for real-time responses
 * Follows the same pattern as other streaming processors in the project
 */

/**
 * Setup SSE headers for streaming response
 * @param {Object} res - Express response object
 */
export function setupSSEHeaders(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ 
    type: 'connected', 
    timestamp: new Date().toISOString() 
  })}\n\n`);
}

/**
 * Send streaming data chunk
 * @param {Object} res - Express response object
 * @param {string} type - Event type
 * @param {any} data - Data to send
 */
export function sendStreamChunk(res, type, data) {
  try {
    const chunk = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };

    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  } catch (error) {
    logger.error('[STREAMING_PROCESSOR] [sendStreamChunk] Error:', error);
  }
}

/**
 * Send error through stream
 * @param {Object} res - Express response object
 * @param {Error} error - Error to send
 * @param {string} operation - Operation name
 */
export function sendError(res, error, operation) {
  try {
    const errorData = {
      type: 'error',
      error: {
        message: error.message,
        operation,
      },
      timestamp: new Date().toISOString(),
    };

    res.write(`data: ${JSON.stringify(errorData)}\n\n`);
    res.end();
  } catch (writeError) {
    logger.error('[STREAMING_PROCESSOR] [sendError] Failed to send error:', writeError);
    res.end();
  }
}

/**
 * Send completion event and end stream
 * @param {Object} res - Express response object
 * @param {Object} summary - Final summary data
 */
export function sendCompletion(res, summary = null) {
  try {
    const completionData = {
      type: 'complete',
      summary,
      timestamp: new Date().toISOString(),
    };

    res.write(`data: ${JSON.stringify(completionData)}\n\n`);
    res.end();
  } catch (error) {
    logger.error('[STREAMING_PROCESSOR] [sendCompletion] Error:', error);
    res.end();
  }
}

/**
 * Handle streaming summary generation
 * @param {Object} res - Express response object
 * @param {AsyncIterable} stream - AI response stream
 * @param {string} operation - Operation name
 */
export async function handleSummaryStream(res, stream, operation = 'generateSummary') {
  try {
    let accumulatedContent = '';

    if (stream && typeof stream[Symbol.asyncIterator] === 'function') {
      for await (const chunk of stream) {
        const content = chunk.content || chunk.text || chunk.toString();
        accumulatedContent += content;

        sendStreamChunk(res, 'content', {
          content,
          accumulated: accumulatedContent,
        });
      }

      sendCompletion(res, { content: accumulatedContent });
    } else {
      // Handle non-streaming response
      const content = typeof stream === 'string' ? stream : JSON.stringify(stream);
      sendStreamChunk(res, 'content', { content });
      sendCompletion(res, { content });
    }
  } catch (error) {
    logger.error(`[STREAMING_PROCESSOR] [handleSummaryStream] ${operation} error:`, error);
    sendError(res, error, operation);
  }
}

/**
 * Create a progress tracker for long-running operations
 * @param {Object} res - Express response object
 * @param {Array} steps - Array of step names
 * @returns {Object} Progress tracker functions
 */
export function createProgressTracker(res, steps = []) {
  let currentStep = 0;
  
  const updateProgress = (stepName, progress = null) => {
    try {
      const progressData = {
        type: 'progress',
        step: stepName,
        currentStep: currentStep + 1,
        totalSteps: steps.length,
        progress: progress || ((currentStep + 1) / steps.length) * 100,
        timestamp: new Date().toISOString(),
      };

      res.write(`data: ${JSON.stringify(progressData)}\n\n`);
      currentStep++;
    } catch (error) {
      logger.error('[STREAMING_PROCESSOR] [updateProgress] Error:', error);
    }
  };

  const setProgress = (step, progress) => {
    try {
      const progressData = {
        type: 'progress',
        step,
        progress,
        timestamp: new Date().toISOString(),
      };

      res.write(`data: ${JSON.stringify(progressData)}\n\n`);
    } catch (error) {
      logger.error('[STREAMING_PROCESSOR] [setProgress] Error:', error);
    }
  };

  return {
    updateProgress,
    setProgress,
  };
}

/**
 * Send status update through stream
 * @param {Object} res - Express response object
 * @param {string} status - Status message
 * @param {Object} data - Additional data
 */
export function sendStatus(res, status, data = {}) {
  try {
    const statusData = {
      type: 'status',
      status,
      ...data,
      timestamp: new Date().toISOString(),
    };

    res.write(`data: ${JSON.stringify(statusData)}\n\n`);
  } catch (error) {
    logger.error('[STREAMING_PROCESSOR] [sendStatus] Error:', error);
  }
}
