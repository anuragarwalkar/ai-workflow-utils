const axios = require("axios");
const fs = require("fs");
const logger = require("../logger");
const FormData = require("form-data"); 
const multer = require("multer");
const { convertMovToMp4 } = require("../utils/fileUtils");

multer({ dest: "uploads/" }); 

async function generateJiraContent(prompt, images, issueType = "Bug") {
  const model = "llava";
  const hasImages = images && images.length > 0;
  const imageReference = hasImages ? "& image" : "";
  const imageContext = hasImages ? "visible in the image" : "described in the prompt";
  
  let constructedPrompt;
  
  switch (issueType) {
    case "Bug":
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed bug report for mobile app dont include react native or mobile app in title. Format your output like this, and include a blank line between each list item: h3. Issue Summary: Anomaly: [ One-line summary of the bug.] h3. Steps to Reproduce: # [Step 1]  # [Step 2]  # [Step 3]  h3. Expected Behavior: * [What should happen.]  h3. Actual Behavior: * [What is happening instead — ${imageContext}.]  h3. Possible Causes: * [List possible reasons — e.g., font rendering, input field style, etc.]`;
      break;
    
    case "Task":
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed task description for mobile app development. Format your output like this, and include a blank line between each list item: h3. Task Summary: [ One-line summary of the task.] h3. Description: * [Detailed description of what needs to be done based on the ${hasImages ? "image and " : ""}prompt.]  h3. Acceptance Criteria: # [Criteria 1]  # [Criteria 2]  # [Criteria 3]  h3. Implementation Notes: * [Technical notes or considerations for implementation.]  h3. Dependencies: * [Any dependencies or prerequisites needed.]`;
      break;
    
    case "Story":
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed user story for mobile app. Format your output like this, and include a blank line between each list item: h3. Story Summary: [ One-line summary of the user story.] h3. User Story: * As a [user type], I want [functionality] so that [benefit/value].  h3. Description: * [Detailed description based on the ${hasImages ? "image and " : ""}prompt.]  h3. Acceptance Criteria: # [Criteria 1]  # [Criteria 2]  # [Criteria 3]  h3. Definition of Done: * [What constitutes completion of this story.]`;
      break;
    
    default:
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed description. Format your output like this: h3. Summary: [ One-line summary.] h3. Description: * [Detailed description based on the ${hasImages ? "image and " : ""}prompt.]`;
  }

  const response = await axios.post("http://localhost:11434/api/generate", {
    model,
    prompt: constructedPrompt,
    images,
    stream: false,
  });

  const generatedContent = response.data?.response;

  if (!generatedContent) {
    throw new Error("Invalid response structure from external API");
  }

  const summaryMatch = generatedContent.match(
    /(?:h3\. (?:Issue Summary|Task Summary|Story Summary|Summary):|(?:Issue Summary|Task Summary|Story Summary|Summary):)\s*(.+)/
  );
  const summary = summaryMatch?.[1]?.trim();
  const description = generatedContent
    .replace(/(?:h3\. (?:Issue Summary|Task Summary|Story Summary|Summary):|(?:Issue Summary|Task Summary|Story Summary|Summary):)\s*.+/, "")
    .trim();

  return {
    summary: summary || `${issueType}: Summary not available`,
    description: description || "Description not available",
    bugReport: generatedContent,
  };
}

async function previewBugReport(req, res) {
  const { prompt, images = [], issueType = "Bug" } = req.body;

  if (!prompt || !Array.isArray(images)) {
    return res.status(400).json({ error: "Invalid request payload" });
  }

  try {
    const { summary, description, bugReport } = await generateJiraContent(
      prompt,
      images,
      issueType
    );
    res.status(200).json({
      message: `${issueType} preview generated successfully`,
      bugReport,
      summary,
      description,
    });
  } catch (error) {
    logger.error(`Error generating ${issueType} preview: ${error.message}`);
    res
      .status(500)
      .json({
        error: `Failed to generate ${issueType} preview`,
        details: error.message,
      });
  }
}

async function createJiraIssue(req, res) {
  const { summary, description, issueType = "Task", priority = "Medium" } = req.body;

  if (!summary || !description) {
    return res.status(400).json({ error: "Invalid request payload" });
  }

  try {
    const jiraBaseUrl = process.env.JIRA_URL;
    const jiraToken = process.env.JIRA_TOKEN;

    const jiraUrl = `${jiraBaseUrl}/rest/api/2/issue`;
    
    // Create base payload
    const baseFields = {
      project: { key: "CUDI" },
      summary,
      description,
      issuetype: { name: issueType },
      priority: {
        name: priority,
      },
    };

    // Add issue type specific custom fields using switch case
    let payload;
    switch (issueType) {
      case "Task":
        payload = {
          fields: {
            ...baseFields,
            customfield_11400: "11222",
            customfield_10006: "CUDI-11449"
          },
        };
        break;
      
      case "Bug":
        payload = {
          fields: {
            ...baseFields,
            customfield_16302: { id: "21304" },
            customfield_16300: { id: "21302" },
            customfield_11301: { id: "11023" },
            customfield_11302: { id: "11029" },
            customfield_11400: "11222",
          },
        };
        break;
      
      default:
        // Default payload for other issue types
        payload = {
          fields: {
            ...baseFields,
            customfield_11400: "11222",
          },
        };
        break;
    }

    const response = await axios.post(jiraUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jiraToken}`,
      },
    });

    res.status(200).json({
      message: "Jira issue created successfully",
      jiraIssue: response.data,
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

module.exports = {
  previewBugReport,
  createJiraIssue,
  uploadImage,
  getJiraIssue,
  fetchJiraIssue,
  fetchJiraSummaries
};
