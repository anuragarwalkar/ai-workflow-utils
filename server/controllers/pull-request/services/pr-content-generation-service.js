import logger from '../../../logger.js';
import { prLangChainService } from '../../../services/langchain/index.js';
import PRContentService from './pr-content-service.js';
import StreamingService from './streaming-service.js';

/**
 * Service for generating PR content (title and description)
 */
class PRContentGenerationService {
  /**
   * Generate AI content for PR using combined template with streaming
   */
  static async generateAIContent(commits, ticketNumber, branchName, res) {
    const commitMessages = commits
      .map(commit => `- ${commit.message} (by ${commit.author})`)
      .join('\n');

    try {
      // Use prLangChainService directly for streaming
      const result = await prLangChainService.streamPRContent(
        { commitMessages },
        'PR_COMBINED',
        res,
      );

      const processedContent = this.processStreamResult(
        result,
        commits,
        ticketNumber,
      );

      // Apply prefix to the final title before sending
      const finalTitle = this.applyCommitTypePrefix(
        processedContent.prTitle,
        commits,
        ticketNumber,
      );

      // Send final complete results using prLangChainService
      prLangChainService.sendFinalResults(
        res,
        finalTitle,
        processedContent.prDescription,
        processedContent.aiGenerated,
        ticketNumber,
        branchName,
      );

      logger.info(
        `Successfully generated AI-powered PR content using PR_COMBINED template (${result.provider})`,
      );

      return processedContent;
    } catch (aiError) {
      logger.warn(`AI generation failed, using fallback: ${aiError.message}`);

      const fallbackContent = this.generateFallbackPRContent(
        commits,
        ticketNumber,
        branchName,
      );

      // Apply prefix to the final title before sending
      const finalTitle = this.applyCommitTypePrefix(
        fallbackContent.prTitle,
        commits,
        ticketNumber,
      );

      // Send fallback results using prLangChainService
      prLangChainService.sendFinalResults(
        res,
        finalTitle,
        fallbackContent.prDescription,
        false,
        ticketNumber,
        branchName,
      );

      return fallbackContent;
    }
  }

  /**
   * Process streaming result and extract PR content
   */
  static processStreamResult(result, commits, ticketNumber) {
    if (!result.content) {
      return this.generateEmptyContent();
    }

    // Use the parsed title and description from streaming
    if (result.parsedTitle || result.parsedDescription) {
      return this.buildPRFromParsed(result, commits, ticketNumber);
    }

    // Fallback parsing if streaming parsing didn't work
    const parsed = this.parseCombinedContent(result.content);
    if (parsed.title) {
      return this.buildPRFromParsed(
        { parsedTitle: parsed.title, parsedDescription: parsed.description },
        commits,
        ticketNumber,
      );
    }

    return this.generateEmptyContent();
  }

  /**
   * Parse combined AI content to extract title and description
   */
  static parseCombinedContent(content) {
    const trimmedContent = content.trim();

    // Try to parse structured output (title and description)
    const titleMatch = trimmedContent.match(/(?:title|TITLE)[:\s]*([^\n]+)/i);
    const descMatch = trimmedContent.match(
      /(?:description|DESCRIPTION)[:\s]*([\s\S]+)/i,
    );

    if (titleMatch && descMatch) {
      return {
        title: titleMatch[1].trim().replace(/['"]/g, ''),
        description: descMatch[1].trim().replace(/['"]/g, ''),
      };
    }

    // Fallback: split by lines and assume first line is title, rest is description
    const lines = trimmedContent.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      const title = lines[0].trim();
      const description =
        lines.slice(1).join('\n').trim() ||
        '## Summary\nThis PR contains changes based on the commit history.\n\n## Changes Made\n- Implementation updates';
      return { title, description };
    }

    return { title: '', description: '' };
  }

  /**
   * Build PR content from parsed results
   */
  static buildPRFromParsed(parsedResult, commits, ticketNumber) {
    // Simply use the parsed title and description without any prefix manipulation
    // Prefix will be applied at the final response level
    const finalTitle = parsedResult.parsedTitle || 'Update implementation';

    return {
      prTitle: finalTitle,
      prDescription:
        parsedResult.parsedDescription ||
        '## Summary\nThis PR contains changes based on commit history.\n\n## Changes Made\n- Implementation updates',
      aiGenerated: true,
    };
  }

  /**
   * Generate empty/fallback PR content
   */
  static generateEmptyContent() {
    return {
      prTitle: 'Update implementation',
      prDescription: '## Summary\nThis PR contains changes based on commit history.\n\n## Changes Made\n- Implementation updates',
      aiGenerated: false,
    };
  }

  /**
   * Generate fallback PR content when AI fails
   */
  static generateFallbackPRContent(commits, ticketNumber, branchName) {
    const prTitle = 'Update implementation';

    const ticketRef = ticketNumber
      ? `for ticket ${ticketNumber}`
      : `from branch ${branchName}`;
    const prDescription = `## Summary\nThis PR contains changes ${ticketRef}.\n\n## Changes Made\n- Implementation updates based on commit history`;

    return { prTitle, prDescription, aiGenerated: false };
  }

  /**
   * Apply commit type prefix to PR title
   */
  static applyCommitTypePrefix(title, commits, ticketNumber) {
    const commitType = PRContentService.analyzeCommitType(commits);
    const ticketPrefix = ticketNumber
      ? `${commitType}(${ticketNumber}): `
      : `${commitType}: `;
    return `${ticketPrefix}${title}`;
  }

  /**
   * Helper method to generate and send fallback content
   */
  static generateFallbackContent(ticketNumber, branchName, res, commits = []) {
    const baseTitle = ticketNumber
      ? `${ticketNumber}`
      : `Update from ${branchName}`;

    const fallbackDescription = ticketNumber
      ? `This PR contains changes for ticket ${ticketNumber} from branch ${branchName}.`
      : `This PR contains changes from branch ${branchName}.`;

    // Send fallback data (without prefix - will be added in final response)
    StreamingService.sendSSEData(res, {
      type: 'title_complete',
      data: baseTitle,
    });
    StreamingService.sendSSEData(res, {
      type: 'description_complete',
      data: fallbackDescription,
    });

    return { prTitle: baseTitle, prDescription: fallbackDescription };
  }
}

export default PRContentGenerationService;
