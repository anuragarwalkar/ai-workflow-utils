import express from 'express';
import { getPullRequests, getPullRequestDiff, reviewPullRequest, createPullRequest, streamPRPreview } from '../controllers/prController.js';
import { asyncHandler, createRateLimit } from '../middleware/index.js';

const router = express.Router();

// Apply rate limiting to all routes
const prRateLimit = createRateLimit(15 * 60 * 1000, 30); // 30 requests per 15 minutes
router.use(prRateLimit);

// Route to get pull requests for a project/repo
router.get('/:projectKey/:repoSlug/pull-requests', asyncHandler(getPullRequests));

// Route to get diff for a specific pull request
router.get('/:projectKey/:repoSlug/pull-requests/:pullRequestId/diff', asyncHandler(getPullRequestDiff));

// Route to review a pull request using AI
router.post('/review', asyncHandler(reviewPullRequest));

// Route to create a pull request
router.post('/create', asyncHandler(createPullRequest));

// Route to stream PR preview generation
router.post('/stream-preview', asyncHandler(streamPRPreview));

export default router;
