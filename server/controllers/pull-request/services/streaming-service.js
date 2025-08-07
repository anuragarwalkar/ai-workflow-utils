import logger from '../../../logger.js';
import { SSE_HEADERS } from '../utils/constants.js';

/**
 * Service for handling Server-Sent Events streaming
 */
class StreamingService {
  /**
   * Set up Server-Sent Events headers
   */
  static setupSSE(res) {
    res.writeHead(200, SSE_HEADERS);
  }

  /**
   * Send data through SSE
   */
  static sendSSEData(res, data) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  /**
   * Send status update
   */
  static sendStatus(res, message) {
    this.sendSSEData(res, {
      type: 'status',
      message: message,
    });
  }

  /**
   * Send progress update
   */
  static sendProgress(res, progress) {
    this.sendSSEData(res, {
      type: 'progress',
      ...progress,
    });
  }

  /**
   * Send content chunk (standardized across services)
   */
  static sendChunk(res, content) {
    this.sendSSEData(res, {
      type: 'chunk',
      content: content,
    });
  }

  /**
   * Send token (for chat services)
   */
  static sendToken(res, content) {
    this.sendSSEData(res, {
      type: 'token',
      content: content,
    });
  }

  /**
   * Send title chunk (for PR services)
   */
  static sendTitleChunk(res, title) {
    this.sendSSEData(res, {
      type: 'title_chunk',
      data: title,
    });
  }

  /**
   * Send description chunk (for PR services)
   */
  static sendDescriptionChunk(res, description) {
    this.sendSSEData(res, {
      type: 'description_chunk',
      data: description,
    });
  }

  /**
   * Send complete title
   */
  static sendTitleComplete(res, title) {
    this.sendSSEData(res, {
      type: 'title_complete',
      data: title,
    });
  }

  /**
   * Send complete description
   */
  static sendDescriptionComplete(res, description) {
    this.sendSSEData(res, {
      type: 'description_complete',
      data: description,
    });
  }

  /**
   * Send complete data
   */
  static sendComplete(res, data) {
    this.sendSSEData(res, {
      type: 'complete',
      data: data,
    });
  }

  /**
   * Send review complete (for PR review)
   */
  static sendReviewComplete(res, reviewData) {
    this.sendSSEData(res, {
      type: 'review_complete',
      data: reviewData,
    });
  }

  /**
   * Send error and close connection
   */
  static sendError(res, error) {
    logger.error('Streaming error:', error);
    this.sendSSEData(res, {
      type: 'error',
      message: error.message,
    });
    res.end();
  }

  /**
   * Close SSE connection
   */
  static closeSSE(res) {
    res.end();
  }
}

export default StreamingService;
