import logger from '../../../logger.js';
import { langChainServiceFactory, prLangChainService } from '../../../services/langchain/index.js';
import StreamingService from './streaming-service.js';
import DiffProcessorService from './diff-processor-service.js';

/**
 * Service for handling PR review operations
 */
class PRReviewService {
  /**
   * Review pull request using LangChain service with streaming support
   */
  static async reviewPullRequest(reviewData, streaming = true, res = null) {
    const { diffData, prDetails } = reviewData;

    if (!diffData) {
      throw new Error('Diff data is required for review');
    }

    logger.info(
      `Starting AI review using LangChain with custom templates (streaming: ${streaming})`
    );

    // Prepare the prompt data
    const promptData = await DiffProcessorService.buildReviewPromptData(diffData, prDetails);

    if (!langChainServiceFactory.hasProviders()) {
      throw new Error('No AI providers are configured in LangChain service');
    }

    return await this.generateReview(promptData, streaming, res);
  }

  /**
   * Generate review content using AI providers
   */
  static async generateReview(promptData, streaming, res = null) {
    let review = null;
    let aiProvider = 'unknown';

    if (streaming) {
      // Create a custom streaming method for PR reviews
      const result = await this.streamPRReview(promptData, res);

      if (!result || !result.content || result.content.trim() === '') {
        const errorMsg = `AI provider returned empty content. Provider: ${result?.provider || 'unknown'}, Response: ${JSON.stringify(result)}`;
        logger.error(`LangChain review failed: ${errorMsg}`);
        throw new Error(errorMsg);
      }

      review = result.content;
      aiProvider = result.provider;
    } else {
      // Use non-streaming version
      const result = await prLangChainService.generateContent(
        promptData,
        null, // no images for PR review
        'PR_REVIEW',
        false // not streaming
      );

      if (!result || !result.content || result.content.trim() === '') {
        const errorMsg = `AI provider returned empty content. Provider: ${result?.provider || 'unknown'}, Response: ${JSON.stringify(result)}`;
        logger.error(`LangChain review failed: ${errorMsg}`);
        throw new Error(errorMsg);
      }

      review = result.content;
      aiProvider = result.provider;
    }

    logger.info(`Successfully generated review using LangChain with ${aiProvider}`);

    return { review, aiProvider };
  }

  /**
   * Stream PR review generation
   */
  static async streamPRReview(promptData, res = null) {
    try {
      if (!langChainServiceFactory.hasProviders()) {
        const error =
          'No AI providers are configured. Please check your environment configuration.';
        logger.error(error);
        throw new Error(error);
      }

      // Log available providers for debugging
      const availableProviders = langChainServiceFactory.getAvailableProviders();
      logger.info(`Available providers for PR review: ${JSON.stringify(availableProviders)}`);

      logger.info('Starting PR review streaming with template: PR_REVIEW');

      // Validate prompt data
      if (!promptData || Object.keys(promptData).length === 0) {
        throw new Error('Empty prompt data provided for PR review');
      }

      // Get the base template and format it
      const promptTemplate = await prLangChainService.createPromptTemplate('PR_REVIEW', false);
      const formattedPrompt = await promptTemplate.format({ ...promptData });

      if (!formattedPrompt || formattedPrompt.trim() === '') {
        throw new Error('Generated prompt template is empty');
      }

      logger.info(formattedPrompt);

      // Use the existing streaming infrastructure from PRLangChainService
      return await prLangChainService.tryProvidersForStreaming(formattedPrompt, res);
    } catch (error) {
      logger.error('Error in streamPRReview:', error);
      throw error;
    }
  }
}

export default PRReviewService;
