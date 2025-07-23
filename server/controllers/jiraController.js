import axios from "axios";
import fs from "fs";
import logger from "../logger.js";
import FormData from "form-data";
import multer from "multer";
import { convertMovToMp4 } from "../utils/fileUtils.js";
import langchainService from "../services/langchainService.js";

multer({ dest: "uploads/" }); 

// Main function to preview bug reports using LangChain
async function previewBugReport(req, res) {
  const { prompt, images = [], issueType = "Bug" } = req.body;

  if (!prompt || !Array.isArray(images)) {
    return res.status(400).json({ error: "Invalid request payload" });
  }

  // Set up Server-Sent Events headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  try {
    // Use the new LangChain service for streaming
    await langchainService.streamContent(prompt, images, issueType, res);
  } catch (error) {
    logger.error(`Error generating ${issueType} preview: ${error.message}`);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: `Failed to generate ${issueType} preview`,
      details: error.message
    })}\n\n`);
  }
  
  res.end();
}

// Function to generate Jira content using LangChain (non-streaming)
async function generateJiraContent(prompt, images, issueType = "Bug") {
  try {
    const result = await langchainService.generateContent(prompt, images, issueType, false);
    
    if (!result.content) {
      throw new Error("Invalid response structure from AI provider");
    }

    const generatedContent = result.content;
    const usedProvider = result.provider;

    // Parse the content to extract summary and description
    const summaryMatch = generatedContent.match(
      /(?:h3\. (?:Issue Summary|Task Summary|Story Summary|Summary):|(?:Issue Summary|Task Summary|Story Summary|Summary):)\s*(.+)/
    );
    let summary = summaryMatch?.[1]?.trim();
    
    if (summary) {
      summary = summary.replace(/^\[|\]$/g, '').trim();
    }
    
    let description = generatedContent
      .replace(/(?:h3\. (?:Issue Summary|Task Summary|Story Summary|Summary):|(?:Issue Summary|Task Summary|Story Summary|Summary):)\s*.+/, "")
      .trim();
    
    if (description) {
      description = description.replace(/h3\.\s*/g, '').trim();
    }

    return {
      summary: summary || `${issueType}: Summary not available`,
      description: description || "Description not available",
      bugReport: generatedContent,
      provider: usedProvider,
    };
  } catch (error) {
    logger.error(`Error generating Jira content: ${error.message}`);
    throw error;
  }
}

async function createJiraIssue(req, res) {
  const { summary, description, issueType, priority, projectType, customFields } = req.body;

  if (!summary || !description || !issueType || !projectType) {
    return res.status(400).json({ error: "Invalid request payload" });
  }

  try {
    const jiraBaseUrl = process.env.JIRA_URL;
    const jiraToken = process.env.JIRA_TOKEN;

    const jiraUrl = `${jiraBaseUrl}/rest/api/2/issue`;
    
    // Process custom fields into Jira format
    const processedCustomFields = {};

    if (customFields && Array.isArray(customFields)) {
      customFields.forEach(field => {
        if (field.key && field.value) {
          const val = field.value;

          // Check if the value is a string and looks like an object or array
          const isLikelyJson = typeof val === 'string' && /^[{\[].*[}\]]$/.test(val.trim());

          if (isLikelyJson) {
            try {
              // Sanitize object keys like { id: "007" }
              const sanitized = val.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
              processedCustomFields[field.key] = JSON.parse(sanitized);
            } catch (err) {
              processedCustomFields[field.key] = val; // fallback to string
            }
          } else {
            processedCustomFields[field.key] = val; // treat as string
          }
        }
      });
    }

    // Create base payload
    const payload = {
      fields: {
        project: { key: projectType },
        summary,
        description,
        issuetype: { name: issueType },
        priority: {
          name: priority,
        },
        ...processedCustomFields
      }
    };

    const response = await axios.post(jiraUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jiraToken}`,
      },
    });

    res.status(200).json({
      message: "Jira issue created successfully",
      jiraIssue: response?.data,
    });
  } catch (error) {
    logger.error(`Error creating Jira issue: ${error.message}`);
    res
      .status(500)
      .json({ error: "Failed to create Jira issue", details: error.message });
  }
}

// Controller to upload an image to a Jira issue
async function uploadImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "Missing file in request" });
  }

  const issueKey = req.body.issueKey; 
  const originalFileName = req.body.fileName;

  if (!issueKey) {
    return res
      .status(400)
      .json({ error: "Missing issueKey in request payload" });
  }

  try {
    const jiraBaseUrl = process.env.JIRA_URL;
    const jiraToken = process.env.JIRA_TOKEN;

    const jiraUrl = `${jiraBaseUrl}/rest/api/2/issue/${issueKey}/attachments`;

    let filePath = req.file.path;
    let fileName = originalFileName || req.file.originalname;

    // Use the reusable function to convert .mov to .mp4 if necessary
    ({ filePath, fileName } = await convertMovToMp4(filePath, fileName));

    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath), fileName);

    const response = await axios.post(jiraUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        "X-Atlassian-Token": "no-check",
        Authorization: `Bearer ${jiraToken}`,
      },
    });

    fs.unlinkSync(filePath);

    res.status(200).json({
      message: "Image uploaded to Jira successfully",
      jiraResponse: response.data,
      fileName,
    });
  } catch (error) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    logger.error(`Error uploading image to Jira: ${error.message}`);
    res
      .status(500)
      .json({
        error: "Failed to upload image to Jira",
        details: error.message,
      });
  }
}

const fetchJiraIssue = async (issueId) => {
  const jiraUrl = `${process.env.JIRA_URL}/rest/api/2/issue/${issueId}`;
  const jiraToken = process.env.JIRA_TOKEN;

  return axios.get(jiraUrl, {
    headers: {
      Authorization: `Bearer ${jiraToken}`,
      "Content-Type": "application/json",
    },
  });
};

async function fetchJiraSummaries(issueKeys) {
  const jiraToken = process.env.JIRA_TOKEN;
  const jql = `issueKey in (${issueKeys.join(',')})`;
  const url = `${process.env.JIRA_URL}/rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=summary`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${jiraToken}`,
        'Accept': 'application/json'
      }
    });

    const issues = response.data.issues;

    return Object.fromEntries(
      issues.map(issue => [issue.key, issue.fields.summary])
    );
  } catch (error) {
    console.error('Error fetching Jira summaries:', error.message);
    return {};
  }
}

async function getJiraIssue(req, res) {
  const issueId = req.params.id;

  try {
    const response = await fetchJiraIssue(issueId);
    res.status(200).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      message: error.response?.data || "Failed to fetch Jira issue",
    });
  }
}

export {
  previewBugReport,
  createJiraIssue,
  uploadImage,
  getJiraIssue,
  fetchJiraIssue,
  fetchJiraSummaries,
  generateJiraContent
};

export default {
  previewBugReport,
  createJiraIssue,
  uploadImage,
  getJiraIssue,
  fetchJiraIssue,
  fetchJiraSummaries,
  generateJiraContent
};
