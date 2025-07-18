import axios from 'axios';
import https from 'https';
import logger from '../logger.js';
import dotenv from 'dotenv';

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
    prompt += `Author: ${prDetails.author?.displayName || 'N/A'}\n\n`;
  }

  prompt += `**Code Changes:**\n\n`;

  if (diffData.values && Array.isArray(diffData.values)) {
    diffData.values.forEach((file, index) => {
      prompt += `### File ${index + 1}: ${file.srcPath?.toString || 'Unknown file'}\n`;
      
      if (file.hunks && Array.isArray(file.hunks)) {
        file.hunks.forEach((hunk, hunkIndex) => {
          prompt += `\n**Hunk ${hunkIndex + 1}** (${hunk.section || 'No section'}):\n`;
          prompt += `Lines ${hunk.oldLine}-${hunk.newLine}\n\n`;
          
          if (hunk.lines && Array.isArray(hunk.lines)) {
            hunk.lines.forEach(line => {
              if (line.left && line.right) {
                prompt += `- ${line.left}\n+ ${line.right}\n`;
              } else if (line.left) {
                prompt += `- ${line.left}\n`;
              } else if (line.right) {
                prompt += `+ ${line.right}\n`;
              }
            });
          }
          prompt += `\n`;
        });
      }
      prompt += `\n---\n\n`;
    });
  }

  prompt += `\nPlease provide a comprehensive code review covering:\n`;
  prompt += `1. Code quality and readability\n`;
  prompt += `2. Potential bugs or issues\n`;
  prompt += `3. Security concerns\n`;
  prompt += `4. Performance implications\n`;
  prompt += `5. Best practices and suggestions for improvement\n`;
  prompt += `6. Overall assessment and recommendation\n`;

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
    console.log('data:', data);
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

// Review pull request using OpenAI compatible API
async function reviewPullRequest(req, res) {
  try {
    const { projectKey, repoSlug, pullRequestId, diffData, prDetails } = req.body;
    
    if (!diffData) {
      return res.status(400).json({ 
        error: 'Diff data is required for review' 
      });
    }

    // Prepare the prompt for AI review
    const reviewPrompt = buildReviewPrompt(diffData, prDetails);
    
    logger.info(`Starting AI review for PR ${pullRequestId}`);

    const response = await axios.post(`${openaiBaseUrl}/v1/chat/completions`, {
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
    });

    const review = response.data.choices?.[0]?.message?.content;

    if (!review) {
      return res.status(500).json({ 
        error: 'No review content received from AI' 
      });
    }

    logger.info(`Successfully generated AI review for PR ${pullRequestId}`);
    
    res.json({
      review,
      projectKey,
      repoSlug,
      pullRequestId,
      reviewedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error reviewing pull request:', error);
    if (error.response) {
      return res.status(error.response.status).json({
        error: `Failed to generate AI review: ${error.response.statusText}`,
        details: error.response.data
      });
    }
    res.status(500).json({ 
      error: 'Internal server error while reviewing pull request',
      message: error.message 
    });
  }
}

// Create pull request (moved from jiraController)
async function createPullRequest(req, res) {
  const { 
    ticketNumber, 
    updatedList, 
    branchName, 
    projectKey,
    repoSlug,
  } = req.body;

  if (!ticketNumber || !updatedList || !branchName || !projectKey || !repoSlug) {
    return res.status(400).json({ 
      error: "ticketNumber, updatedList, branchName, projectKey, and repoSlug are required" 
    });
  }

  try {  
    if (!authToken) {
      return res.status(400).json({ 
        error: "BITBUCKET_AUTHORIZATION_TOKEN environment variable is required" 
      });
    }

    const url = `${bitbucketUrl}/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests`;
    
    // Create the pull request payload
    const prTitle = `feat(CUDI-${ticketNumber}): upgrade ${updatedList}`;
    const prDescription = `This PR integrates the latest updates for the following packages: ${updatedList}.`;

    const payload = {
      title: prTitle,
      description: prDescription,
      source: {
        branch: {
          name: branchName
        }
      },
      destination: {
        branch: {
          name: "main"
        }
      }
    };

    logger.info(`Creating pull request for ticket ${ticketNumber}`);

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
      pullRequest: data,
      prTitle,
      prDescription
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

export {
  getPullRequests,
  getPullRequestDiff,
  reviewPullRequest,
  createPullRequest
};

export default {
  getPullRequests,
  getPullRequestDiff,
  reviewPullRequest,
  createPullRequest
};
