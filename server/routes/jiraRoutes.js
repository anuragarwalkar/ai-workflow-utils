import express from 'express';
import jiraController from '../controllers/jiraController.js';
import { asyncHandler, createRateLimit } from '../middleware/index.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer with better options
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Apply rate limiting to all routes
const jiraRateLimit = createRateLimit(15 * 60 * 1000, 50); // 50 requests per 15 minutes
router.use(jiraRateLimit);

// Route for preview bug report
router.post('/preview', asyncHandler(jiraController.previewBugReport));

// Route for generating Jira issue
router.post('/generate', asyncHandler(jiraController.createJiraIssue));

// Route for uploading files with error handling
router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, asyncHandler(jiraController.uploadImage));

// Route for fetching a Jira issue by ID
router.get('/issue/:id', asyncHandler(jiraController.getJiraIssue));

// Route for creating pull requests
router.post('/create-pr', asyncHandler(jiraController.createPullRequest));

export default router;
