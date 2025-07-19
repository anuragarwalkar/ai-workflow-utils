import axios from 'axios';
import https from 'https';
import logger from '../logger.js';
import dotenv from 'dotenv';
import { Ollama } from '@langchain/ollama';

// Configure dotenv
dotenv.config();

// Create axios instance with SSL certificate verification disabled for self-signed certificates
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false // Ignore self-signed certificate errors
  })
});

const bitbucketUrl = process.env.BIT_BUCKET_URL;
const authToken = process.env.BITBUCKET_AUTHORIZATION_TOKEN;
const openaiBaseUrl = process.env.OPENAI_COMPATIBLE_BASE_URL;
const openaiApiKey = process.env.OPENAI_COMPATIBLE_API_KEY;
const openaiModel = process.env.OPENAI_COMPATIBLE_MODEL;

// Helper function to build review prompt
function buildReviewPrompt(diffData, prDetails) {
  let prompt = `Please review the following pull request:\n\n`;
  
  if (prDetails) {
    prompt += `**Pull Request Details:**\n`;
    prompt += `Title: ${prDetails.title || 'N/A'}\n`;
    prompt += `Description: ${prDetails.description || 'N/A'}\n`;
    prompt += `Author: ${prDetails.author?.user?.displayName || prDetails.author?.displayName || 'N/A'}\n\n`;
  }

  prompt += `**Code Changes:**\n\n`;

  let hasChanges = false;
  
  // Handle Bitbucket diff format
  if (diffData && diffData.diffs && Array.isArray(diffData.diffs)) {
    diffData.diffs.forEach((file, index) => {
      const fileName = file.source?.toString || file.destination?.toString || 'Unknown file';
      prompt += `### File ${index + 1}: ${fileName}\n`;
      
      if (file.hunks && Array.isArray(file.hunks)) {
        file.hunks.forEach((hunk, hunkIndex) => {
          prompt += `\n**Hunk ${hunkIndex + 1}**`;
          if (hunk.context) {
            prompt += ` (${hunk.context})`;
          }
          prompt += `:\n`;
          prompt += `Lines: ${hunk.sourceLine}-${hunk.sourceLine + hunk.sourceSpan - 1} → ${hunk.destinationLine}-${hunk.destinationLine + hunk.destinationSpan - 1}\n\n`;
          prompt += `\`\`\`diff\n`;
          
          if (hunk.segments && Array.isArray(hunk.segments)) {
            hunk.segments.forEach(segment => {
              if (segment.lines && Array.isArray(segment.lines)) {
                segment.lines.forEach(line => {
                  hasChanges = true;
                  let prefix = ' '; // context line
                  
                  if (segment.type === 'ADDED') {
                    prefix = '+';
                  } else if (segment.type === 'REMOVED') {
                    prefix = '-';
                  }
                  
                  prompt += `${prefix}${line.line}\n`;
                });
              }
            });
          }
          prompt += `\`\`\`\n\n`;
        });
      }
      prompt += `\n---\n\n`;
    });
  }
  // Fallback to old format handling
  else if (diffData && diffData.values && Array.isArray(diffData.values)) {
    diffData.values.forEach((file, index) => {
      const fileName = file.srcPath?.toString || file.path?.toString || file.source?.toString || 'Unknown file';
      prompt += `### File ${index + 1}: ${fileName}\n`;
      
      if (file.hunks && Array.isArray(file.hunks)) {
        file.hunks.forEach((hunk, hunkIndex) => {
          prompt += `\n**Hunk ${hunkIndex + 1}**:\n`;
          if (hunk.oldLine !== undefined && hunk.newLine !== undefined) {
            prompt += `Lines: ${hunk.oldLine} → ${hunk.newLine}\n`;
          }
          prompt += `\`\`\`diff\n`;
          
          if (hunk.lines && Array.isArray(hunk.lines)) {
            hunk.lines.forEach(line => {
              hasChanges = true;
              if (line.left && line.right) {
                prompt += `-${line.left}\n+${line.right}\n`;
              } else if (line.left) {
                prompt += `-${line.left}\n`;
              } else if (line.right) {
                prompt += `+${line.right}\n`;
              } else if (line.content) {
                const prefix = line.type === 'ADDED' ? '+' : line.type === 'REMOVED' ? '-' : ' ';
                prompt += `${prefix}${line.content}\n`;
              } else if (typeof line === 'string') {
                prompt += `${line}\n`;
              }
            });
          } else if (hunk.content) {
            hasChanges = true;
            prompt += `${hunk.content}\n`;
          }
          prompt += `\`\`\`\n\n`;
        });
      } else if (file.content || file.diff) {
        hasChanges = true;
        prompt += `\n\`\`\`diff\n`;
        prompt += `${file.content || file.diff}\n`;
        prompt += `\`\`\`\n\n`;
      }
      prompt += `\n---\n\n`;
    });
  }
  // Handle raw diff string
  else if (diffData && typeof diffData === 'string') {
    hasChanges = true;
    prompt += `\`\`\`diff\n${diffData}\n\`\`\`\n\n`;
  }
  // Handle other diff object structures
  else if (diffData && typeof diffData === 'object') {
    hasChanges = true;
    prompt += `\`\`\`json\n${JSON.stringify(diffData, null, 2)}\n\`\`\`\n\n`;
    prompt += `Note: The above is the raw diff data structure. Please analyze the changes within this data.\n\n`;
  }

  if (!hasChanges) {
    prompt += `**Note:** No specific code changes were detected in the provided diff data. This might indicate:\n`;
    prompt += `- The diff data structure is different than expected\n`;
    prompt += `- The changes are in binary files or very large files\n`;
    prompt += `- There might be an issue with how the diff was generated\n\n`;
    prompt += `Raw diff data structure:\n\`\`\`json\n${JSON.stringify(diffData, null, 2)}\n\`\`\`\n\n`;
  }

  prompt += `\nPlease provide a comprehensive code review covering:\n`;
  prompt += `1. Code quality and readability\n`;
  prompt += `2. Potential bugs or issues\n`;
  prompt += `3. Security concerns\n`;
  prompt += `4. Performance implications\n`;
  prompt += `5. Best practices and suggestions for improvement\n`;
  prompt += `6. Overall assessment and recommendation\n`;
  prompt += `\nIf you cannot see specific code changes, please indicate what information you would need to provide a proper review.\n`;

  return prompt;
}

// Get pull requests for a specific project and repository
async function getPullRequests(req, res) {
  try {
    const { projectKey, repoSlug } = req.params;
    
    if (!projectKey || !repoSlug) {
      return res.status(400).json({ 
        error: 'Project key and repository slug are required' 
      });
    }

    const url = `${bitbucketUrl}/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests`;
    
    logger.info(`Fetching pull requests from: ${url}`);

    const response = await axiosInstance.get(url, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = response.data;
    
    logger.info(`Successfully fetched ${data.values?.length || 0} pull requests`);
    
    res.json(data);
  } catch (error) {
    logger.error('Error fetching pull requests:', error);
    if (error.response) {
      return res.status(error.response.status).json({
        error: `Failed to fetch pull requests: ${error.response.statusText}`,
        details: error.response.data
      });
    }
    res.status(500).json({ 
      error: 'Internal server error while fetching pull requests',
      message: error.message 
    });
  }
}

// Get diff for a specific pull request
async function getPullRequestDiff(req, res) {
  try {
    const { projectKey, repoSlug, pullRequestId } = req.params;
    
    if (!projectKey || !repoSlug || !pullRequestId) {
      return res.status(400).json({ 
        error: 'Project key, repository slug, and pull request ID are required' 
      });
    }

    const url = `${bitbucketUrl}/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/diff`;
    
    logger.info(`Fetching PR diff from: ${url}`);

    const response = await axiosInstance.get(url, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = response.data;
    logger.info(`Successfully fetched diff for PR ${pullRequestId}`);
    
    res.json(data);
  } catch (error) {
    logger.error('Error fetching pull request diff:', error);
    if (error.response) {
      return res.status(error.response.status).json({
        error: `Failed to fetch pull request diff: ${error.response.statusText}`,
        details: error.response.data
      });
    }
    res.status(500).json({ 
      error: 'Internal server error while fetching pull request diff',
      message: error.message 
    });
  }
}

// Review pull request using OpenAI compatible API with fallback
async function reviewPullRequest(req, res) {
  try {
    const { projectKey, repoSlug, pullRequestId, diffData, prDetails } = req.body;
    
    if (!diffData) {
      return res.status(400).json({ 
        error: 'Diff data is required for review' 
      });
    }

    // Debug logging to understand diff data structure
    logger.info(`Starting AI review for PR ${pullRequestId}`);

    // Prepare the prompt for AI review
    const reviewPrompt = buildReviewPrompt(diffData, prDetails);
    
    let review = null;
    let aiProvider = 'unknown';

    // Try primary OpenAI compatible API first
    try {
      if (openaiBaseUrl && openaiApiKey && openaiModel) {
        logger.info(`Attempting review with OpenAI compatible API: ${openaiBaseUrl}/chat/completions`);
        
        const response = await axios.post(`${openaiBaseUrl}/chat/completions`, {
          model: openaiModel,
          messages: [
            {
              role: 'system',
              content: 'You are an expert code reviewer. Analyze the provided code changes and provide constructive feedback focusing on code quality, potential bugs, security issues, performance concerns, and best practices.'
            },
            {
              role: 'user',
              content: reviewPrompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.3,
        }, {
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000 // 30 second timeout
        });

        review = response.data.choices?.[0]?.message?.content;
        aiProvider = 'OpenAI Compatible';
        logger.info('Successfully generated review using OpenAI compatible API');
      }
    } catch (primaryError) {
      logger.warn('Primary API failed, attempting fallback:', primaryError.message);
      
      // Try Ollama fallback
      try {
        const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        const ollamaModel = process.env.OLLAMA_MODEL || 'llama2';
        
        logger.info(`Attempting review with Ollama: ${ollamaUrl}`);
        
        const ollamaResponse = await axios.post(`${ollamaUrl}/api/generate`, {
          model: ollamaModel,
          prompt: `You are an expert code reviewer. ${reviewPrompt}`,
          stream: false
        }, {
          timeout: 60000 // 60 second timeout for Ollama
        });

        review = ollamaResponse.data.response;
        aiProvider = 'ollama';
        logger.info('Successfully generated review using Ollama');
      } catch (ollamaError) {
        logger.error('Ollama fallback also failed:', ollamaError.message);
        
        // If both fail, provide a basic static review
        review = generateBasicReview(diffData, prDetails);
        aiProvider = 'static';
        logger.info('Using static review as final fallback');
      }
    }

    if (!review) {
      return res.status(500).json({ 
        error: 'No review content could be generated from any AI provider',
        details: 'Both primary API and fallback options failed'
      });
    }

    logger.info(`Successfully generated AI review for PR ${pullRequestId} using ${aiProvider}`);
    
    res.json({
      review,
      projectKey,
      repoSlug,
      pullRequestId,
      aiProvider,
      reviewedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error reviewing pull request:', error);
    res.status(500).json({ 
      error: 'Internal server error while reviewing pull request',
      message: error.message,
      details: error.response?.data || 'No additional details available'
    });
  }
}

// Generate a basic static review when AI services are unavailable
function generateBasicReview(diffData, prDetails) {
  let review = `# Pull Request Review\n\n`;
  
  if (prDetails) {
    review += `**Pull Request:** ${prDetails.title || 'N/A'}\n`;
    review += `**Author:** ${prDetails.author?.displayName || 'N/A'}\n\n`;
  }

  review += `## Summary\n`;
  review += `This is a basic review generated when AI services are unavailable.\n\n`;

  if (diffData.values && Array.isArray(diffData.values)) {
    review += `## Files Changed (${diffData.values.length})\n`;
    diffData.values.forEach((file, index) => {
      review += `${index + 1}. ${file.srcPath?.toString || 'Unknown file'}\n`;
    });
    review += `\n`;
  }

  review += `## Recommendations\n`;
  review += `- Please ensure all changes have been tested thoroughly\n`;
  review += `- Verify that code follows project coding standards\n`;
  review += `- Check for potential security vulnerabilities\n`;
  review += `- Ensure proper error handling is in place\n`;
  review += `- Consider performance implications of the changes\n`;
  review += `- Update documentation if necessary\n\n`;

  review += `## Note\n`;
  review += `This review was generated using a static template because AI review services were unavailable. `;
  review += `Please conduct a manual code review to ensure code quality.\n`;

  return review;
}

// Get commit messages from a branch
async function getCommitMessages(projectKey, repoSlug, branchName) {
  try {
    const url = `${bitbucketUrl}/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/commits`;
    
    logger.info(`Fetching commits from branch ${branchName}: ${url}`);

    const response = await axiosInstance.get(url, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      params: {
        until: branchName,
        limit: 20 // Limit to recent commits to avoid token limits
      }
    });

    if (response.data && response.data.values) {
      const commits = response.data.values.map(commit => ({
        id: commit.id,
        message: commit.message,
        author: commit.author.name,
        date: commit.authorTimestamp
      }));
      
      logger.info(`Successfully fetched ${commits.length} commits from branch ${branchName}`);
      return commits;
    }
    
    return [];
  } catch (error) {
    logger.error('Error fetching commit messages:', error);
    throw new Error(`Failed to fetch commits: ${error.response?.data?.errors?.[0]?.message || error.message}`);
  }
}

// Initialize LangChain Ollama model
function initializeOllama() {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2';
  
  return new Ollama({
    baseUrl: ollamaBaseUrl,
    model: ollamaModel,
    temperature: 0.7,
  });
}

// Analyze commits to determine the type (feat/fix/chore)
function analyzeCommitType(commits) {
  const commitMessages = commits.map(commit => commit.message.toLowerCase()).join(' ');
  
  // Check for feature keywords
  const featKeywords = ['feat', 'feature', 'add', 'implement', 'create', 'new', 'introduce'];
  const fixKeywords = ['fix', 'bug', 'patch', 'resolve', 'correct', 'repair', 'hotfix'];
  const choreKeywords = ['chore', 'refactor', 'update', 'clean', 'maintain', 'deps', 'dependency', 'style', 'format'];
  
  let featScore = 0;
  let fixScore = 0;
  let choreScore = 0;
  
  // Score based on keyword matches
  featKeywords.forEach(keyword => {
    if (commitMessages.includes(keyword)) featScore++;
  });
  
  fixKeywords.forEach(keyword => {
    if (commitMessages.includes(keyword)) fixScore++;
  });
  
  choreKeywords.forEach(keyword => {
    if (commitMessages.includes(keyword)) choreScore++;
  });
  
  // Return the type with highest score, default to 'feat'
  if (fixScore > featScore && fixScore > choreScore) {
    return 'fix';
  } else if (choreScore > featScore && choreScore > fixScore) {
    return 'chore';
  } else {
    return 'feat';
  }
}

// Generate PR title using LangChain Ollama with commit-based prefix
async function generatePRTitle(commits, ticketNumber) {
  try {
    const commitMessages = commits.map(commit => commit.message).join('\n');
    
    const ollama = initializeOllama();
    
    const titlePrompt = `Based on the following commit messages from a branch, generate a very short and concise pull request title.
The title should be clear, professional, and summarize the main purpose of the changes.
Keep it under 50 characters and use imperative mood (e.g., "Add auth" not "Added authentication").
Focus on the most important change only.
DO NOT include any ticket numbers, issue numbers, or identifiers in the title.

Commit messages:
${commitMessages}

Generate only the title without any ticket numbers or identifiers:`;

    const response = await ollama.invoke(titlePrompt);
    const aiTitle = response.trim() || 'Generated PR Title';
    
    // Determine commit type and format with prefix
    const commitType = analyzeCommitType(commits);
    const formattedTitle = `${commitType}(${ticketNumber}): ${aiTitle}`;
    
    return formattedTitle;
  } catch (error) {
    logger.error('Error generating PR title with Ollama:', error);
    // Fallback with basic format
    return `feat(${ticketNumber}): Generated PR Title`;
  }
}

// Generate PR title with streaming using LangChain Ollama
async function generatePRTitleStream(commits, ticketNumber, onChunk) {
  try {
    const commitMessages = commits.map(commit => commit.message).join('\n');
    
    const ollama = initializeOllama();
    
    const titlePrompt = `Based on the following commit messages from a branch, generate a very short and concise pull request title.
The title should be clear, professional, and summarize the main purpose of the changes.
Keep it under 50 characters and use imperative mood (e.g., "Add auth" not "Added authentication").
Focus on the most important change only.
DO NOT include any ticket numbers, issue numbers, or identifiers in the title.

Commit messages:
${commitMessages}

Generate only the title without any ticket numbers or identifiers:`;

    let aiTitle = '';
    const stream = await ollama.stream(titlePrompt);
    
    for await (const chunk of stream) {
      aiTitle += chunk;
      onChunk(chunk);
    }
    
    aiTitle = aiTitle.trim() || 'Generated PR Title';
    
    // Determine commit type and format with prefix
    const commitType = analyzeCommitType(commits);
    const formattedTitle = `${commitType}(${ticketNumber}): ${aiTitle}`;
    
    return formattedTitle;
  } catch (error) {
    logger.error('Error generating PR title with Ollama streaming:', error);
    // Fallback with basic format
    const fallbackTitle = `feat(${ticketNumber}): Generated PR Title`;
    onChunk(fallbackTitle);
    return fallbackTitle;
  }
}

// Generate PR description using LangChain Ollama
async function generatePRDescription(commitMessages) {
  const ollama = initializeOllama();
  
  const descriptionPrompt = `Based on the following commit messages from a branch, generate a concise pull request description.
Keep it short and focused. Include only:

## Summary
Brief overview (1-2 sentences max)

## Changes Made
- List 3-5 key changes only
- Focus on the most important changes

Commit messages:
${commitMessages}

Generate a short, concise description in markdown format (max 200 words):`;

  try {
    const response = await ollama.invoke(descriptionPrompt);
    return response.trim() || 'Generated PR Description';
  } catch (error) {
    logger.error('Error generating PR description with Ollama:', error);
    return 'Generated PR Description';
  }
}

// Generate PR description with streaming using LangChain Ollama
async function generatePRDescriptionStream(commitMessages, onChunk) {
  const ollama = initializeOllama();
  
  const descriptionPrompt = `Based on the following commit messages from a branch, generate a concise pull request description.
Keep it short and focused. Include only:

## Summary
Brief overview (1-2 sentences max)

## Changes Made
- List 3-5 key changes only
- Focus on the most important changes

Commit messages:
${commitMessages}

Generate a short, concise description in markdown format (max 200 words):`;

  try {
    let description = '';
    const stream = await ollama.stream(descriptionPrompt);
    
    for await (const chunk of stream) {
      description += chunk;
      onChunk(chunk);
    }
    
    return description.trim() || 'Generated PR Description';
  } catch (error) {
    logger.error('Error generating PR description with Ollama streaming:', error);
    const fallbackDescription = 'Generated PR Description';
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
    customDescription
  } = req.body;

  if (!ticketNumber || !branchName || !projectKey || !repoSlug || !customTitle || !customDescription) {
    return res.status(400).json({ 
      error: "ticketNumber, branchName, projectKey, repoSlug, customTitle, and customDescription are required" 
    });
  }

  try {  
    if (!authToken) {
      return res.status(400).json({ 
        error: "BITBUCKET_AUTHORIZATION_TOKEN environment variable is required" 
      });
    }

    // Create PR with the provided title and description
    const url = `${bitbucketUrl}/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests`;
    
    const payload = {
      title: customTitle,
      description: customDescription,
      fromRef: {
        id: `refs/heads/${branchName}`
      },
      toRef: {
        id: "refs/heads/main"
      }
    };

    logger.info(`Creating pull request for ticket ${ticketNumber} with title: "${customTitle}"`);

    const response = await axiosInstance.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
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
      pullRequestUrl: data.links?.self?.[0]?.href
    });
  } catch (error) {
    logger.error('Error creating pull request:', error);
    if (error.response) {
      return res.status(error.response.status).json({
        error: "Failed to create pull request",
        details: error.response.data,
        status: error.response.status
      });
    }
    res.status(500).json({ 
      error: 'Internal server error while creating pull request',
      message: error.message 
    });
  }
}

// Stream PR preview generation
async function streamPRPreview(req, res) {
  const { 
    ticketNumber, 
    branchName, 
    projectKey,
    repoSlug
  } = req.body;

  if (!ticketNumber || !branchName || !projectKey || !repoSlug) {
    return res.status(400).json({ 
      error: "ticketNumber, branchName, projectKey, and repoSlug are required" 
    });
  }

  try {
    if (!authToken) {
      return res.status(400).json({ 
        error: "BITBUCKET_AUTHORIZATION_TOKEN environment variable is required" 
      });
    }

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial status
    res.write(`data: ${JSON.stringify({ type: 'status', message: 'Starting PR preview generation...' })}\n\n`);

    let prTitle = '';
    let prDescription = '';
    let aiGenerated = false;

    try {
      logger.info(`Generating AI-powered PR content for branch ${branchName} using Ollama`);
      
      // Send status update
      res.write(`data: ${JSON.stringify({ type: 'status', message: 'Fetching commit messages...' })}\n\n`);
      
      // Fetch commit messages from the branch
      const commits = await getCommitMessages(projectKey, repoSlug, branchName);
      
      if (commits.length > 0) {
        // Send status update
        res.write(`data: ${JSON.stringify({ type: 'status', message: 'Generating PR title...' })}\n\n`);
        
        // Format commit messages for AI processing
        const commitMessages = commits.map(commit => 
          `- ${commit.message} (by ${commit.author})`
        ).join('\n');

        // Generate title with streaming
        const commitType = analyzeCommitType(commits);
        let titleChunks = '';
        
        prTitle = await generatePRTitleStream(commits, ticketNumber, (chunk) => {
          titleChunks += chunk;
          res.write(`data: ${JSON.stringify({ type: 'title_chunk', data: chunk })}\n\n`);
        });
        
        // Send complete title
        res.write(`data: ${JSON.stringify({ type: 'title_complete', data: prTitle })}\n\n`);
        
        // Send status update for description
        res.write(`data: ${JSON.stringify({ type: 'status', message: 'Generating PR description...' })}\n\n`);
        
        // Generate description with streaming
        let descriptionChunks = '';
        
        prDescription = await generatePRDescriptionStream(commitMessages, (chunk) => {
          descriptionChunks += chunk;
          res.write(`data: ${JSON.stringify({ type: 'description_chunk', data: chunk })}\n\n`);
        });
        
        // Send complete description
        res.write(`data: ${JSON.stringify({ type: 'description_complete', data: prDescription })}\n\n`);
        
        aiGenerated = true;
        
        logger.info(`Successfully generated AI-powered PR content`);
      } else {
        logger.warn(`No commits found for branch ${branchName}, using fallback title/description`);
        prTitle = `${ticketNumber}`;
        prDescription = `This PR contains changes for ticket ${ticketNumber} from branch ${branchName}.`;
        
        // Send fallback data
        res.write(`data: ${JSON.stringify({ type: 'title_complete', data: prTitle })}\n\n`);
        res.write(`data: ${JSON.stringify({ type: 'description_complete', data: prDescription })}\n\n`);
      }
    } catch (ollamaError) {
      logger.info(`Ollama not available, using basic title/description: ${ollamaError.message}`);
      prTitle = `${ticketNumber}`;
      prDescription = `This PR contains changes for ticket ${ticketNumber} from branch ${branchName}.`;
      
      // Send fallback data
      res.write(`data: ${JSON.stringify({ type: 'title_complete', data: prTitle })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'description_complete', data: prDescription })}\n\n`);
    }

    // Send completion event
    res.write(`data: ${JSON.stringify({ 
      type: 'complete', 
      data: { 
        prTitle, 
        prDescription, 
        aiGenerated, 
        ticketNumber, 
        branchName 
      } 
    })}\n\n`);
    
    res.end();
  } catch (error) {
    logger.error('Error streaming PR preview:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    res.end();
  }
}

export {
  getPullRequests,
  getPullRequestDiff,
  reviewPullRequest,
  createPullRequest,
  streamPRPreview
};

export default {
  getPullRequests,
  getPullRequestDiff,
  reviewPullRequest,
  createPullRequest,
  streamPRPreview
};
