import logger from '../../../logger.js';
import BitbucketService from './bit-bucket-service.js';
import PRContentGenerationService from './pr-content-generation-service.js';
import StreamingService from './streaming-service.js';
import { prLangChainService } from '../../../services/langchain/index.js';

/**
 * Service for handling PR streaming operations
 */
class PRStreamingService {
  /**
   * Stream PR preview generation
   */
  static async streamCreatePRPreview(requestData) {
    const { ticketNumber, branchName, projectKey, repoSlug } = requestData;

    if (!branchName || !projectKey || !repoSlug) {
      throw new Error('branchName, projectKey, and repoSlug are required');
    }

    let commits = [];

    try {
      // Fetch commit messages from the branch
      commits = await BitbucketService.getCommitMessages(projectKey, repoSlug, branchName);

      if (commits.length > 0) {
        // Generate PR content using AI
        return await PRContentGenerationService.generateAIContent(
          commits,
          ticketNumber,
          branchName
        );
      } else {
        logger.warn(`No commits found for branch ${branchName}, using fallback title/description`);
        return this.generateFallbackContent(ticketNumber, branchName, []);
      }
    } catch (error) {
      logger.info(`AI generation not available, using basic title/description: ${error.message}`);
      // Use commits if available from previous fetch attempt
      const commitsForFallback = commits || [];
      return this.generateFallbackContent(ticketNumber, branchName, commitsForFallback);
    }
  }

  /**
   * Generate fallback content for PR preview
   */
  static generateFallbackContent(ticketNumber, branchName, commits) {
    const fallbackResult = PRContentGenerationService.generateFallbackContent(
      ticketNumber,
      branchName,
      null, // no response object for non-streaming
      commits
    );

    const finalTitle = PRContentGenerationService.applyCommitTypePrefix(
      fallbackResult.prTitle,
      commits,
      ticketNumber
    );

    return {
      title: finalTitle,
      description: fallbackResult.prDescription,
      aiGenerated: false,
      ticketNumber,
      branchName,
    };
  }

  /**
   * Handle streaming PR preview with response object
   */
  static async handleStreamingPRPreview(req, res) {
    const { ticketNumber, branchName, projectKey, repoSlug } = req.body;

    if (!branchName || !projectKey || !repoSlug) {
      return res.status(400).json({
        error: 'branchName, projectKey, and repoSlug are required',
      });
    }

    try {
      // Set up Server-Sent Events
      StreamingService.setupSSE(res);

      // Send initial status
      StreamingService.sendStatus(res, 'Starting PR preview generation...');

      let commits = [];

      try {
        // Send status update
        StreamingService.sendStatus(res, 'Fetching commit messages...');

        // Fetch commit messages from the branch
        commits = await BitbucketService.getCommitMessages(projectKey, repoSlug, branchName);

        if (commits.length > 0) {
          // Generate PR content using AI
          StreamingService.sendStatus(res, 'Generating PR title and description...');

          await PRContentGenerationService.generateAIContent(
            commits,
            ticketNumber,
            branchName,
            res
          );
        } else {
          logger.warn(
            `No commits found for branch ${branchName}, using fallback title/description`
          );
          const fallbackResult = PRContentGenerationService.generateFallbackContent(
            ticketNumber,
            branchName,
            res,
            []
          );
          const finalTitle = PRContentGenerationService.applyCommitTypePrefix(
            fallbackResult.prTitle,
            [],
            ticketNumber
          );
          prLangChainService.sendFinalResults(
            res,
            finalTitle,
            fallbackResult.prDescription,
            false,
            ticketNumber,
            branchName
          );
        }
      } catch (aiError) {
        logger.info(
          `AI generation not available, using basic title/description: ${aiError.message}`
        );
        // Use commits if available from previous fetch attempt
        const commitsForFallback = commits || [];
        const fallbackResult = PRContentGenerationService.generateFallbackContent(
          ticketNumber,
          branchName,
          res,
          commitsForFallback
        );
        const finalTitle = PRContentGenerationService.applyCommitTypePrefix(
          fallbackResult.prTitle,
          commitsForFallback,
          ticketNumber
        );
        prLangChainService.sendFinalResults(
          res,
          finalTitle,
          fallbackResult.prDescription,
          false,
          ticketNumber,
          branchName
        );
      }

      StreamingService.closeSSE(res);
    } catch (error) {
      StreamingService.sendError(res, error);
    }
  }
}

export default PRStreamingService;
