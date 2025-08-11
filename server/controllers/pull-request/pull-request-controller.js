import logger from '../../logger.js';

// Import modular services and utilities
import BitbucketService from './services/bit-bucket-service.js';
import PRReviewService from './services/pr-review-service.js';
import PRStreamingService from './services/pr-streaming-service.js';
import StreamingService from './services/streaming-service.js';
import PullRequest from './models/pull-request.js';
import ErrorHandler from './utils/error-handler.js';

/**
 * Modular PR Controller with separated concerns
 */
class PRController {
  /**
   * Get pull requests for a specific project and repository
   */
  static async getPullRequests(req, res) {
    try {
      const { projectKey, repoSlug } = req.params;

      if (!projectKey || !repoSlug) {
        return ErrorHandler.handleValidationError(
          'Project key and repository slug are required',
          res
        );
      }

      const data = await BitbucketService.getPullRequests(projectKey, repoSlug);
      res.json(data);
    } catch (error) {
      ErrorHandler.handleApiError(error, 'fetch pull requests', res);
    }
  }

  /**
   * Get diff for a specific pull request
   */
  static async getPullRequestDiff(req, res) {
    try {
      const { projectKey, repoSlug, pullRequestId } = req.params;

      if (!projectKey || !repoSlug || !pullRequestId) {
        return ErrorHandler.handleValidationError(
          'Project key, repository slug, and pull request ID are required',
          res
        );
      }

      const data = await BitbucketService.getPullRequestDiff(projectKey, repoSlug, pullRequestId);
      res.json(data);
    } catch (error) {
      ErrorHandler.handleApiError(error, 'fetch pull request diff', res);
    }
  }

  /**
   * Review pull request using LangChain service with streaming support
   */
  static async reviewPullRequest(req, res) {
    try {
      const {
        projectKey,
        repoSlug,
        pullRequestId,
        diffData,
        prDetails,
        streaming = true,
      } = req.body;

      logger.info(
        `Starting AI review for PR ${pullRequestId} using LangChain with custom templates (streaming: ${streaming})`
      );

      // Set up streaming if requested
      if (streaming) {
        StreamingService.setupSSE(res);
        StreamingService.sendStatus(res, 'Starting PR review...');
        StreamingService.sendStatus(res, 'Analyzing code changes...');
      }

      // Use the new PRReviewService
      const result = await PRReviewService.reviewPullRequest(
        { diffData, prDetails },
        streaming,
        res // pass response object for streaming
      );

      if (streaming) {
        // Send final results
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
    } catch (error) {
      logger.error('Error reviewing pull request:', error);

      if (res.headersSent) {
        // If streaming and headers already sent, just close
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

  /**
   * Create PR with provided title and description
   */
  static async createPullRequest(req, res) {
    try {
      const {
        branchName,
        projectKey,
        repoSlug,
        customTitle,
        customDescription,
        ticketNumber = null,
      } = req.body;

      // Validate input
      PullRequest.validate({
        title: customTitle,
        description: customDescription,
        fromBranch: branchName,
        projectKey,
        repoSlug,
      });

      // Create PR model
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

      // Create PR via Bitbucket service
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
    } catch (error) {
      logger.error('Error creating pull request:', error);
      if (error.response) {
        return res.status(error.response.status).json({
          error: 'Failed to create pull request',
          details: error.response.data,
          status: error.response.status,
        });
      }
      res.status(500).json({
        error: 'Internal server error while creating pull request',
        message: error.message,
      });
    }
  }

  /**
   * Stream PR preview generation
   */
  static async streamCreatePRPreview(req, res) {
    try {
      await PRStreamingService.handleStreamingPRPreview(req, res);
    } catch (error) {
      logger.error('Error in streamCreatePRPreview:', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal server error while generating PR preview',
          message: error.message,
        });
      }
    }
  }
}

// Export controller methods for backward compatibility
export const {
  getPullRequests,
  getPullRequestDiff,
  reviewPullRequest,
  createPullRequest,
  streamCreatePRPreview,
} = PRController;

export default PRController;
