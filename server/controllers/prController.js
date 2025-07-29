import axios from "axios";
import https from "https";
import logger from "../logger.js";
import dotenv from "dotenv";
import langchainService from "../services/langchainService.js";
import templateDbService from "../services/templateDbService.js";

// Create axios instance with SSL certificate verification disabled for self-signed certificates
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false, // Ignore self-signed certificate errors
  }),
});

const getEnv = () => {
  // Configure dotenv
  dotenv.config();

  return {
    bitbucketUrl: process.env.BIT_BUCKET_URL,
    authToken: process.env.BITBUCKET_AUTHORIZATION_TOKEN,
    openaiBaseUrl: process.env.OPENAI_COMPATIBLE_BASE_URL,
    openaiApiKey: process.env.OPENAI_COMPATIBLE_API_KEY,
    openaiModel: process.env.OPENAI_COMPATIBLE_MODEL,
  };
};

// Helper function to get PR template from database
async function getPRTemplate(templateType) {
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

// Helper function to build review prompt data for LangChain
function buildReviewPromptData(diffData, prDetails) {
  const prTitle = prDetails?.title || "N/A";
  const prDescription = prDetails?.description || "N/A";
  const prAuthor = prDetails?.author?.user?.displayName || 
                   prDetails?.author?.displayName || "N/A";

  let codeChanges = "";
  let hasChanges = false;

  // Handle Bitbucket diff format
  if (diffData && diffData.diffs && Array.isArray(diffData.diffs)) {
    diffData.diffs.forEach((file, index) => {
      const fileName =
        file.source?.toString || file.destination?.toString || "Unknown file";
      codeChanges += `### File ${index + 1}: ${fileName}\n`;

      if (file.hunks && Array.isArray(file.hunks)) {
        file.hunks.forEach((hunk, hunkIndex) => {
          codeChanges += `\n**Hunk ${hunkIndex + 1}**`;
          if (hunk.context) {
            codeChanges += ` (${hunk.context})`;
          }
          codeChanges += `:\n`;
          codeChanges += `Lines: ${hunk.sourceLine}-${
            hunk.sourceLine + hunk.sourceSpan - 1
          } → ${hunk.destinationLine}-${
            hunk.destinationLine + hunk.destinationSpan - 1
          }\n\n`;
          codeChanges += `\`\`\`diff\n`;

          if (hunk.segments && Array.isArray(hunk.segments)) {
            hunk.segments.forEach((segment) => {
              if (segment.lines && Array.isArray(segment.lines)) {
                segment.lines.forEach((line) => {
                  hasChanges = true;
                  let prefix = " "; // context line

                  if (segment.type === "ADDED") {
                    prefix = "+";
                  } else if (segment.type === "REMOVED") {
                    prefix = "-";
                  }

                  codeChanges += `${prefix}${line.line}\n`;
                });
              }
            });
          }
          codeChanges += `\`\`\`\n\n`;
        });
      }
      codeChanges += `\n---\n\n`;
    });
  }
  // Fallback to old format handling
  else if (diffData && diffData.values && Array.isArray(diffData.values)) {
    diffData.values.forEach((file, index) => {
      const fileName =
        file.srcPath?.toString ||
        file.path?.toString ||
        file.source?.toString ||
        "Unknown file";
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
  // Handle raw diff string
  else if (diffData && typeof diffData === "string") {
    hasChanges = true;
    codeChanges += `\`\`\`diff\n${diffData}\n\`\`\`\n\n`;
  }
  // Handle other diff object structures
  else if (diffData && typeof diffData === "object") {
    hasChanges = true;
    codeChanges += `\`\`\`json\n${JSON.stringify(diffData, null, 2)}\n\`\`\`\n\n`;
    codeChanges += `Note: The above is the raw diff data structure. Please analyze the changes within this data.\n\n`;
  }

  if (!hasChanges) {
    codeChanges += `**Note:** No specific code changes were detected in the provided diff data. This might indicate:\n`;
    codeChanges += `- The diff data structure is different than expected\n`;
    codeChanges += `- The changes are in binary files or very large files\n`;
    codeChanges += `- There might be an issue with how the diff was generated\n\n`;
    codeChanges += `Raw diff data structure:\n\`\`\`json\n${JSON.stringify(
      diffData,
      null,
      2
    )}\n\`\`\`\n\n`;
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
    const { bitbucketUrl, authToken } = getEnv(); 
    const { projectKey, repoSlug } = req.params;

    if (!projectKey || !repoSlug) {
      return res.status(400).json({
        error: "Project key and repository slug are required",
      });
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

    logger.info(
      `Successfully fetched ${data.values?.length || 0} pull requests`
    );

    res.json(data);
  } catch (error) {
    logger.error("Error fetching pull requests:", error);
    if (error.response) {
      return res.status(error.response.status).json({
        error: `Failed to fetch pull requests: ${error.response.statusText}`,
        details: error.response.data,
      });
    }
    res.status(500).json({
      error: "Internal server error while fetching pull requests",
      message: error.message,
    });
  }
}

// Get diff for a specific pull request
async function getPullRequestDiff(req, res) {
  try {
    const { projectKey, repoSlug, pullRequestId } = req.params;
    const { bitbucketUrl, authToken } = getEnv(); 

    if (!projectKey || !repoSlug || !pullRequestId) {
      return res.status(400).json({
        error: "Project key, repository slug, and pull request ID are required",
      });
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
    logger.error("Error fetching pull request diff:", error);
    if (error.response) {
      return res.status(error.response.status).json({
        error: `Failed to fetch pull request diff: ${error.response.statusText}`,
        details: error.response.data,
      });
    }
    res.status(500).json({
      error: "Internal server error while fetching pull request diff",
      message: error.message,
    });
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

    if (!langchainService.providers || langchainService.providers.length === 0) {
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
      
      // Use LangChain service for review generation
      const result = await langchainService.generateContent(
        promptData,
        null, // no images for PR review
        "PR_REVIEW",
        false // not streaming
      );
      console.log('result:', result);
      
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
    const { bitbucketUrl, authToken } = getEnv(); 
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

// Generate PR title with streaming using LangChain and custom templates
async function generatePRTitleStream(commits, ticketNumber, onChunk) {
  const commitMessages = commits
    .map((commit) => `- ${commit.message} (by ${commit.author})`)
    .join("\n");

  try {
    // Use LangChain service for streaming title generation
    let aiTitle = "";
    
    try {
      const result = await langchainService.generateContent(
        {commitMessages},
        null, // no images
        "PR_TITLE",
        true // streaming
      );

      // Handle streaming response
      if (result.content && typeof result.content.next === 'function') {
        for await (const chunk of result.content) {
          if (chunk.content) {
            aiTitle += chunk.content;
            onChunk(chunk.content);
          }
        }
      } else {
        // Fallback to non-streaming if streaming not supported
        aiTitle = result.content;
        onChunk(aiTitle);
      }
    } catch (streamError) {
      logger.warn("Streaming failed, using non-streaming:", streamError.message);
      
      // Fallback to non-streaming
      const result = await langchainService.generateContent(
        {commitMessages},
        null,
        "PR_TITLE",
        false
      );
      
      aiTitle = result.content;
      onChunk(aiTitle);
    }

    aiTitle = aiTitle.trim();

    // Determine commit type and format with prefix
    const commitType = analyzeCommitType(commits);
    const formattedTitle = `${commitType}(${ticketNumber}): ${aiTitle || 'generation failed'}`;

    return formattedTitle;
  } catch (error) {
    logger.error("Error generating PR title with LangChain streaming:", error);
    // Fallback with basic format
    const fallbackTitle = `feat(${ticketNumber}): generation failed `;
    onChunk(fallbackTitle);
    return fallbackTitle;
  }
}

// Generate PR description with streaming using LangChain and custom templates
async function generatePRDescriptionStream(commits, onChunk) {
   const commitMessages = commits
    .map((commit) => `- ${commit.message} (by ${commit.author})`)
    .join("\n");

  try {
    let description = "";
    
    try {
      const result = await langchainService.generateContent(
        {commitMessages},
        null, // no images
        "PR_DESCRIPTION",
        true // streaming
      );

      // Handle streaming response
      if (result.content && typeof result.content.next === 'function') {
        for await (const chunk of result.content) {
          if (chunk.content) {
            description += chunk.content;
            onChunk(chunk.content);
          }
        }
      } else {
        // Fallback to non-streaming if streaming not supported
        description = result.content || "Generated PR Description";
        onChunk(description);
      }
    } catch (streamError) {
      logger.warn("Streaming failed, using non-streaming:", streamError.message);
      
      // Fallback to non-streaming
      const result = await langchainService.generateContent(
        {commitMessages},
        null,
        "PR_DESCRIPTION",
        false
      );
      
      description = result.content || "Generated PR Description";
      onChunk(description);
    }

    return description.trim() || "Generated PR Description";
  } catch (error) {
    logger.error("Error generating PR description with LangChain streaming:", error);
    const fallbackDescription = "Generated PR Description";
    onChunk(fallbackDescription);
    return fallbackDescription;
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
  const { bitbucketUrl, authToken } = getEnv(); 

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
  const {authToken} = getEnv();

  if (!ticketNumber || !branchName || !projectKey || !repoSlug) {
    return res.status(400).json({
      error: "ticketNumber, branchName, projectKey, and repoSlug are required",
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
        // Send status update
        res.write(
          `data: ${JSON.stringify({
            type: "status",
            message: "Generating PR title...",
          })}\n\n`
        );

        // Generate title with streaming
        let titleChunks = "";

        prTitle = await generatePRTitleStream(
          commits,
          ticketNumber,
          (chunk) => {
            titleChunks += chunk;
            res.write(
              `data: ${JSON.stringify({
                type: "title_chunk",
                data: chunk,
              })}\n\n`
            );
          }
        );

        // Send complete title
        res.write(
          `data: ${JSON.stringify({
            type: "title_complete",
            data: prTitle,
          })}\n\n`
        );

        // Send status update for description
        res.write(
          `data: ${JSON.stringify({
            type: "status",
            message: "Generating PR description...",
          })}\n\n`
        );

        // Generate description with streaming
        let descriptionChunks = "";

        prDescription = await generatePRDescriptionStream(
          commits,
          (chunk) => {
            descriptionChunks += chunk;
            res.write(
              `data: ${JSON.stringify({
                type: "description_chunk",
                data: chunk,
              })}\n\n`
            );
          }
        );

        // Send complete description
        res.write(
          `data: ${JSON.stringify({
            type: "description_complete",
            data: prDescription,
          })}\n\n`
        );

        aiGenerated = true;

        logger.info(`Successfully generated AI-powered PR content`);
      } else {
        logger.warn(
          `No commits found for branch ${branchName}, using fallback title/description`
        );
        prTitle = `${ticketNumber}`;
        prDescription = `This PR contains changes for ticket ${ticketNumber} from branch ${branchName}.`;

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
        `Ollama not available, using basic title/description: ${ollamaError.message}`
      );
      prTitle = `${ticketNumber}`;
      prDescription = `This PR contains changes for ticket ${ticketNumber} from branch ${branchName}.`;

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
};

export default {
  getPullRequests,
  getPullRequestDiff,
  reviewPullRequest,
  createPullRequest,
  streamPRPreview,
};
