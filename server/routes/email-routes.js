import express from 'express';
import EmailController from '../controllers/email/index.js';
import { asyncHandler, createRateLimit } from '../middleware/index.js';

const router = express.Router();

// Apply rate limiting for email routes (more restrictive)
const emailRateLimit = createRateLimit(60 * 60 * 1000, 10); // 10 emails per hour
router.use(emailRateLimit);

// Route for sending email (legacy)
router.post('/send', asyncHandler(EmailController.sendEmail));

// Route for AI email composition
router.post('/ai-compose', asyncHandler(EmailController.composeWithAI));

// Route for sending AI composed email
router.post('/ai-send', asyncHandler(EmailController.sendAIEmail));

// Route for email contacts lookup
router.get('/contacts/:query', asyncHandler(EmailController.searchContacts));

// Route for email status/health check
router.get('/status', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Email Service',
    timestamp: new Date().toISOString(),
  });
});

export default router;
