const axios = require('axios');
const fs = require('fs');
const logger = require('../logger');

// Function to generate a bug report
async function generateBugReport(prompt, images) {
    const model = "llava";
    const constructedPrompt = `${prompt}. Based on the provided image and the paragraph above, generate a detailed bug report in Jira Wiki Markup format. Format your output like this, and include a blank line between each list item: h3. Issue Summary: Anomaly: [ One-line summary of the bug.] h3. Steps to Reproduce: # [Step 1]  # [Step 2]  # [Step 3]  h3. Expected Behavior: * [What should happen.]  h3. Actual Behavior: * [What is happening instead — visible in the image.]  h3. Possible Causes: * [List possible reasons — e.g., font rendering, input field style, etc.]`;

    const response = await axios.post('http://localhost:11434/api/generate', {
        model,
        prompt: constructedPrompt,
        images,
        stream: false
    });

    const generatedBugReport = response.data?.response;

    if (!generatedBugReport) {
        throw new Error('Invalid response structure from external API');
    }

    const summary = generatedBugReport.match(/h3\. Issue Summary: (.+)/)?.[1]?.trim();
    const description = generatedBugReport;

    return { 
        summary: summary || 'Anomaly: Summary not available', 
        description: description || 'Description not available', 
        bugReport: generatedBugReport 
    };
}

// Controller to preview the bug report
async function previewBugReport(req, res) {
    const { prompt, images } = req.body;

    if (!prompt || !images || !Array.isArray(images)) {
        return res.status(400).json({ error: 'Invalid request payload' });
    }

    try {
        const { summary, description, bugReport } = await generateBugReport(prompt, images);
        res.status(200).json({
            message: 'Bug report preview generated successfully',
            bugReport,
            summary,
            description
        });
    } catch (error) {
        logger.error(`Error generating bug report preview: ${error.message}`);
        res.status(500).json({ error: 'Failed to generate bug report preview', details: error.message });
    }
}

// Controller to create a Jira issue
async function createJiraIssue(req, res) {
    const { summary, description } = req.body;

    if (!summary || !description) {
        return res.status(400).json({ error: 'Invalid request payload' });
    }

    try {
        const jiraBaseUrl = process.env.JIRA_URL;
        const jiraToken = process.env.JIRA_TOKEN;

        const jiraUrl = `${jiraBaseUrl}/rest/api/2/issue`;
        const payload = {
            fields: {
                project: { key: "CUDI" },
                summary,
                description,
                issuetype: { name: "Bug" }
            }
        };

        const response = await axios.post(jiraUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jiraToken}`
            }
        });

        res.status(200).json({
            message: 'Jira issue created successfully',
            jiraIssue: response.data
        });
    } catch (error) {
        logger.error(`Error creating Jira issue: ${error.message}`);
        res.status(500).json({ error: 'Failed to create Jira issue', details: error.message });
    }
}

// Controller to upload an image to a Jira issue
async function uploadImage(req, res) {
    const { issueKey } = req.body;

    if (!issueKey || !req.file) {
        return res.status(400).json({ error: 'Invalid request payload or missing file' });
    }

    const filePath = req.file.path;

    try {
        const jiraBaseUrl = process.env.JIRA_URL;
        const jiraToken = process.env.JIRA_TOKEN;

        const jiraUrl = `${jiraBaseUrl}/rest/api/2/issue/${issueKey}/attachments`;

        const response = await axios.post(jiraUrl, fs.createReadStream(filePath), {
            headers: {
                'X-Atlassian-Token': 'no-check',
                'Authorization': `Bearer ${jiraToken}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        fs.unlinkSync(filePath);

        res.status(200).json({
            message: 'Image uploaded to Jira successfully',
            jiraResponse: response.data
        });
    } catch (error) {
        fs.unlinkSync(filePath);
        logger.error(`Error uploading image to Jira: ${error.message}`);
        res.status(500).json({ error: 'Failed to upload image to Jira', details: error.message });
    }
}

module.exports = {
    previewBugReport, // Ensure this matches the function name
    createJiraIssue,  // Ensure this matches the function name
    uploadImage       // Ensure this matches the function name
};
