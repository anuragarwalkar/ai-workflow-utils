import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import fs from 'fs/promises';
import logger from '../../../logger.js';

/**
 * Meeting Database - LowDB implementation for meeting data storage
 * Follows the same pattern as other database services in the project
 */
export class MeetingDatabase {
  constructor() {
    this.db = null;
    this.dbPath = path.join(process.env.HOME || process.env.USERPROFILE, '.ai-workflow-utils', 'meetings.json');
  }

  /**
   * Initialize the database
   */
  async initialize() {
    try {
      // Ensure directory exists
      const dbDir = path.dirname(this.dbPath);
      await fs.mkdir(dbDir, { recursive: true });

      // Initialize LowDB
      const adapter = new JSONFile(this.dbPath);
      this.db = new Low(adapter, {});

      // Read the database
      await this.db.read();

      // Initialize default data structure if empty
      if (!this.db.data || Object.keys(this.db.data).length === 0) {
        this.db.data = {
          meetings: [],
          summaries: [],
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
        };
        await this.db.write();
      }

      logger.info('[MEETING_DATABASE] Database initialized successfully', {
        dbPath: this.dbPath,
        meetingCount: this.db.data.meetings?.length || 0,
        summaryCount: this.db.data.summaries?.length || 0,
      });
    } catch (error) {
      logger.error('[MEETING_DATABASE] Failed to initialize database:', error);
      throw new Error(`Meeting database initialization failed: ${error.message}`);
    }
  }

  /**
   * Create a new meeting record
   * @param {Object} meetingData - Meeting data
   * @returns {Object} Created meeting record
   */
  async createMeeting(meetingData) {
    try {
      const meeting = {
        ...meetingData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.db.data.meetings.push(meeting);
      this.db.data.lastUpdated = new Date().toISOString();
      await this.db.write();

      logger.info('[MEETING_DATABASE] Meeting created', { meetingId: meeting.id });
      return meeting;
    } catch (error) {
      logger.error('[MEETING_DATABASE] Failed to create meeting:', error);
      throw new Error(`Failed to create meeting: ${error.message}`);
    }
  }

  /**
   * Get a meeting by ID
   * @param {string} meetingId - Meeting ID
   * @returns {Object|null} Meeting record or null if not found
   */
  async getMeeting(meetingId) {
    try {
      await this.db.read();
      const meeting = this.db.data.meetings.find(m => m.id === meetingId);
      return meeting || null;
    } catch (error) {
      logger.error('[MEETING_DATABASE] Failed to get meeting:', error);
      throw new Error(`Failed to get meeting: ${error.message}`);
    }
  }

  /**
   * Update a meeting record
   * @param {string} meetingId - Meeting ID
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated meeting record
   */
  async updateMeeting(meetingId, updates) {
    try {
      await this.db.read();
      const meetingIndex = this.db.data.meetings.findIndex(m => m.id === meetingId);
      
      if (meetingIndex === -1) {
        return null;
      }

      this.db.data.meetings[meetingIndex] = {
        ...this.db.data.meetings[meetingIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      this.db.data.lastUpdated = new Date().toISOString();
      await this.db.write();

      logger.info('[MEETING_DATABASE] Meeting updated', { meetingId });
      return this.db.data.meetings[meetingIndex];
    } catch (error) {
      logger.error('[MEETING_DATABASE] Failed to update meeting:', error);
      throw new Error(`Failed to update meeting: ${error.message}`);
    }
  }

  /**
   * Delete a meeting record
   * @param {string} meetingId - Meeting ID
   * @returns {boolean} True if deleted, false if not found
   */
  async deleteMeeting(meetingId) {
    try {
      await this.db.read();
      const meetingIndex = this.db.data.meetings.findIndex(m => m.id === meetingId);
      
      if (meetingIndex === -1) {
        return false;
      }

      this.db.data.meetings.splice(meetingIndex, 1);
      
      // Also delete associated summaries
      this.db.data.summaries = this.db.data.summaries.filter(s => s.recordingId !== meetingId);
      
      this.db.data.lastUpdated = new Date().toISOString();
      await this.db.write();

      logger.info('[MEETING_DATABASE] Meeting deleted', { meetingId });
      return true;
    } catch (error) {
      logger.error('[MEETING_DATABASE] Failed to delete meeting:', error);
      throw new Error(`Failed to delete meeting: ${error.message}`);
    }
  }

  /**
   * Get meetings with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Object} Paginated meeting results
   */
  async getMeetings(options = {}) {
    try {
      await this.db.read();
      
      const {
        page = 1,
        limit = 10,
        field = 'createdAt',
        order = 'desc',
        status = null,
      } = options;

      let meetings = [...this.db.data.meetings];

      // Apply status filter if provided
      if (status) {
        meetings = meetings.filter(m => m.status === status);
      }

      // Sort meetings
      meetings.sort((a, b) => {
        const aValue = a[field];
        const bValue = b[field];
        
        if (order === 'desc') {
          return bValue > aValue ? 1 : -1;
        } else {
          return aValue > bValue ? 1 : -1;
        }
      });

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedMeetings = meetings.slice(startIndex, endIndex);

      return {
        meetings: paginatedMeetings,
        total: meetings.length,
        page,
        limit,
        hasMore: endIndex < meetings.length,
      };
    } catch (error) {
      logger.error('[MEETING_DATABASE] Failed to get meetings:', error);
      throw new Error(`Failed to get meetings: ${error.message}`);
    }
  }

  /**
   * Save a meeting summary
   * @param {Object} summaryData - Summary data
   * @returns {Object} Saved summary record
   */
  async saveSummary(summaryData) {
    try {
      const summary = {
        ...summaryData,
        id: `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      };

      this.db.data.summaries.push(summary);
      this.db.data.lastUpdated = new Date().toISOString();
      await this.db.write();

      logger.info('[MEETING_DATABASE] Summary saved', { 
        summaryId: summary.id, 
        recordingId: summary.recordingId 
      });
      return summary;
    } catch (error) {
      logger.error('[MEETING_DATABASE] Failed to save summary:', error);
      throw new Error(`Failed to save summary: ${error.message}`);
    }
  }

  /**
   * Get summary for a meeting
   * @param {string} recordingId - Recording ID
   * @returns {Object|null} Summary record or null if not found
   */
  async getSummary(recordingId) {
    try {
      await this.db.read();
      const summary = this.db.data.summaries.find(s => s.recordingId === recordingId);
      return summary || null;
    } catch (error) {
      logger.error('[MEETING_DATABASE] Failed to get summary:', error);
      throw new Error(`Failed to get summary: ${error.message}`);
    }
  }

  /**
   * Get meeting statistics
   * @param {string} timeRange - Time range for statistics
   * @returns {Object} Meeting statistics
   */
  async getStatistics(timeRange) {
    try {
      await this.db.read();
      
      const now = new Date();
      let cutoffDate;

      switch (timeRange) {
        case '7d':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
        default:
          cutoffDate = new Date(0); // Beginning of time
          break;
      }

      const meetings = this.db.data.meetings.filter(m => 
        new Date(m.createdAt) >= cutoffDate
      );

      const totalMeetings = meetings.length;
      const totalDuration = meetings.reduce((sum, m) => sum + (m.duration || 0), 0);
      const averageDuration = totalMeetings > 0 ? totalDuration / totalMeetings : 0;
      const summariesGenerated = this.db.data.summaries.filter(s => 
        meetings.some(m => m.id === s.recordingId)
      ).length;

      // Calculate breakdown by status
      const breakdown = meetings.reduce((acc, m) => {
        acc[m.status] = (acc[m.status] || 0) + 1;
        return acc;
      }, {});

      return {
        totalMeetings,
        totalDuration,
        averageDuration,
        summariesGenerated,
        breakdown,
      };
    } catch (error) {
      logger.error('[MEETING_DATABASE] Failed to get statistics:', error);
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }

  /**
   * Cleanup old meeting records
   * @param {number} daysOld - Delete records older than this many days
   * @returns {number} Number of records deleted
   */
  async cleanup(daysOld = 90) {
    try {
      await this.db.read();
      
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
      const initialMeetingCount = this.db.data.meetings.length;
      const initialSummaryCount = this.db.data.summaries.length;

      // Filter out old meetings
      this.db.data.meetings = this.db.data.meetings.filter(m => 
        new Date(m.createdAt) >= cutoffDate
      );

      // Filter out summaries for deleted meetings
      const remainingMeetingIds = new Set(this.db.data.meetings.map(m => m.id));
      this.db.data.summaries = this.db.data.summaries.filter(s => 
        remainingMeetingIds.has(s.recordingId)
      );

      const deletedMeetings = initialMeetingCount - this.db.data.meetings.length;
      const deletedSummaries = initialSummaryCount - this.db.data.summaries.length;

      if (deletedMeetings > 0 || deletedSummaries > 0) {
        this.db.data.lastUpdated = new Date().toISOString();
        await this.db.write();
      }

      logger.info('[MEETING_DATABASE] Cleanup completed', {
        deletedMeetings,
        deletedSummaries,
        daysOld,
      });

      return deletedMeetings;
    } catch (error) {
      logger.error('[MEETING_DATABASE] Failed to cleanup:', error);
      throw new Error(`Failed to cleanup: ${error.message}`);
    }
  }
}
