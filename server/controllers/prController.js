import axios from "axios";
import https from "https";
import dotenv from "dotenv";
import logger from "../logger.js";
import { prLangChainService, langChainServiceFactory } from "../services/langchain/index.js";
import templateDbService from "../services/templateDbService.js";
import { parsePatch } from "unidiff";
import { z } from "zod";

// Constants
const DEFAULT_COMMIT_LIMIT = 20;
const DEFAULT_TARGET_BRANCH = "main";

// Create axios instance with SSL certificate verification disabled for self-signed certificates
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false, // Ignore self-signed certificate errors
  }),
});

// Environment configuration
class EnvironmentConfig {
  static get() {
    dotenv.config();

    return {
      bitbucketUrl: process.env.BIT_BUCKET_URL,
      authToken: process.env.BITBUCKET_AUTHORIZATION_TOKEN,
      openaiBaseUrl: process.env.OPENAI_COMPATIBLE_BASE_URL,
      openaiApiKey: process.env.OPENAI_COMPATIBLE_API_KEY,
      openaiModel: process.env.OPENAI_COMPATIBLE_MODEL,
    };
  }

  static validate() {
    const { bitbucketUrl, authToken } = this.get();
    if (!bitbucketUrl || !authToken) {
      throw new Error("Required environment variables are missing: BIT_BUCKET_URL, BITBUCKET_AUTHORIZATION_TOKEN");
    }
  }
}

// Error handling utility
class ErrorHandler {
  static handleApiError(error, context, res) {
    logger.error(`Error in ${context}:`, error);
    
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: `Failed to ${context}: ${error.response.statusText}`,
        details: error.response.data,
      });
    }
    
    return res.status(500).json({
      success: false,
      error: `Internal server error while ${context}`,
      message: error.message,
    });
  }

  static handleValidationError(message, res) {
    return res.status(400).json({
      success: false,
      error: message,
    });
  }
}

// Template service wrapper
class TemplateService {
  static async getPRTemplate(templateType) {
    try {
      await templateDbService.init();
      const template = await templateDbService.getActiveTemplate(templateType);
      if (!template) {
        logger.warn(`No active template found for ${templateType}, using fallback`);
        return null;
      }
      return template;
    } catch (error) {
      logger.error(`Error getting ${templateType} template:`, error);
      return null;
    }
  }
}

// Unidiff-based diff processing utilities
class UnidiffProcessor {
  /**
   * Convert Bitbucket diff data to unified diff format and parse with unidiff
   */
  static processWithUnidiff(diffData) {
    try {
      // If diffData is already a string in unified diff format, parse it directly
      if (typeof diffData === "string") {
        const patches = parsePatch(diffData);
        return this.formatUnidiffPatches(patches);
      }

      // Convert Bitbucket format to unified diff string
      const unifiedDiff = this.convertBitbucketToUnifiedDiff(diffData);
      if (unifiedDiff) {
        const patches = parsePatch(unifiedDiff);
        return this.formatUnidiffPatches(patches);
      }

      return { codeChanges: "", hasChanges: false };
    } catch (error) {
      logger.warn("Failed to process diff with unidiff:", error.message);
      return { codeChanges: "", hasChanges: false };
    }
  }

  /**
   * Process segment lines for unified diff format
   */
  static processSegmentLines(segment) {
    if (!segment.lines || !Array.isArray(segment.lines)) {
      return "";
    }

    return segment.lines.map((line) => {
      let prefix = " ";
      if (segment.type === "ADDED") {
        prefix = "+";
      } else if (segment.type === "REMOVED") {
        prefix = "-";
      }
      return `${prefix}${line.line || ""}\n`;
    }).join("");
  }

  /**
   * Process hunk segments for unified diff format
   */
  static processHunkSegments(hunk) {
    if (!hunk.segments || !Array.isArray(hunk.segments)) {
      return "";
    }

    return hunk.segments.map(segment => this.processSegmentLines(segment)).join("");
  }

  /**
   * Process file hunks for unified diff format
   */
  static processFileHunks(file) {
    if (!file.hunks || !Array.isArray(file.hunks)) {
      return "";
    }

    return file.hunks.map((hunk) => {
      const sourceStart = hunk.sourceLine || 0;
      const sourceSpan = hunk.sourceSpan || 0;
      const destStart = hunk.destinationLine || 0;
      const destSpan = hunk.destinationSpan || 0;

      let hunkContent = `@@ -${sourceStart},${sourceSpan} +${destStart},${destSpan} @@\n`;
      hunkContent += this.processHunkSegments(hunk);
      return hunkContent;
    }).join("");
  }

  /**
   * Convert Bitbucket diff structure to unified diff format
   */
  static convertBitbucketToUnifiedDiff(diffData) {
    if (!diffData || !diffData.diffs || !Array.isArray(diffData.diffs)) {
      return null;
    }

    return diffData.diffs.map((file) => {
      const sourceFile = file.source?.toString || "/dev/null";
      const destFile = file.destination?.toString || "/dev/null";
      
      let fileContent = `--- ${sourceFile}\n`;
      fileContent += `+++ ${destFile}\n`;
      fileContent += this.processFileHunks(file);
      return fileContent;
    }).join("") || null;
  }

  /**
   * Format parsed unidiff patches into readable markdown
   */
  static formatUnidiffPatches(patches) {
    let codeChanges = "";
    let hasChanges = false;

    patches.forEach((patch, index) => {
      const fileName = patch.newFileName || patch.oldFileName || "Unknown file";
      codeChanges += `### File ${index + 1}: ${fileName}\n\n`;

      if (patch.hunks && patch.hunks.length > 0) {
        patch.hunks.forEach((hunk, hunkIndex) => {
          codeChanges += `**Hunk ${hunkIndex + 1}**: Lines ${hunk.oldStart}-${hunk.oldStart + hunk.oldLines - 1} → ${hunk.newStart}-${hunk.newStart + hunk.newLines - 1}\n\n`;
          codeChanges += "```diff\n";

          hunk.lines.forEach((line) => {
            codeChanges += `${line.type}${line.content}\n`;
            hasChanges = true;
          });

          codeChanges += "```\n\n";
        });
      }

      codeChanges += "---\n\n";
    });

    return { codeChanges, hasChanges };
  }

  /**
   * Get a summary of changes from parsed patches
   */
  static getChangesSummary(patches) {
    let addedLines = 0;
    let removedLines = 0;
    let modifiedFiles = 0;

    patches.forEach((patch) => {
      modifiedFiles++;
      patch.hunks.forEach((hunk) => {
        hunk.lines.forEach((line) => {
          if (line.type === "+") addedLines++;
          if (line.type === "-") removedLines++;
        });
      });
    });

    return { addedLines, removedLines, modifiedFiles };
  }

  /**
   * Get detailed diff analysis using unidiff
   */
  static analyzeDiff(diffData) {
    try {
      const result = this.processWithUnidiff(diffData);
      if (!result.hasChanges) {
        return { 
          ...result, 
          summary: { addedLines: 0, removedLines: 0, modifiedFiles: 0 }
        };
      }

      // Parse again to get statistics
      let patches = [];
      if (typeof diffData === "string") {
        patches = parsePatch(diffData);
      } else {
        const unifiedDiff = this.convertBitbucketToUnifiedDiff(diffData);
        if (unifiedDiff) {
          patches = parsePatch(unifiedDiff);
        }
      }

      const summary = this.getChangesSummary(patches);
      return { ...result, summary };
    } catch (error) {
      logger.warn("Failed to analyze diff:", error.message);
      return { 
        codeChanges: "", 
        hasChanges: false, 
        summary: { addedLines: 0, removedLines: 0, modifiedFiles: 0 }
      };
    }
  }
}

// Diff processing utilities
class DiffProcessor {
  static processLine(line, segment) {
    let prefix = " "; // context line
    if (segment.type === "ADDED") {
      prefix = "+";
    } else if (segment.type === "REMOVED") {
      prefix = "-";
    }
    return `${prefix}${line.line}\n`;
  }

  static processSegment(segment) {
    if (!segment.lines || !Array.isArray(segment.lines)) {
      return "";
    }
    
    return segment.lines
      .map(line => this.processLine(line, segment))
      .join("");
  }

  static processHunk(hunk, hunkIndex) {
    let content = `\n**Hunk ${hunkIndex + 1}**`;
    if (hunk.context) {
      content += ` (${hunk.context})`;
    }
    content += `:\n`;
    content += `Lines: ${hunk.sourceLine}-${hunk.sourceLine + hunk.sourceSpan - 1} → ${hunk.destinationLine}-${hunk.destinationLine + hunk.destinationSpan - 1}\n\n`;
    content += `\`\`\`diff\n`;

    if (hunk.segments && Array.isArray(hunk.segments)) {
      content += hunk.segments
        .map(segment => this.processSegment(segment))
        .join("");
    }
    
    content += `\`\`\`\n\n`;
    return content;
  }

  static processBitbucketDiff(diffData) {
    let codeChanges = "";
    let hasChanges = false;

    if (diffData && diffData.diffs && Array.isArray(diffData.diffs)) {
      diffData.diffs.forEach((file, index) => {
        const fileName = file.source?.toString || file.destination?.toString || "Unknown file";
        codeChanges += `### File ${index + 1}: ${fileName}\n`;

        if (file.hunks && Array.isArray(file.hunks)) {
          file.hunks.forEach((hunk, hunkIndex) => {
            codeChanges += this.processHunk(hunk, hunkIndex);
            hasChanges = true;
          });
        }
        codeChanges += `\n---\n\n`;
      });
    }

    return { codeChanges, hasChanges };
  }

  static processLegacyDiff(diffData) {
    let codeChanges = "";
    let hasChanges = false;

    if (diffData && diffData.values && Array.isArray(diffData.values)) {
      diffData.values.forEach((file, index) => {
        const fileName = file.srcPath?.toString || file.path?.toString || file.source?.toString || "Unknown file";
        codeChanges += `### File ${index + 1}: ${fileName}\n`;

        if (file.hunks && Array.isArray(file.hunks)) {
          file.hunks.forEach((hunk, hunkIndex) => {
            codeChanges += `\n**Hunk ${hunkIndex + 1}**:\n`;
            if (hunk.oldLine !== undefined && hunk.newLine !== undefined) {
              codeChanges += `Lines: ${hunk.oldLine} → ${hunk.newLine}\n`;
            }
            codeChanges += `\`\`\`diff\n`;

            if (hunk.lines && Array.isArray(hunk.lines)) {
              hunk.lines.forEach((line) => {
                hasChanges = true;
                if (line.left && line.right) {
                  codeChanges += `-${line.left}\n+${line.right}\n`;
                } else if (line.left) {
                  codeChanges += `-${line.left}\n`;
                } else if (line.right) {
                  codeChanges += `+${line.right}\n`;
                } else if (line.content) {
                  let prefix = " ";
                  if (line.type === "ADDED") {
                    prefix = "+";
                  } else if (line.type === "REMOVED") {
                    prefix = "-";
                  }
                  codeChanges += `${prefix}${line.content}\n`;
                } else if (typeof line === "string") {
                  codeChanges += `${line}\n`;
                }
              });
            } else if (hunk.content) {
              hasChanges = true;
              codeChanges += `${hunk.content}\n`;
            }
            codeChanges += `\`\`\`\n\n`;
          });
        } else if (file.content || file.diff) {
          hasChanges = true;
          codeChanges += `\n\`\`\`diff\n`;
          codeChanges += `${file.content || file.diff}\n`;
          codeChanges += `\`\`\`\n\n`;
        }
        codeChanges += `\n---\n\n`;
      });
    }

    return { codeChanges, hasChanges };
  }
}

// Helper function to build review prompt data for LangChain
function buildReviewPromptData(diffData, prDetails) {
  const prTitle = prDetails?.title || "N/A";
  const prDescription = prDetails?.description || "N/A";
  const prAuthor = prDetails?.author?.user?.displayName || 
                   prDetails?.author?.displayName || "N/A";

  let codeChanges = "";
  let hasChanges = false;

  // Try unidiff processing first for better accuracy
  const unidiffResult = UnidiffProcessor.processWithUnidiff(diffData);
  if (unidiffResult.hasChanges) {
    codeChanges = unidiffResult.codeChanges;
    hasChanges = unidiffResult.hasChanges;
  } else {
    // Fallback to Bitbucket diff format
    const bitbucketResult = DiffProcessor.processBitbucketDiff(diffData);
    if (bitbucketResult.hasChanges) {
      codeChanges = bitbucketResult.codeChanges;
      hasChanges = bitbucketResult.hasChanges;
    } else {
      // Fallback to legacy format
      const legacyResult = DiffProcessor.processLegacyDiff(diffData);
      if (legacyResult.hasChanges) {
        codeChanges = legacyResult.codeChanges;
        hasChanges = legacyResult.hasChanges;
      } else if (diffData && typeof diffData === "string") {
        // Handle raw diff string
        hasChanges = true;
        codeChanges += `\`\`\`diff\n${diffData}\n\`\`\`\n\n`;
      } else if (diffData && typeof diffData === "object") {
        // Handle other diff object structures
        hasChanges = true;
        codeChanges += `\`\`\`json\n${JSON.stringify(diffData, null, 2)}\n\`\`\`\n\n`;
        codeChanges += `Note: The above is the raw diff data structure. Please analyze the changes within this data.\n\n`;
      }
    }
  }

  if (!hasChanges) {
    codeChanges += `**Note:** No specific code changes were detected in the provided diff data. This might indicate:\n`;
    codeChanges += `- The diff data structure is different than expected\n`;
    codeChanges += `- The changes are in binary files or very large files\n`;
    codeChanges += `- There might be an issue with how the diff was generated\n\n`;
    codeChanges += `Raw diff data structure:\n\`\`\`json\n${JSON.stringify(diffData, null, 2)}\n\`\`\`\n\n`;
  }

  return {
    prTitle,
    prDescription,
    prAuthor,
    codeChanges
  };
}

// Get pull requests for a specific project and repository
async function getPullRequests(req, res) {
  try {
    const { bitbucketUrl, authToken } = EnvironmentConfig.get();
    const { projectKey, repoSlug } = req.params;

    if (!projectKey || !repoSlug) {
      return ErrorHandler.handleValidationError(
        "Project key and repository slug are required", 
        res
      );
    }

    const url = `${bitbucketUrl}/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests`;
    logger.info(`Fetching pull requests from: ${url}`);

    const response = await axiosInstance.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = response.data;
    logger.info(`Successfully fetched ${data.values?.length || 0} pull requests`);

    res.json(data);
  } catch (error) {
    ErrorHandler.handleApiError(error, "fetch pull requests", res);
  }
}

// Get diff for a specific pull request
async function getPullRequestDiff(req, res) {
  try {
    const { projectKey, repoSlug, pullRequestId } = req.params;
    const { bitbucketUrl, authToken } = EnvironmentConfig.get();

    if (!projectKey || !repoSlug || !pullRequestId) {
      return ErrorHandler.handleValidationError(
        "Project key, repository slug, and pull request ID are required",
        res
      );
    }

    const url = `${bitbucketUrl}/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/diff`;
    logger.info(`Fetching PR diff from: ${url}`);

    const response = await axiosInstance.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = response.data;
    logger.info(`Successfully fetched diff for PR ${pullRequestId}`);

    res.json(data);
  } catch (error) {
    ErrorHandler.handleApiError(error, "fetch pull request diff", res);
  }
}

// Review pull request using LangChain service with customizable templates
async function reviewPullRequest(req, res) {
  try {
    const { projectKey, repoSlug, pullRequestId, diffData, prDetails } = req.body;

    if (!diffData) {
      return res.status(400).json({
        error: "Diff data is required for review",
      });
    }

    logger.info(`Starting AI review for PR ${pullRequestId} using LangChain with custom templates`);

    // Prepare the prompt data
    const promptData = buildReviewPromptData(diffData, prDetails);

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

// Get commit messages from a branch
async function getCommitMessages(projectKey, repoSlug, branchName) {
  try {
    const { bitbucketUrl, authToken } = EnvironmentConfig.get(); 
    const url = `${bitbucketUrl}/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/commits`;

    logger.info(`Fetching commits from branch ${branchName}: ${url}`);

    const response = await axiosInstance.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      params: {
        until: branchName,
        limit: 20, // Limit to recent commits to avoid token limits
      },
    });

    if (response.data && response.data.values) {
      const commits = response.data.values.map((commit) => ({
        id: commit.id,
        message: commit.message,
        author: commit.author.name,
        date: commit.authorTimestamp,
      }));

      logger.info(
        `Successfully fetched ${commits.length} commits from branch ${branchName}`
      );
      return commits;
    }

    return [];
  } catch (error) {
    logger.error("Error fetching commit messages:", error);
    throw new Error(
      `Failed to fetch commits: ${
        error.response?.data?.errors?.[0]?.message || error.message
      }`
    );
  }
}

// Analyze commits to determine the type (feat/fix/chore)
function analyzeCommitType(commits) {
  const commitMessages = commits
    .map((commit) => commit.message.toLowerCase())
    .join(" ");

  // Check for feature keywords
  const featKeywords = [
    "feat",
    "feature",
    "add",
    "implement",
    "create",
    "new",
    "introduce",
  ];
  const fixKeywords = [
    "fix",
    "bug",
    "patch",
    "resolve",
    "correct",
    "repair",
    "hotfix",
  ];
  const choreKeywords = [
    "chore",
    "refactor",
    "update",
    "clean",
    "maintain",
    "deps",
    "dependency",
    "style",
    "format",
  ];

  let featScore = 0;
  let fixScore = 0;
  let choreScore = 0;

  // Score based on keyword matches
  featKeywords.forEach((keyword) => {
    if (commitMessages.includes(keyword)) featScore++;
  });

  fixKeywords.forEach((keyword) => {
    if (commitMessages.includes(keyword)) fixScore++;
  });

  choreKeywords.forEach((keyword) => {
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

// Generate both PR title and description in a single LLM call using structured output
async function generatePRContentStructured(commits, ticketNumber, branchName, onProgress) {
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
    const commitType = analyzeCommitType(commits);
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
    const commitType = analyzeCommitType(commits);
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

// Create PR with provided title and description
async function createPullRequest(req, res) {
  const {
    ticketNumber,
    branchName,
    projectKey,
    repoSlug,
    customTitle,
    customDescription,
  } = req.body;
  const { bitbucketUrl, authToken } = EnvironmentConfig.get(); 

  if (
    !ticketNumber ||
    !branchName ||
    !projectKey ||
    !repoSlug ||
    !customTitle ||
    !customDescription
  ) {
    return res.status(400).json({
      error:
        "ticketNumber, branchName, projectKey, repoSlug, customTitle, and customDescription are required",
    });
  }

  try {
    if (!authToken) {
      return res.status(400).json({
        error: "BITBUCKET_AUTHORIZATION_TOKEN environment variable is required",
      });
    }

    // Create PR with the provided title and description
    const url = `${bitbucketUrl}/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests`;

    const payload = {
      title: customTitle,
      description: customDescription,
      fromRef: {
        id: `refs/heads/${branchName}`,
      },
      toRef: {
        id: "refs/heads/main",
      },
    };

    logger.info(
      `Creating pull request for ticket ${ticketNumber} with title: "${customTitle}"`
    );

    const response = await axiosInstance.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = response.data;

    logger.info(`Pull request created successfully for ticket ${ticketNumber}`);

    res.status(201).json({
      message: "Pull request created successfully",
      prTitle: customTitle,
      prDescription: customDescription,
      ticketNumber,
      branchName,
      pullRequestId: data.id,
      pullRequestUrl: data.links?.self?.[0]?.href,
    });
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

// Stream PR preview generation
async function streamPRPreview(req, res) {
  const { ticketNumber, branchName, projectKey, repoSlug } = req.body;
  const {authToken} = EnvironmentConfig.get();

  if (!branchName || !projectKey || !repoSlug) {
    return res.status(400).json({
      error: "branchName, projectKey, and repoSlug are required",
    });
  }

  try {
    if (!authToken) {
      return res.status(400).json({
        error: "BITBUCKET_AUTHORIZATION_TOKEN environment variable is required",
      });
    }

    // Set up Server-Sent Events
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    });

    // Send initial status
    res.write(
      `data: ${JSON.stringify({
        type: "status",
        message: "Starting PR preview generation...",
      })}\n\n`
    );

    let prTitle = "";
    let prDescription = "";
    let aiGenerated = false;

    try {
      // Send status update
      res.write(
        `data: ${JSON.stringify({
          type: "status",
          message: "Fetching commit messages...",
        })}\n\n`
      );

      // Fetch commit messages from the branch
      const commits = await getCommitMessages(projectKey, repoSlug, branchName);

      if (commits.length > 0) {
        // Use structured output to generate both title and description in a single call
        const prContent = await generatePRContentStructured(
          commits,
          ticketNumber,
          branchName,
          (progress) => {
            res.write(
              `data: ${JSON.stringify({
                type: "progress",
                ...progress,
              })}\n\n`
            );
          }
        );

        prTitle = prContent.title;
        prDescription = prContent.description;
        aiGenerated = prContent.aiGenerated;

        // Send complete title
        res.write(
          `data: ${JSON.stringify({
            type: "title_complete",
            data: prTitle,
          })}\n\n`
        );

        // Send complete description
        res.write(
          `data: ${JSON.stringify({
            type: "description_complete",
            data: prDescription,
          })}\n\n`
        );

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
        res.write(
          `data: ${JSON.stringify({
            type: "title_complete",
            data: prTitle,
          })}\n\n`
        );
        res.write(
          `data: ${JSON.stringify({
            type: "description_complete",
            data: prDescription,
          })}\n\n`
        );
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
      res.write(
        `data: ${JSON.stringify({ type: "title_complete", data: prTitle })}\n\n`
      );
      res.write(
        `data: ${JSON.stringify({
          type: "description_complete",
          data: prDescription,
        })}\n\n`
      );
    }

    // Send completion event
    res.write(
      `data: ${JSON.stringify({
        type: "complete",
        data: {
          prTitle,
          prDescription,
          aiGenerated,
          ticketNumber,
          branchName,
        },
      })}\n\n`
    );

    res.end();
  } catch (error) {
    logger.error("Error streaming PR preview:", error);
    res.write(
      `data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`
    );
    res.end();
  }
}

export {
  getPullRequests,
  getPullRequestDiff,
  reviewPullRequest,
  createPullRequest,
  streamPRPreview,
  generatePRContentStructured,
};

export default {
  getPullRequests,
  getPullRequestDiff,
  reviewPullRequest,
  createPullRequest,
  streamPRPreview,
  generatePRContentStructured,
};
