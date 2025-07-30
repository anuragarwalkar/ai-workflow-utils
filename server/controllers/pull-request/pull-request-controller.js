import logger from "../../logger.js";
import { prLangChainService, langChainServiceFactory } from "../../services/langchain/index.js";

// Import modular services and utilities
import BitbucketService from "./services/bit-bucket-service.js";
import DiffProcessorService from "./services/diff-processor-service.js";
import PRContentService from "./services/pr-content-service.js";
import StreamingService from "./services/streaming-service.js";
import PullRequest from "./models/pull-request.js";
import ErrorHandler from "./utils/error-handler.js";

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
        `Creating pull request with title: "${customTitle}" from branch: "${branchName}"`
      );

      // Create PR via Bitbucket service
      const data = await BitbucketService.createPullRequest(
        projectKey,
        repoSlug,
        pullRequest.toBitbucketPayload()
      );

      logger.info(`Pull request created successfully from branch: "${branchName}"`);

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
   * Parse combined AI content to extract title and description
   */
  static parseCombinedContent(content) {
    const trimmedContent = content.trim();
    
    // Try to parse structured output (title and description)
    const titleMatch = trimmedContent.match(/(?:title|TITLE)[:\s]*([^\n]+)/i);
    const descMatch = trimmedContent.match(/(?:description|DESCRIPTION)[:\s]*([\s\S]+)/i);
    
    if (titleMatch && descMatch) {
      return {
        title: titleMatch[1].trim().replace(/['"]/g, ''),
        description: descMatch[1].trim().replace(/['"]/g, '')
      };
    }
    
    // Fallback: split by lines and assume first line is title, rest is description
    const lines = trimmedContent.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      const title = lines[0].trim();
      const description = lines.slice(1).join('\n').trim() || 
        `## Summary\nThis PR contains changes based on the commit history.\n\n## Changes Made\n- Implementation updates`;
      return { title, description };
    }
    
    return { title: "", description: "" };
  }

  /**
   * Generate AI content for PR using combined template with streaming
   */
  static async generateAIContent(commits, ticketNumber, branchName, res) {
    const commitMessages = commits
      .map((commit) => `- ${commit.message} (by ${commit.author})`)
      .join("\n");

    try {
      // Use prLangChainService directly for streaming (no prefix during streaming)
      const result = await prLangChainService.streamPRContent(
        { commitMessages },
        "PR_COMBINED",
        res
      );

      const processedContent = PRController.processStreamResult(result, commits, ticketNumber);
      
      // Apply prefix to the final title before sending
      const finalTitle = PRController.applyCommitTypePrefix(processedContent.prTitle, commits, ticketNumber);
      
      // Send final complete results using prLangChainService
      prLangChainService.sendFinalResults(
        res, 
        finalTitle, 
        processedContent.prDescription, 
        processedContent.aiGenerated, 
        ticketNumber, 
        branchName
      );

      logger.info(`Successfully generated AI-powered PR content using PR_COMBINED template (${result.provider})`);

      return processedContent;
    } catch (aiError) {
      logger.warn(`AI generation failed, using fallback: ${aiError.message}`);
      
      const fallbackContent = PRController.generateFallbackPRContent(commits, ticketNumber, branchName);
      
      // Apply prefix to the final title before sending
      const finalTitle = PRController.applyCommitTypePrefix(fallbackContent.prTitle, commits, ticketNumber);
      
      // Send fallback results using prLangChainService
      prLangChainService.sendFinalResults(
        res, 
        finalTitle, 
        fallbackContent.prDescription, 
        false, 
        ticketNumber, 
        branchName
      );

      return fallbackContent;
    }
  }

  /**
   * Process streaming result and extract PR content
   */
  static processStreamResult(result, commits, ticketNumber) {
    if (!result.content) {
      return PRController.generateEmptyContent(commits, ticketNumber);
    }

    // Use the parsed title and description from streaming
    if (result.parsedTitle || result.parsedDescription) {
      return PRController.buildPRFromParsed(result, commits, ticketNumber);
    }

    // Fallback parsing if streaming parsing didn't work
    const parsed = PRController.parseCombinedContent(result.content);
    if (parsed.title) {
      return PRController.buildPRFromParsed({ parsedTitle: parsed.title, parsedDescription: parsed.description }, commits, ticketNumber);
    }

    return PRController.generateEmptyContent(commits, ticketNumber);
  }

  /**
   * Build PR content from parsed results
   */
  static buildPRFromParsed(parsedResult, commits, ticketNumber) {
    // Simply use the parsed title and description without any prefix manipulation
    // Prefix will be applied at the final response level
    const finalTitle = parsedResult.parsedTitle || "Update implementation";
    
    return {
      prTitle: finalTitle,
      prDescription: parsedResult.parsedDescription || `## Summary\nThis PR contains changes based on commit history.\n\n## Changes Made\n- Implementation updates`,
      aiGenerated: true
    };
  }

  /**
   * Generate empty/fallback PR content
   */
  static generateEmptyContent(commits, ticketNumber) {
    return {
      prTitle: "Update implementation",
      prDescription: `## Summary\nThis PR contains changes based on commit history.\n\n## Changes Made\n- Implementation updates`,
      aiGenerated: false
    };
  }

  /**
   * Generate fallback PR content when AI fails
   */
  static generateFallbackPRContent(commits, ticketNumber, branchName) {
    const prTitle = "Update implementation";
    
    const ticketRef = ticketNumber ? `for ticket ${ticketNumber}` : `from branch ${branchName}`;
    const prDescription = `## Summary\nThis PR contains changes ${ticketRef}.\n\n## Changes Made\n- Implementation updates based on commit history`;
    
    return { prTitle, prDescription, aiGenerated: false };
  }

  /**
   * Apply commit type prefix to PR title
   */
  static applyCommitTypePrefix(title, commits, ticketNumber) {
    const commitType = PRContentService.analyzeCommitType(commits);
    const ticketPrefix = ticketNumber ? `${commitType}(${ticketNumber}): ` : `${commitType}: `;
    return `${ticketPrefix}${title}`;
  }

  /**
   * Helper method to generate and send fallback content
   */
  static generateFallbackContent(ticketNumber, branchName, res, commits = []) {
    const baseTitle = ticketNumber ? `${ticketNumber}` : `Update from ${branchName}`;
    
    const fallbackDescription = ticketNumber 
      ? `This PR contains changes for ticket ${ticketNumber} from branch ${branchName}.`
      : `This PR contains changes from branch ${branchName}.`;

    // Send fallback data (without prefix - will be added in final response)
    StreamingService.sendSSEData(res, { type: "title_complete", data: baseTitle });
    StreamingService.sendSSEData(res, {
      type: "description_complete",
      data: fallbackDescription,
    });

    return { prTitle: baseTitle, prDescription: fallbackDescription };
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
      // Set up Server-Sent Events using existing StreamingService
      StreamingService.setupSSE(res);

      // Send initial status
      StreamingService.sendStatus(res, "Starting PR preview generation...");

      let commits = [];

      try {
        // Send status update
        StreamingService.sendStatus(res, "Fetching commit messages...");

        // Fetch commit messages from the branch
        commits = await BitbucketService.getCommitMessages(projectKey, repoSlug, branchName);

        if (commits.length > 0) {
          // Generate PR content using prLangChainService directly
          StreamingService.sendStatus(res, "Generating PR title and description...");
          
          await PRController.generateAIContent(commits, ticketNumber, branchName, res);
        } else {
          logger.warn(
            `No commits found for branch ${branchName}, using fallback title/description`
          );
          const fallbackResult = PRController.generateFallbackContent(ticketNumber, branchName, res, []);
          const finalTitle = PRController.applyCommitTypePrefix(fallbackResult.prTitle, [], ticketNumber);
          prLangChainService.sendFinalResults(res, finalTitle, fallbackResult.prDescription, false, ticketNumber, branchName);
        }
      } catch (ollamaError) {
        logger.info(
          `AI generation not available, using basic title/description: ${ollamaError.message}`
        );
        // Use commits if available from previous fetch attempt
        const commitsForFallback = commits || [];
        const fallbackResult = PRController.generateFallbackContent(ticketNumber, branchName, res, commitsForFallback);
        const finalTitle = PRController.applyCommitTypePrefix(fallbackResult.prTitle, commitsForFallback, ticketNumber);
        prLangChainService.sendFinalResults(res, finalTitle, fallbackResult.prDescription, false, ticketNumber, branchName);
      }

      StreamingService.closeSSE(res);
    } catch (error) {
      StreamingService.sendError(res, error);
    }
  }
}

// Export controller methods for backward compatibility
export const {
  getPullRequests,
  getPullRequestDiff,
  reviewPullRequest,
  createPullRequest,
  streamPRPreview,
} = PRController;

export default PRController;
