import { z } from "zod";
import logger from "../../../logger.js";
import { prLangChainService } from "../../../services/langchain/index.js";
import { COMMIT_TYPE_KEYWORDS } from "../utils/constants.js";

/**
 * Service for generating PR content using AI
 */
class PRContentService {
  /**
   * Analyze commits to determine the type (feat/fix/chore)
   */
  static analyzeCommitType(commits) {
    const commitMessages = commits
      .map((commit) => commit.message.toLowerCase())
      .join(" ");

    let featScore = 0;
    let fixScore = 0;
    let choreScore = 0;

    // Score based on keyword matches
    COMMIT_TYPE_KEYWORDS.FEAT.forEach((keyword) => {
      if (commitMessages.includes(keyword)) featScore++;
    });

    COMMIT_TYPE_KEYWORDS.FIX.forEach((keyword) => {
      if (commitMessages.includes(keyword)) fixScore++;
    });

    COMMIT_TYPE_KEYWORDS.CHORE.forEach((keyword) => {
      if (commitMessages.includes(keyword)) choreScore++;
    });

    // Return the type with highest score, default to 'feat'
    if (fixScore > featScore && fixScore > choreScore) {
      return "fix";
    } else if (choreScore > featScore && choreScore > fixScore) {
      return "chore";
    } else {
      return "feat";
    }
  }

  /**
   * Generate both PR title and description in a single LLM call using structured output
   */
  static async generatePRContentStructured(commits, ticketNumber, branchName, onProgress) {
    const commitMessages = commits
      .map((commit) => `- ${commit.message} (by ${commit.author})`)
      .join("\n");

    try {
      // Define the Zod schema for structured output
      const prSchema = z.object({
        title: z.string().describe("Short, concise PR title under 50 characters without ticket numbers"),
        description: z.string().describe("Concise PR description in markdown format with summary and key changes")
      });

      onProgress({ type: "status", message: "Generating PR content with structured output..." });

      const result = await prLangChainService.generateStructuredContent(
        { commitMessages },
        prSchema,
        "PR_COMBINED",
        false // Non-streaming for structured output
      );

      let prTitle = "";
      let prDescription = "";

      // Check if we got structured output
      if (result.content && typeof result.content === 'object' && result.content.title && result.content.description) {
        prTitle = result.content.title.trim();
        prDescription = result.content.description.trim();
        
        onProgress({ type: "structured_success", message: "Successfully generated structured PR content" });
      } else {
        // Fallback: try to parse the content manually
        const content = typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
        
        // Simple parsing attempt
        const titleMatch = content.match(/title[:\s]+(.+)/i);
        const descMatch = content.match(/description[:\s]+([\s\S]+)/i);
        
        if (titleMatch) {
          prTitle = titleMatch[1].trim().replace(/['"]/g, '');
        }
        if (descMatch) {
          prDescription = descMatch[1].trim().replace(/['"]/g, '');
        }
        
        onProgress({ type: "fallback_parsing", message: "Used fallback parsing for PR content" });
      }

      // Ensure we have content, use fallbacks if needed
      if (!prTitle) {
        prTitle = "Update implementation";
        onProgress({ type: "fallback_title", message: "Used fallback title" });
      }
      
      if (!prDescription) {
        const ticketRef = ticketNumber ? `for ticket ${ticketNumber}` : `from branch ${branchName || 'feature branch'}`;
        prDescription = `## Summary\nThis PR contains changes ${ticketRef}.\n\n## Changes Made\n- Implementation updates\n- Code improvements`;
        onProgress({ type: "fallback_description", message: "Used fallback description" });
      }

      // Determine commit type and format title with prefix
      const commitType = this.analyzeCommitType(commits);
      const ticketPrefix = ticketNumber ? `${commitType}(${ticketNumber}): ` : `${commitType}: `;
      const formattedTitle = `${ticketPrefix}${prTitle}`;

      return {
        title: formattedTitle,
        description: prDescription,
        aiGenerated: true,
        provider: result.provider || 'unknown'
      };

    } catch (error) {
      logger.error("Error generating PR content with structured output:", error);
      onProgress({ type: "error", message: `Error: ${error.message}` });
      
      // Complete fallback
      const commitType = this.analyzeCommitType(commits);
      const ticketPrefix = ticketNumber ? `${commitType}(${ticketNumber}): ` : `${commitType}: `;
      const fallbackTitle = `${ticketPrefix}Update implementation`;
      const ticketRef = ticketNumber ? `for ticket ${ticketNumber}` : 'based on commit history';
      const fallbackDescription = `## Summary\nThis PR contains changes ${ticketRef}.\n\n## Changes Made\n- Implementation updates based on commit history`;
      
      return {
        title: fallbackTitle,
        description: fallbackDescription,
        aiGenerated: false,
        provider: 'fallback'
      };
    }
  }
}

export default PRContentService;
