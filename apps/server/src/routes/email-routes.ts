import express, { Request, Response } from 'express';
import EmailController from '../controllers/email/index.js';
import { asyncHandler, createRateLimit } from '../middleware/index.ts';

const router = express.Router();

const emailRateLimit = createRateLimit(60 * 60 * 1000, 10);
router.use(emailRateLimit);

router.post('/send', asyncHandler(EmailController.sendEmail));
router.post('/ai-compose', asyncHandler(EmailController.composeWithAI));
router.post('/ai-send', asyncHandler(EmailController.sendAIEmail));
router.get('/contacts/:query', asyncHandler(EmailController.searchContacts));

router.get('/status', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    service: 'Email Service',
    timestamp: new Date().toISOString(),
  });
});

export default router;
