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
   * Send complete data
   */
  static sendComplete(res, data) {
    this.sendSSEData(res, {
      type: 'complete',
      data: data,
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
