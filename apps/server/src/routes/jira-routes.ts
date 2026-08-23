import express, { Request, Response, NextFunction } from 'express';
import {
  createJiraIssueHandler,
  enhanceDescriptionHandler,
  fetchJiraSummariesHandler,
  formatCommentHandler,
  generateCommentReplyHandler,
  getJiraIssue,
  previewBugReport,
  uploadImage,
} from '../controllers/jira/handlers/jira-handlers.js';
import {
  fetchAllCustomFieldsHandler,
  fetchCustomFieldValuesHandler,
} from '../controllers/jira/handlers/custom-field-handlers.js';
import { createRateLimit } from '../middleware/index.ts';
import multer from 'multer';
import path from 'path';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const jiraRateLimit = createRateLimit(15 * 60 * 1000, 50);
router.use(jiraRateLimit);

router.post('/summaries', fetchJiraSummariesHandler);
router.post('/preview', previewBugReport);
router.post('/generate', createJiraIssueHandler);

router.post(
  '/upload',
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
          return;
        }
        res.status(400).json({ error: `Upload error: ${err.message}` });
        return;
      } else if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      next();
    });
  },
  uploadImage
);

router.get('/issue/:id', getJiraIssue);
router.post('/ai/enhance-description', enhanceDescriptionHandler);
router.post('/ai/generate-comment-reply', generateCommentReplyHandler);
router.post('/ai/format-comment', formatCommentHandler);

router.get('/custom-fields', fetchAllCustomFieldsHandler);
router.get('/custom-fields/:fieldId/values/:projectKey', fetchCustomFieldValuesHandler);

export default router;
