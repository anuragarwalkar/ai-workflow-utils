import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  deleteMeeting,
  generateSummary,
  generateSummaryStreaming,
  getActiveRecordingsEndpoint,
  getAudioSources,
  getHistory,
  getRecordingStatus,
  getStats,
  serveAudioFile,
  startRecording,
  stopRecording,
} from '../controllers/meeting/meeting-controller.js';

const router = express.Router();

// Configure multer for audio file uploads
const audioStorage = multer.diskStorage({
  destination(req, file, cb) {
    // Store in uploads/meetings directory
    cb(null, 'uploads/meetings/');
  },
  filename(req, file, cb) {
    // Use recording ID and timestamp for unique filename
    const { recordingId } = req.params;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `recording-${recordingId}-${timestamp}${ext}`);
  }
});

const uploadAudio = multer({
  storage: audioStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for audio files
  },
  fileFilter(req, file, cb) {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

/**
 * Meeting Routes - RESTful API endpoints for meeting operations
 * Follows the same pattern as other route files in the project
 */

// Meeting recording endpoints
router.post('/recording/start', startRecording);
// Route: Stop a recording
router.post('/stop/:recordingId', uploadAudio.single('audioFile'), stopRecording);
router.get('/recording/:recordingId/status', getRecordingStatus);
router.get('/recordings/active', getActiveRecordingsEndpoint);

// Meeting summary endpoints
router.post('/summary/:recordingId', generateSummary);
router.post('/summary/:recordingId/stream', generateSummaryStreaming);

// Meeting history and management
router.get('/history', getHistory);
router.delete('/:recordingId', deleteMeeting);
router.get('/stats', getStats);

// Audio configuration endpoints
router.get('/audio/sources', getAudioSources);

// Audio file serving endpoint
router.get('/:recordingId/audio', serveAudioFile);

export default router;
