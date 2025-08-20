/**
 * Service for handling PR preview streaming functionality
 */

import { API_BASE_URL } from '../config/environment.js';
import { DEFAULT_PREVIEW_STATE, ERROR_MESSAGES, STREAM_EVENTS } from '../constants/pr.js';
import { createLogger } from '../utils/log.js';

const logger = createLogger('PRStreamService');

/**
 * Handles streaming response from PR preview endpoint
 * @param {object} params - Parameters object
 * @param {object} params.formData - Form data containing projectKey, repoSlug, branchName
 * @param {object} params.callbacks - Callback functions
 * @param {function} params.callbacks.onUpdate - Called with preview updates
 * @param {function} params.callbacks.onComplete - Called when streaming completes
 * @param {function} params.callbacks.onError - Called on error
 * @returns {Promise<void>}
 */
export const streamPRPreview = async ({ formData, callbacks }) => {
  logger.info('streamPRPreview', 'Starting PR preview stream', formData);
  
  try {
    const response = await initializeStream(formData);
    await processStream(response, formData, callbacks);
  } catch (error) {
    logger.error('streamPRPreview', ERROR_MESSAGES.STREAM_FAILED, error);
    callbacks.onError(error);
  }
};

/**
 * Initialize the streaming connection
 * @param {object} formData - Form data for the request
 * @returns {Promise<Response>} Fetch response
 */
const initializeStream = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/api/pr/stream-preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
};

/**
 * Process the streaming response
 * @param {Response} response - Fetch response object
 * @param {object} formData - Original form data
 * @param {object} callbacks - Callback functions
 */
const processStream = async (response, formData, callbacks) => {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  const streamedPreview = {
    ...DEFAULT_PREVIEW_STATE,
    branchName: formData.branchName,
  };

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        logger.info('processStream', 'Stream completed');
        break;
      }

      const chunk = decoder.decode(value);
      const shouldStop = await processChunk(chunk, streamedPreview, callbacks);
      
      if (shouldStop) {
        break;
      }
    }
  } finally {
    reader.releaseLock();
  }
};

/**
 * Process a single chunk of streaming data
 * @param {string} chunk - Chunk of data from stream
 * @param {object} streamedPreview - Current preview state
 * @param {object} callbacks - Callback functions
 * @returns {Promise<boolean>} Whether to stop processing
 */
const processChunk = async (chunk, streamedPreview, callbacks) => {
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const shouldStop = await processDataLine(line, streamedPreview, callbacks);
      if (shouldStop) {
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Process a single data line from the stream
 * @param {string} line - Data line to process
 * @param {object} streamedPreview - Current preview state
 * @param {object} callbacks - Callback functions
 * @returns {Promise<boolean>} Whether to stop processing
 */
const processDataLine = async (line, streamedPreview, callbacks) => {
  try {
    const jsonStr = line.slice(6); // Remove 'data: ' prefix
    if (!jsonStr.trim()) {
      return false;
    }

    const data = JSON.parse(jsonStr);
    handleStreamEvent({ data, currentPreview: streamedPreview, callbacks });
    
    return data.type === STREAM_EVENTS.COMPLETE || data.type === STREAM_EVENTS.ERROR;
  } catch (parseError) {
    logger.error('processDataLine', ERROR_MESSAGES.PARSE_ERROR, parseError);
    callbacks.onError(new Error(ERROR_MESSAGES.PARSE_ERROR));
    return true;
  }
};

/**
 * Handles individual stream events
 * @param {object} params - Parameters object
 * @param {object} params.data - Stream event data
 * @param {object} params.currentPreview - Current preview state
 * @param {object} params.callbacks - Callback functions
 * @returns {object} Updated preview state
 */
const handleStreamEvent = ({ data, currentPreview, callbacks }) => {
  logger.debug('handleStreamEvent', `Processing ${data.type} event`, data);
  
  let updatedPreview = { ...currentPreview };

  switch (data.type) {
    case STREAM_EVENTS.STATUS:
      logger.info('handleStreamEvent', 'Status update received', data.data);
      break;
      
    case STREAM_EVENTS.CHUNK:
      logger.debug('handleStreamEvent', 'Chunk received');
      break;
      
    case STREAM_EVENTS.TITLE_CHUNK:
      updatedPreview.prTitle += data.data;
      callbacks.onUpdate(updatedPreview);
      break;
      
    case STREAM_EVENTS.TITLE_COMPLETE:
      updatedPreview.prTitle = data.data;
      callbacks.onUpdate(updatedPreview);
      break;
      
    case STREAM_EVENTS.DESCRIPTION_CHUNK:
      updatedPreview.prDescription += data.data;
      callbacks.onUpdate(updatedPreview);
      break;
      
    case STREAM_EVENTS.DESCRIPTION_COMPLETE:
      updatedPreview.prDescription = data.data;
      callbacks.onUpdate(updatedPreview);
      break;
      
    case STREAM_EVENTS.COMPLETE:
      updatedPreview = data.data;
      logger.info('handleStreamEvent', 'Stream completed successfully');
      callbacks.onComplete(updatedPreview);
      break;
      
    case STREAM_EVENTS.ERROR:
      logger.error('handleStreamEvent', 'Stream error received', data.message);
      callbacks.onError(new Error(data.message));
      break;
      
    default:
      logger.warn('handleStreamEvent', 'Unknown stream event type', data.type);
  }

  return updatedPreview;
};
