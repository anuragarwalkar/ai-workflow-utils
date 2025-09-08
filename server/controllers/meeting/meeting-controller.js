/* eslint-disable max-lines */
/* eslint-disable max-statements */
import {
  deleteMeetingRecord,
  generateMeetingSummary,
  getActiveRecordings,
  getMeetingById,
  getMeetingHistory,
  getMeetingStats,
  startMeetingRecording,
  stopMeetingRecording,
} from './services/meeting-service.js';
import { ErrorHandler } from './utils/error-handler.js';
import { setupSSEHeaders } from './processors/streaming-processor.js';
import logger from '../../logger.js';

/**
 * Meeting Controller - Main orchestrator for meeting operations
 * Handles recording, transcription, and AI-powered summarization
 */

/**
 * Start recording a meeting
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function startRecording(req, res) {
  try {
    const { 
      title, 
      participants = [], 
      audioSource = 'microphone', // 'microphone', 'system', 'both'
      quality = 'medium' // 'low', 'medium', 'high'
    } = req.body;

    logger.info('[MEETING_CONTROLLER] [startRecording] Starting meeting recording', { 
      title, 
      participants: participants.length, 
      audioSource,
      quality 
    });

    const recording = await startMeetingRecording({
      title,
      participants,
      audioSource,
      quality,
    });

    res.json({
      success: true,
      data: recording,
      message: 'Meeting recording started successfully',
    });
  } catch (error) {
    ErrorHandler.handleApiError(error, 'startRecording', res);
  }
}

/**
 * Stop recording and initiate processing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function stopRecording(req, res) {
  try {
    const { recordingId } = req.params;
    const { autoSummarize = true } = req.body;
    const audioFile = req.file; // Multer uploads the file here

    logger.info('[MEETING_CONTROLLER] [stopRecording] Stopping meeting recording', { 
      recordingId, 
      autoSummarize,
      audioFile: audioFile ? {
        filename: audioFile.filename,
        mimetype: audioFile.mimetype,
        size: audioFile.size,
        path: audioFile.path
      } : null
    });

    const result = await stopMeetingRecording({
      recordingId,
      autoSummarize,
      audioFilePath: audioFile?.path, // Pass the file path to the service
    });

    res.json({
      success: true,
      data: result,
      message: 'Meeting recording stopped successfully',
    });
  } catch (error) {
    ErrorHandler.handleApiError(error, 'stopRecording', res);
  }
}

/**
 * Generate AI-powered meeting summary
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function generateSummary(req, res) {
  try {
    const { recordingId } = req.params;
    const { 
      summaryType = 'comprehensive', // 'brief', 'comprehensive', 'action-items', 'technical'
      includeTimestamps = true,
      extractActionItems = true,
      extractDecisions = true,
      preferredProvider = null
    } = req.body;

    logger.info('[MEETING_CONTROLLER] [generateSummary] Generating meeting summary', { 
      recordingId, 
      summaryType,
      includeTimestamps,
      extractActionItems,
      extractDecisions,
      preferredProvider
    });

    const summary = await generateMeetingSummary({
      recordingId,
      options: {
        summaryType,
        includeTimestamps,
        extractActionItems,
        extractDecisions,
        preferredProvider,
      },
    });

    res.json({
      success: true,
      data: summary,
      message: 'Meeting summary generated successfully',
    });
  } catch (error) {
    ErrorHandler.handleApiError(error, 'generateSummary', res);
  }
}

/**
 * Generate streaming meeting summary
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function generateSummaryStreaming(req, res) {
  try {
    const { recordingId } = req.params;
    const { 
      summaryType = 'comprehensive',
      includeTimestamps = true,
      extractActionItems = true,
      extractDecisions = true,
      preferredProvider = null
    } = req.body;

    logger.info('[MEETING_CONTROLLER] [generateSummaryStreaming] Starting streaming summary', { 
      recordingId, 
      summaryType 
    });

    // Setup SSE headers
    setupSSEHeaders(res);

    try {
      const stream = await generateMeetingSummary({
        recordingId,
        options: {
          summaryType,
          includeTimestamps,
          extractActionItems,
          extractDecisions,
          preferredProvider,
          streaming: true,
        },
      });

      // Handle streaming response
      if (stream && typeof stream[Symbol.asyncIterator] === 'function') {
        for await (const chunk of stream) {
          const data = {
            type: 'content',
            content: chunk.content || chunk,
            timestamp: new Date().toISOString(),
          };
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        }
      }

      // Send completion event
      res.write(`data: ${JSON.stringify({ type: 'complete', timestamp: new Date().toISOString() })}\n\n`);
      res.end();
    } catch (streamError) {
      logger.error('[MEETING_CONTROLLER] [generateSummaryStreaming] Stream error:', streamError);
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        error: streamError.message,
        timestamp: new Date().toISOString()
      })}\n\n`);
      res.end();
    }
  } catch (error) {
    ErrorHandler.handleApiError(error, 'generateSummaryStreaming', res);
  }
}

/**
 * Get recording status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getRecordingStatus(req, res) {
  try {
    const { recordingId } = req.params;

    logger.info('[MEETING_CONTROLLER] [getRecordingStatus] Getting recording status', { recordingId });

    const activeRecordings = await getActiveRecordings();
    const status = activeRecordings.find(r => r.id === recordingId) || { status: 'not_found' };

    res.json({
      success: true,
      data: status,
      message: 'Recording status retrieved successfully',
    });
  } catch (error) {
    ErrorHandler.handleApiError(error, 'getRecordingStatus', res);
  }
}

/**
 * Get available audio sources (microphone, system audio)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getAudioSources(req, res) {
  try {
    logger.info('[MEETING_CONTROLLER] [getAudioSources] Getting available audio sources');

    // Mock audio sources for now - this will be implemented in audio processor
    const audioSources = {
      microphone: {
        available: true,
        devices: [
          { id: 'default', name: 'Default Microphone', type: 'input' },
          { id: 'built-in', name: 'Built-in Microphone', type: 'input' }
        ]
      },
      system: {
        available: process.platform === 'darwin' || process.platform === 'win32',
        devices: [
          { id: 'system-audio', name: 'System Audio', type: 'output' }
        ]
      }
    };

    res.json({
      success: true,
      data: audioSources,
      message: 'Audio sources retrieved successfully',
    });
  } catch (error) {
    ErrorHandler.handleApiError(error, 'getAudioSources', res);
  }
}

/**
 * Get meeting history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getHistory(req, res) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      status = null // 'recording', 'processing', 'completed', 'failed'
    } = req.query;

    logger.info('[MEETING_CONTROLLER] [getHistory] Fetching meeting history', { 
      page: Number(page), 
      limit: Number(limit), 
      sortBy, 
      sortOrder,
      status 
    });

    const history = await getMeetingHistory({
      pagination: {
        page: Number(page),
        limit: Number(limit),
      },
      sorting: {
        field: sortBy,
        order: sortOrder,
      },
      filters: {
        status,
      },
    });

    res.json({
      success: true,
      data: history,
      message: 'Meeting history retrieved successfully',
    });
  } catch (error) {
    ErrorHandler.handleApiError(error, 'getHistory', res);
  }
}

/**
 * Delete a meeting record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function deleteMeeting(req, res) {
  try {
    const { recordingId } = req.params;
    const { deleteAudioFile = false } = req.body;

    logger.info('[MEETING_CONTROLLER] [deleteMeeting] Deleting meeting record', { 
      recordingId, 
      deleteAudioFile 
    });

    await deleteMeetingRecord({
      recordingId,
      deleteAudioFile,
    });

    res.json({
      success: true,
      message: 'Meeting record deleted successfully',
    });
  } catch (error) {
    ErrorHandler.handleApiError(error, 'deleteMeeting', res);
  }
}

/**
 * Get meeting statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getStats(req, res) {
  try {
    const { 
      timeRange = '30d' // '7d', '30d', '90d', 'all'
    } = req.query;

    logger.info('[MEETING_CONTROLLER] [getStats] Fetching meeting statistics', { timeRange });

    const stats = await getMeetingStats({ timeRange });

    res.json({
      success: true,
      data: stats,
      message: 'Meeting statistics retrieved successfully',
    });
  } catch (error) {
    ErrorHandler.handleApiError(error, 'getStats', res);
  }
}

/**
 * Get active recordings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getActiveRecordingsEndpoint(req, res) {
  try {
    logger.info('[MEETING_CONTROLLER] [getActiveRecordingsEndpoint] Fetching active recordings');

    const activeRecordings = await getActiveRecordings();

    res.json({
      success: true,
      data: activeRecordings,
      message: 'Active recordings retrieved successfully',
    });
  } catch (error) {
    ErrorHandler.handleApiError(error, 'getActiveRecordingsEndpoint', res);
  }
}

/**
 * Serve audio file for playback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function serveAudioFile(req, res) {
  try {
    const { recordingId } = req.params;
    
    logger.info('[MEETING_CONTROLLER] [serveAudioFile] Serving audio file', { recordingId });

    // Import fs dynamically to avoid module issues
    const fs = await import('fs');
    
    // Get the meeting record to find the audio file path
    const meeting = await getMeetingById(recordingId);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: { message: 'Meeting not found' }
      });
    }
    
    if (!meeting.audioFilePath) {
      return res.status(404).json({
        success: false,
        error: { message: 'Audio file not found for this meeting' }
      });
    }
    
    // Check if audio file exists (using promises version)
    try {
      await fs.promises.access(meeting.audioFilePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: { message: 'Audio file no longer exists on disk' }
      });
    }
    
    // Get file stats for content length
    const stat = await fs.promises.stat(meeting.audioFilePath);
    const fileSize = stat.size;
    const { range } = req.headers;
    
    // Handle range requests for audio streaming
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.default.createReadStream(meeting.audioFilePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/wav',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Serve full file
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/wav',
        'Accept-Ranges': 'bytes',
      };
      res.writeHead(200, head);
      fs.default.createReadStream(meeting.audioFilePath).pipe(res);
    }
    
  } catch (error) {
    logger.error('[MEETING_CONTROLLER] [serveAudioFile] Error serving audio file:', error);
    ErrorHandler.handleApiError(error, 'serveAudioFile', res);
  }
}
