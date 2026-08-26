import express from 'express';
import {
  createPullRequest,
  getPullRequestDiff,
  getPullRequests,
  reviewPullRequest,
  streamCreatePRPreview,
  addComment,
} from '../controllers/pull-request/index.js';
import { asyncHandler, createRateLimit } from '../middleware/index.ts';

const router = express.Router();

const prRateLimit = createRateLimit(15 * 60 * 1000, 30);
router.use(prRateLimit);

router.get('/:projectKey/:repoSlug/pull-requests', asyncHandler(getPullRequests));
router.get('/:projectKey/:repoSlug/pull-requests/:pullRequestId/diff', asyncHandler(getPullRequestDiff));
router.post('/review', asyncHandler(reviewPullRequest));
router.post('/create', asyncHandler(createPullRequest));
router.post('/stream-preview', asyncHandler(streamCreatePRPreview));
router.post('/:projectKey/:repoSlug/pull-requests/:pullRequestId/comments', asyncHandler(addComment));

export default router;
