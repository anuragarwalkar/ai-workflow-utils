import logger from "../../logger.js";
import { prLangChainService, langChainServiceFactory } from "../../services/langchain/index.js";

// Import modular services and utilities
import BitbucketService from "./services/bitbucketService.js";
import DiffProcessorService from "./services/diffProcessorService.js";
import PRContentService from "./services/prContentService.js";
import StreamingService from "./services/streamingService.js";
import PullRequest from "./models/PullRequest.js";
import ErrorHandler from "./utils/errorHandler.js";

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
          "Project key and repository slug are required", 
          res
        );
      }

      const data = await BitbucketService.getPullRequests(projectKey, repoSlug);
      res.json(data);
    } catch (error) {
      ErrorHandler.handleApiError(error, "fetch pull requests", res);
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
          "Project key, repository slug, and pull request ID are required",
          res
        );
      }

      const data = await BitbucketService.getPullRequestDiff(projectKey, repoSlug, pullRequestId);
      res.json(data);
    } catch (error) {
      ErrorHandler.handleApiError(error, "fetch pull request diff", res);
    }
  }

  /**
   * Review pull request using LangChain service with customizable templates
   */
  static async reviewPullRequest(req, res) {
    try {
      const { projectKey, repoSlug, pullRequestId, diffData, prDetails } = req.body;

      if (!diffData) {
        return res.status(400).json({
          error: "Diff data is required for review",
        });
      }

      logger.info(`Starting AI review for PR ${pullRequestId} using LangChain with custom templates`);

      // Prepare the prompt data
      const promptData = DiffProcessorService.buildReviewPromptData(diffData, prDetails);

      if (!langChainServiceFactory.hasProviders()) {
        throw new Error("No AI providers are configured in LangChain service");
      }

      let review = null;
      let aiProvider = "unknown";

      try {
        console.log('promptData:', promptData);
        
        // Ensure all required template variables are present
        if (!promptData.prTitle || !promptData.prDescription || !promptData.prAuthor || !promptData.codeChanges) {
          logger.warn('Missing required template variables:', {
            prTitle: !!promptData.prTitle,
            prDescription: !!promptData.prDescription,
            prAuthor: !!promptData.prAuthor,
            codeChanges: !!promptData.codeChanges
          });
        }
        
        // Use specialized PR LangChain service for review generation
        const result = await prLangChainService.generateContent(
          promptData,
          null, // no images for PR review
          "PR_REVIEW",
          false // not streaming
        );
        
        if (!result.content || result.content.trim() === '') {
          throw new Error('AI provider returned empty content');
        }
        
        review = result.content;
        aiProvider = result.provider;
        
        logger.info(`Successfully generated review using LangChain with ${aiProvider}`);
      } catch (langchainError) {
        console.log('langchainError:', langchainError);
        logger.error("LangChain review failed:", langchainError.message);
        return res.status(500).json({
          error: "No review content could be generated",
          details: langchainError.message,
        });
      }

      logger.info(`Successfully generated AI review for PR ${pullRequestId} using ${aiProvider}`);

      res.json({
        review,
        projectKey,
        repoSlug,
        pullRequestId,
        aiProvider,
        reviewedAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error reviewing pull request:", error);
      res.status(500).json({
        error: "Internal server error while reviewing pull request",
        message: error.message,
        details: error.response?.data || "No additional details available",
      });
    }
  }

  /**
   * Create PR with provided title and description
   */
  static async createPullRequest(req, res) {
    try {
      const {
        ticketNumber,
        branchName,
        projectKey,
        repoSlug,
        customTitle,
        customDescription,
      } = req.body;

      // Validate input
      PullRequest.validate({
        title: customTitle,
        description: customDescription,
        fromBranch: branchName,
        projectKey,
        repoSlug
      });

      // Create PR model
      const pullRequest = new PullRequest({
        title: customTitle,
        description: customDescription,
        fromBranch: branchName,
        projectKey,
        repoSlug,
        ticketNumber
      });

      logger.info(
        `Creating pull request for ticket ${ticketNumber} with title: "${customTitle}"`
      );

      // Create PR via Bitbucket service
      const data = await BitbucketService.createPullRequest(
        projectKey,
        repoSlug,
        pullRequest.toBitbucketPayload()
      );

      logger.info(`Pull request created successfully for ticket ${ticketNumber}`);

      res.status(201).json(pullRequest.toResponsePayload({
        pullRequestId: data.id,
        pullRequestUrl: data.links?.self?.[0]?.href,
      }));
    } catch (error) {
      logger.error("Error creating pull request:", error);
      if (error.response) {
        return res.status(error.response.status).json({
          error: "Failed to create pull request",
          details: error.response.data,
          status: error.response.status,
        });
      }
      res.status(500).json({
        error: "Internal server error while creating pull request",
        message: error.message,
      });
    }
  }

  /**
   * Stream PR preview generation
   */
  static async streamPRPreview(req, res) {
    const { ticketNumber, branchName, projectKey, repoSlug } = req.body;

    if (!branchName || !projectKey || !repoSlug) {
      return res.status(400).json({
        error: "branchName, projectKey, and repoSlug are required",
      });
    }

    try {
      // Set up Server-Sent Events
      StreamingService.setupSSE(res);

      // Send initial status
      StreamingService.sendStatus(res, "Starting PR preview generation...");

      let prTitle = "";
      let prDescription = "";
      let aiGenerated = false;

      try {
        // Send status update
        StreamingService.sendStatus(res, "Fetching commit messages...");

        // Fetch commit messages from the branch
        const commits = await BitbucketService.getCommitMessages(projectKey, repoSlug, branchName);

        if (commits.length > 0) {
          // Use structured output to generate both title and description in a single call
          const prContent = await PRContentService.generatePRContentStructured(
            commits,
            ticketNumber,
            branchName,
            (progress) => {
              StreamingService.sendProgress(res, progress);
            }
          );

          prTitle = prContent.title;
          prDescription = prContent.description;
          aiGenerated = prContent.aiGenerated;

          // Send complete title
          StreamingService.sendSSEData(res, {
            type: "title_complete",
            data: prTitle,
          });

          // Send complete description
          StreamingService.sendSSEData(res, {
            type: "description_complete",
            data: prDescription,
          });

          logger.info(`Successfully generated AI-powered PR content using structured output (${prContent.provider})`);
        } else {
          logger.warn(
            `No commits found for branch ${branchName}, using fallback title/description`
          );
          const fallbackTitle = ticketNumber ? `${ticketNumber}` : `Update from ${branchName}`;
          const fallbackDescription = ticketNumber 
            ? `This PR contains changes for ticket ${ticketNumber} from branch ${branchName}.`
            : `This PR contains changes from branch ${branchName}.`;
          
          prTitle = fallbackTitle;
          prDescription = fallbackDescription;

          // Send fallback data
          StreamingService.sendSSEData(res, {
            type: "title_complete",
            data: prTitle,
          });
          StreamingService.sendSSEData(res, {
            type: "description_complete",
            data: prDescription,
          });
        }
      } catch (ollamaError) {
        logger.info(
          `AI generation not available, using basic title/description: ${ollamaError.message}`
        );
        const fallbackTitle = ticketNumber ? `${ticketNumber}` : `Update from ${branchName}`;
        const fallbackDescription = ticketNumber 
          ? `This PR contains changes for ticket ${ticketNumber} from branch ${branchName}.`
          : `This PR contains changes from branch ${branchName}.`;
        
        prTitle = fallbackTitle;
        prDescription = fallbackDescription;

        // Send fallback data
        StreamingService.sendSSEData(res, { type: "title_complete", data: prTitle });
        StreamingService.sendSSEData(res, {
          type: "description_complete",
          data: prDescription,
        });
      }

      // Send completion event
      StreamingService.sendComplete(res, {
        prTitle,
        prDescription,
        aiGenerated,
        ticketNumber,
        branchName,
      });

      StreamingService.closeSSE(res);
    } catch (error) {
      StreamingService.sendError(res, error);
    }
  }

  /**
   * Generate PR content (exposed for compatibility)
   */
  static async generatePRContentStructured(commits, ticketNumber, branchName, onProgress) {
    return PRContentService.generatePRContentStructured(commits, ticketNumber, branchName, onProgress);
  }
}

// Export controller methods for backward compatibility
export const {
  getPullRequests,
  getPullRequestDiff,
  reviewPullRequest,
  createPullRequest,
  streamPRPreview,
  generatePRContentStructured,
} = PRController;

export default PRController;
