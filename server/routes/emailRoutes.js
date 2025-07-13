import express from 'express';
import emailController from '../controllers/emailController.js';
import { asyncHandler, createRateLimit } from '../middleware/index.js';

const router = express.Router();

// Apply rate limiting for email routes (more restrictive)
const emailRateLimit = createRateLimit(60 * 60 * 1000, 10); // 10 emails per hour
router.use(emailRateLimit);

// Route for sending email
router.post('/send', asyncHandler(emailController.sendEmail));

// Route for email status/health check
router.get('/status', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Email Service',
    timestamp: new Date().toISOString()
  });
});

export default router;
