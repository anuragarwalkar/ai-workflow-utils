import { Request, Response } from 'express';
import logger from '../../logger.ts';

import BitbucketService from './services/bit-bucket-service.js';
import PRReviewService from './services/pr-review-service.js';
import PRStreamingService from './services/pr-streaming-service.js';
import StreamingService from './services/streaming-service.js';
import PullRequest from './models/pull-request.js';
import ErrorHandler from './utils/error-handler.js';

class PRController {
  static async getPullRequests(req: Request, res: Response): Promise<void> {
    try {
      const { projectKey, repoSlug } = req.params;

      if (!projectKey || !repoSlug) {
        ErrorHandler.handleValidationError(
          'Project key and repository slug are required',
          res
        );
        return;
      }

      const data = await BitbucketService.getPullRequests(projectKey, repoSlug);
      res.json(data);
    } catch (error) {
      ErrorHandler.handleApiError(error, 'fetch pull requests', res);
    }
  }

  static async getPullRequestDiff(req: Request, res: Response): Promise<void> {
    try {
      const { projectKey, repoSlug, pullRequestId } = req.params;

      if (!projectKey || !repoSlug || !pullRequestId) {
        ErrorHandler.handleValidationError(
          'Project key, repository slug, and pull request ID are required',
          res
        );
        return;
      }

      const data = await BitbucketService.getPullRequestDiff(projectKey, repoSlug, pullRequestId);
      res.json(data);
    } catch (error) {
      ErrorHandler.handleApiError(error, 'fetch pull request diff', res);
    }
  }

  static async reviewPullRequest(req: Request, res: Response): Promise<void> {
    const {
      projectKey,
      repoSlug,
      pullRequestId,
      diffData,
      prDetails,
      streaming = true,
    } = req.body;

    try {
      logger.info(
        `Starting AI review for PR ${pullRequestId} using LangChain with custom templates (streaming: ${streaming})`
      );

      if (streaming) {
        StreamingService.setupSSE(res);
        StreamingService.sendStatus(res, 'Starting PR review...');
        StreamingService.sendStatus(res, 'Analyzing code changes...');
      }

      const result = await PRReviewService.reviewPullRequest(
        { diffData, prDetails },
        streaming,
        res
      );

      if (streaming) {
        StreamingService.sendReviewComplete(res, {
          review: result.review,
          projectKey,
          repoSlug,
          pullRequestId,
          aiProvider: result.aiProvider,
          reviewedAt: new Date().toISOString(),
        });

        StreamingService.closeSSE(res);
      } else {
        res.json({
          review: result.review,
          projectKey,
          repoSlug,
          pullRequestId,
          aiProvider: result.aiProvider,
          reviewedAt: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      logger.error('Error reviewing pull request:', error);

      if (res.headersSent) {
        if (error.name !== 'StreamingError') {
          StreamingService.sendError(res, error);
        }
        return;
      }

      if (streaming) {
        StreamingService.sendError(res, error);
      } else {
        res.status(500).json({
          error: 'Internal server error while reviewing pull request',
          message: error.message,
          details: error.response?.data || 'No additional details available',
        });
      }
    }
  }

  static async createPullRequest(req: Request, res: Response): Promise<void> {
    try {
      const {
        branchName,
        projectKey,
        repoSlug,
        customTitle,
        customDescription,
        ticketNumber = null,
      } = req.body;

      PullRequest.validate({
        title: customTitle,
        description: customDescription,
        fromBranch: branchName,
        projectKey,
        repoSlug,
      });

      const pullRequest = new PullRequest({
        title: customTitle,
        description: customDescription,
        fromBranch: branchName,
        projectKey,
        repoSlug,
        ticketNumber,
      });

      logger.info(
        `Creating pull request with title: "${customTitle}" from branch: "${branchName}"`
      );

      const data = await BitbucketService.createPullRequest(
        projectKey,
        repoSlug,
        pullRequest.toBitbucketPayload()
      );

      logger.info(`Pull request created successfully from branch: "${branchName}"`);

      res.status(201).json(
        pullRequest.toResponsePayload({
          pullRequestId: data.id,
          pullRequestUrl: data.links?.self?.[0]?.href,
        })
      );
    } catch (error: any) {
      logger.error('Error creating pull request:', error);
      if (error.response) {
        res.status(error.response.status).json({
          error: 'Failed to create pull request',
          details: error.response.data,
          status: error.response.status,
        });
        return;
      }
      res.status(500).json({
        error: 'Internal server error while creating pull request',
        message: error.message,
      });
    }
  }

  static async streamCreatePRPreview(req: Request, res: Response): Promise<void> {
    try {
      await PRStreamingService.handleStreamingPRPreview(req, res);
    } catch (error: any) {
      logger.error('Error in streamCreatePRPreview:', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal server error while generating PR preview',
          message: error.message,
        });
      }
    }
  }

  static async addComment(req: Request, res: Response): Promise<void> {
    try {
      const { projectKey, repoSlug, pullRequestId } = req.params;
      const { commentText, anchor, parent } = req.body;

      if (!projectKey || !repoSlug || !pullRequestId) {
        ErrorHandler.handleValidationError(
          'Project key, repository slug, and pull request ID are required',
          res
        );
        return;
      }

      if (!commentText) {
        ErrorHandler.handleValidationError('Comment text is required', res);
        return;
      }

      logger.info(
        `Adding comment to PR ${pullRequestId} in ${projectKey}/${repoSlug}`
      );

      const data = await BitbucketService.addPullRequestComment(
        projectKey,
        repoSlug,
        pullRequestId,
        commentText,
        anchor,
        parent
      );

      res.status(201).json(data);
    } catch (error: any) {
      logger.error('Error adding pull request comment:', error);
      if (error.response) {
        res.status(error.response.status).json({
          error: 'Failed to add pull request comment',
          details: error.response.data,
          status: error.response.status,
        });
        return;
      }
      res.status(500).json({
        error: 'Internal server error while adding pull request comment',
        message: error.message,
      });
    }
  }

  static async getActivities(req: Request, res: Response): Promise<void> {
    try {
      const { projectKey, repoSlug, pullRequestId } = req.params;

      if (!projectKey || !repoSlug || !pullRequestId) {
        ErrorHandler.handleValidationError(
          'Project key, repository slug, and pull request ID are required',
          res
        );
        return;
      }

      const data = await BitbucketService.getPullRequestActivities(
        projectKey,
        repoSlug,
        pullRequestId
      );

      res.json(data);
    } catch (error: any) {
      ErrorHandler.handleApiError(error, 'fetch pull request activities', res);
    }
  }
}

export const {
  getPullRequests,
  getPullRequestDiff,
  reviewPullRequest,
  createPullRequest,
  streamCreatePRPreview,
  addComment,
  getActivities,
} = PRController;

export default PRController;
