/* eslint-disable max-lines */
/* eslint-disable max-statements */
/* eslint-disable no-unused-vars */
import { BaseLangChainService } from '../../../services/langchain/BaseLangChainService.js';
import { AudioProcessor } from '../processors/audio-processor.js';
import { TranscriptionProcessor } from '../processors/transcription-processor.js';
import { MeetingDatabase } from '../utils/meeting-database.js';
import logger from '../../../logger.js';

/**
 * Meeting Service - Extends BaseLangChainService for AI-powered meeting operations
 * Handles recording, transcription, and intelligent summarization
 */
class MeetingService extends BaseLangChainService {
  constructor() {
    super();
    this.activeRecordings = new Map();
    this.meetingDb = new MeetingDatabase();
    this.initializeService();
  }

  /**
   * Initialize the meeting service
   */
  async initializeService() {
    try {
      await this.initializeProviders();
      await this.meetingDb.initialize();
      logger.info('[MEETING_SERVICE] Service initialized successfully');
    } catch (error) {
      logger.error('[MEETING_SERVICE] Failed to initialize service:', error);
    }
  }

  /**
   * Start recording a meeting
   * @param {Object} options - Recording options
   * @returns {Object} Recording session data
   */
  async startRecording({ title, participants, audioSource, quality }) {
    try {
      const recordingId = this.generateRecordingId();
      const startTime = new Date().toISOString();

      logger.info('[MEETING_SERVICE] [startRecording] Starting recording', {
        recordingId,
        title,
        participantCount: participants.length,
        audioSource,
        quality
      });

      // Initialize audio processor
      const audioProcessor = new AudioProcessor({
        recordingId,
        audioSource,
        quality,
        sampleRate: audioSource === 'system' ? 48000 : 44100,
        channels: audioSource === 'system' ? 2 : 1,
      });

      // Start audio recording
      const recordingSession = await audioProcessor.startRecording();

      // Store recording session
      const recordingData = {
        id: recordingId,
        title: title || `Meeting ${new Date().toLocaleDateString()}`,
        participants,
        audioSource,
        quality,
        startTime,
        status: 'recording',
        audioProcessor,
        session: recordingSession,
      };

      this.activeRecordings.set(recordingId, recordingData);

      // Save to database
      await this.meetingDb.createMeeting(recordingData);

      return {
        recordingId,
        title: recordingData.title,
        status: 'recording',
        startTime,
        participants: participants.length,
        audioSource,
        quality,
      };
    } catch (error) {
      logger.error('[MEETING_SERVICE] [startRecording] Error:', error);
      throw new Error(`Failed to start recording: ${error.message}`);
    }
  }

  /**
   * Stop recording a meeting
   * @param {Object} options - Stop recording options
   * @returns {Object} Recording result data
   */
  async stopRecording({ recordingId, autoSummarize = true }) {
    try {
      logger.info('[MEETING_SERVICE] [stopRecording] Stopping recording', {
        recordingId,
        autoSummarize
      });

      const recording = this.activeRecordings.get(recordingId);
      if (!recording) {
        throw new Error(`Recording not found: ${recordingId}`);
      }

      // Stop audio recording
      const audioResult = await recording.audioProcessor.stopRecording();
      const endTime = new Date().toISOString();

      // Update recording data
      recording.status = 'processing';
      recording.endTime = endTime;
      recording.duration = audioResult.duration;
      recording.audioFilePath = audioResult.filePath;

      // Update database
      await this.meetingDb.updateMeeting(recordingId, {
        status: 'processing',
        endTime,
        duration: audioResult.duration,
        audioFilePath: audioResult.filePath,
      });

      // Remove from active recordings
      this.activeRecordings.delete(recordingId);

      // Start background processing
      if (autoSummarize) {
        this.processRecordingAsync(recordingId, recording);
      }

      return {
        recordingId,
        status: 'processing',
        duration: audioResult.duration,
        endTime,
        audioFilePath: audioResult.filePath,
        willAutoSummarize: autoSummarize,
      };
    } catch (error) {
      logger.error('[MEETING_SERVICE] [stopRecording] Error:', error);
      throw new Error(`Failed to stop recording: ${error.message}`);
    }
  }

  /**
   * Generate AI-powered meeting summary
   * @param {Object} options - Summary generation options
   * @returns {Object} Meeting summary data
   */
  async generateSummary({ recordingId, options = {} }) {
    try {
      const {
        summaryType = 'comprehensive',
        includeTimestamps = true,
        extractActionItems = true,
        extractDecisions = true,
        preferredProvider = null,
        streaming = false,
      } = options;

      logger.info('[MEETING_SERVICE] [generateSummary] Generating summary', {
        recordingId,
        summaryType,
        streaming
      });

      // Get meeting data from database
      const meeting = await this.meetingDb.getMeeting(recordingId);
      if (!meeting) {
        throw new Error(`Meeting not found: ${recordingId}`);
      }

      // Get or generate transcription
      let {transcription} = meeting;
      if (!transcription) {
        logger.info('[MEETING_SERVICE] [generateSummary] Generating transcription first');
        transcription = await this.generateTranscription(meeting);
        await this.meetingDb.updateMeeting(recordingId, { transcription });
      }

      // Prepare prompt for AI summary generation
      const promptTemplateFormatter = {
        prompt: this.buildSummaryPrompt({
          transcription,
          summaryType,
          includeTimestamps,
          extractActionItems,
          extractDecisions,
          meetingTitle: meeting.title,
          participants: meeting.participants,
          duration: meeting.duration,
        }),
      };

      // Generate summary using AI
      const result = await this.generateContent({
        promptTemplateFormatter,
        promptTemplateIdentifier: 'MEETING_SUMMARY',
        streaming,
        preferredProvider,
      });

      if (streaming) {
        return result.content; // Return stream directly
      }

      // Parse and structure the summary
      const structuredSummary = this.parseAISummary(result.content, {
        summaryType,
        extractActionItems,
        extractDecisions,
      });

      // Save summary to database
      const summaryData = {
        recordingId,
        summary: structuredSummary,
        summaryType,
        generatedAt: new Date().toISOString(),
        provider: result.provider,
        options: {
          includeTimestamps,
          extractActionItems,
          extractDecisions,
        },
      };

      await this.meetingDb.saveSummary(summaryData);

      // Update meeting status
      await this.meetingDb.updateMeeting(recordingId, { status: 'completed' });

      return summaryData;
    } catch (error) {
      logger.error('[MEETING_SERVICE] [generateSummary] Error:', error);
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
  }

  /**
   * Get meeting history with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Object} Meeting history data
   */
  async getMeetingHistory({ pagination, sorting, filters }) {
    try {
      logger.info('[MEETING_SERVICE] [getMeetingHistory] Fetching history');

      const history = await this.meetingDb.getMeetings({
        ...pagination,
        ...sorting,
        ...filters,
      });

      return {
        meetings: history.meetings,
        total: history.total,
        page: pagination.page,
        limit: pagination.limit,
        hasMore: history.hasMore,
      };
    } catch (error) {
      logger.error('[MEETING_SERVICE] [getMeetingHistory] Error:', error);
      throw new Error(`Failed to get meeting history: ${error.message}`);
    }
  }

  /**
   * Get a meeting by ID
   * @param {string} recordingId - Meeting recording ID
   * @returns {Object} Meeting data
   */
  async getMeetingById(recordingId) {
    try {
      logger.info('[MEETING_SERVICE] [getMeetingById] Fetching meeting', { recordingId });

      const meeting = await this.meetingDb.getMeeting(recordingId);
      if (!meeting) {
        throw new Error(`Meeting not found: ${recordingId}`);
      }

      return meeting;
    } catch (error) {
      logger.error('[MEETING_SERVICE] [getMeetingById] Error:', error);
      throw new Error(`Failed to get meeting: ${error.message}`);
    }
  }

  /**
   * Delete a meeting record
   * @param {Object} options - Deletion options
   */
  async deleteMeetingRecord({ recordingId, deleteAudioFile = false }) {
    try {
      logger.info('[MEETING_SERVICE] [deleteMeetingRecord] Deleting meeting', {
        recordingId,
        deleteAudioFile
      });

      const meeting = await this.meetingDb.getMeeting(recordingId);
      if (!meeting) {
        throw new Error(`Meeting not found: ${recordingId}`);
      }

      // Delete audio file if requested
      if (deleteAudioFile && meeting.audioFilePath) {
        await AudioProcessor.deleteAudioFile(meeting.audioFilePath);
      }

      // Delete from database
      await this.meetingDb.deleteMeeting(recordingId);

      logger.info('[MEETING_SERVICE] [deleteMeetingRecord] Meeting deleted successfully');
    } catch (error) {
      logger.error('[MEETING_SERVICE] [deleteMeetingRecord] Error:', error);
      throw new Error(`Failed to delete meeting: ${error.message}`);
    }
  }

  /**
   * Get meeting statistics
   * @param {Object} options - Statistics options
   * @returns {Object} Meeting statistics
   */
  async getMeetingStats({ timeRange }) {
    try {
      logger.info('[MEETING_SERVICE] [getMeetingStats] Calculating stats for', { timeRange });

      const stats = await this.meetingDb.getStatistics(timeRange);

      return {
        totalMeetings: stats.totalMeetings,
        totalDuration: stats.totalDuration,
        averageDuration: stats.averageDuration,
        summariesGenerated: stats.summariesGenerated,
        timeRange,
        breakdown: stats.breakdown,
      };
    } catch (error) {
      logger.error('[MEETING_SERVICE] [getMeetingStats] Error:', error);
      throw new Error(`Failed to get meeting statistics: ${error.message}`);
    }
  }

  /**
   * Get active recordings
   * @returns {Array} List of active recordings
   */
  async getActiveRecordings() {
    try {
      const activeRecordings = Array.from(this.activeRecordings.values()).map(recording => ({
        id: recording.id,
        title: recording.title,
        startTime: recording.startTime,
        duration: Date.now() - new Date(recording.startTime).getTime(),
        participants: recording.participants.length,
        audioSource: recording.audioSource,
        status: recording.status,
      }));

      return activeRecordings;
    } catch (error) {
      logger.error('[MEETING_SERVICE] [getActiveRecordings] Error:', error);
      throw new Error(`Failed to get active recordings: ${error.message}`);
    }
  }

  // Helper methods

  /**
   * Generate unique recording ID
   * @returns {string} Unique recording ID
   */
  generateRecordingId() {
    return `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Build summary prompt for AI
   * @param {Object} data - Meeting data
   * @returns {string} Formatted prompt
   */
  buildSummaryPrompt({
    transcription,
    summaryType,
    includeTimestamps,
    extractActionItems,
    extractDecisions,
    meetingTitle,
    participants,
    duration,
  }) {
    let prompt = `Please analyze this meeting transcription and provide a ${summaryType} summary.\n\n`;
    prompt += `Meeting Title: ${meetingTitle}\n`;
    prompt += `Participants: ${participants.join(', ')}\n`;
    prompt += `Duration: ${Math.round(duration / 60)} minutes\n\n`;
    prompt += `Transcription:\n${transcription}\n\n`;

    prompt += `Please provide:\n`;
    if (summaryType === 'comprehensive') {
      prompt += `1. Executive Summary\n2. Key Discussion Points\n3. Main Topics Covered\n`;
    }
    if (extractActionItems) {
      prompt += `4. Action Items (who, what, when)\n`;
    }
    if (extractDecisions) {
      prompt += `5. Decisions Made\n`;
    }
    if (includeTimestamps) {
      prompt += `6. Include relevant timestamps for important points\n`;
    }

    prompt += `\nFormat the response in clear sections with proper markdown formatting.`;

    return prompt;
  }

  /**
   * Parse AI-generated summary into structured data
   * @param {string} aiSummary - Raw AI summary
   * @param {Object} options - Parsing options
   * @returns {Object} Structured summary
   */
  parseAISummary(aiSummary, { summaryType, extractActionItems, extractDecisions }) {
    // This is a basic parser - can be enhanced with more sophisticated NLP
    const sections = {
      summary: aiSummary,
      actionItems: [],
      decisions: [],
      keyPoints: [],
    };

    if (extractActionItems) {
      const actionItemsMatch = aiSummary.match(/action items?:?\s*(.*?)(?=\n\n|\n#|$)/gis);
      if (actionItemsMatch) {
        sections.actionItems = this.extractListItems(actionItemsMatch[0]);
      }
    }

    if (extractDecisions) {
      const decisionsMatch = aiSummary.match(/decisions?\s?made:?\s*(.*?)(?=\n\n|\n#|$)/gis);
      if (decisionsMatch) {
        sections.decisions = this.extractListItems(decisionsMatch[0]);
      }
    }

    return sections;
  }

  /**
   * Extract list items from text
   * @param {string} text - Text containing list items
   * @returns {Array} Array of list items
   */
  extractListItems(text) {
    const items = text.split('\n')
      .filter(line => line.trim().match(/^[-*\d.]/))
      .map(line => line.replace(/^[-*\d.]\s*/, '').trim())
      .filter(item => item.length > 0);

    return items;
  }

  /**
   * Generate transcription from audio
   * @param {Object} meeting - Meeting data
   * @returns {string} Transcription text
   */
  async generateTranscription(meeting) {
    try {
      logger.info('[MEETING_SERVICE] [generateTranscription] Generating transcription');

      const transcriptionProcessor = new TranscriptionProcessor();
      const transcription = await transcriptionProcessor.transcribeAudio(meeting.audioFilePath);

      return transcription;
    } catch (error) {
      logger.error('[MEETING_SERVICE] [generateTranscription] Error:', error);
      throw new Error(`Failed to generate transcription: ${error.message}`);
    }
  }

  /**
   * Process recording asynchronously (background task)
   * @param {string} recordingId - Recording ID
   * @param {Object} recording - Recording data
   */
  async processRecordingAsync(recordingId, recording) {
    try {
      logger.info('[MEETING_SERVICE] [processRecordingAsync] Starting background processing');

      // Generate summary in background
      await this.generateSummary({
        recordingId,
        options: {
          summaryType: 'comprehensive',
          includeTimestamps: true,
          extractActionItems: true,
          extractDecisions: true,
        },
      });

      logger.info('[MEETING_SERVICE] [processRecordingAsync] Background processing completed');
    } catch (error) {
      logger.error('[MEETING_SERVICE] [processRecordingAsync] Background processing failed:', error);
      
      // Update meeting status to failed
      await this.meetingDb.updateMeeting(recordingId, { 
        status: 'failed',
        error: error.message 
      });
    }
  }
}

// Export singleton instance
const meetingService = new MeetingService();

// Export individual functions for controller use
export const startMeetingRecording = meetingService.startRecording.bind(meetingService);
export const stopMeetingRecording = meetingService.stopRecording.bind(meetingService);
export const generateMeetingSummary = meetingService.generateSummary.bind(meetingService);
export const getMeetingHistory = meetingService.getMeetingHistory.bind(meetingService);
export const getMeetingById = meetingService.getMeetingById.bind(meetingService);
export const deleteMeetingRecord = meetingService.deleteMeetingRecord.bind(meetingService);
export const getMeetingStats = meetingService.getMeetingStats.bind(meetingService);
export const getActiveRecordings = meetingService.getActiveRecordings.bind(meetingService);

export default meetingService;
