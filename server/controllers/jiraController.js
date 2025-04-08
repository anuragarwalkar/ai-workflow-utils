const axios = require('axios');
const fs = require('fs');
const logger = require('../logger');
const FormData = require('form-data'); // Add this import for FormData
const multer = require('multer'); // Import multer

multer({ dest: 'uploads/' }); // Configure multer to store files in 'uploads/' directory

// Function to generate a bug report
async function generateBugReport(prompt, images) {
    const model = "llava";
    const constructedPrompt = `${prompt} - Based on the prompt & image, generate a detailed bug report for mobile app dont include react native or mobile app in title. Format your output like this, and include a blank line between each list item: h3. Issue Summary: Anomaly: [ One-line summary of the bug.] h3. Steps to Reproduce: # [Step 1]  # [Step 2]  # [Step 3]  h3. Expected Behavior: * [What should happen.]  h3. Actual Behavior: * [What is happening instead — visible in the image.]  h3. Possible Causes: * [List possible reasons — e.g., font rendering, input field style, etc.]`;

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

    const summaryMatch = generatedBugReport.match(/(?:h3\. Issue Summary:|Issue Summary:)\s*(.+)/);
    const summary = summaryMatch?.[1]?.trim();
    const description = generatedBugReport.replace(/(?:h3\. Issue Summary:|Issue Summary:)\s*.+/, '').trim();

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
                issuetype: { name: "Bug" },
                priority: {
                name: "Low"
                },
                customfield_16302: { id: "21304" },
                customfield_16300: { id: "21302" },
                customfield_11301: { id: "11023" },
                customfield_11302: { id: "11029" },
                customfield_11400: "11222"
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
    if (!req.file) {
        return res.status(400).json({ error: 'Missing file in request' });
    }

    const issueKey = req.body.issueKey; // Extract issueKey from the FormData sent by the UI
    const originalFileName = req.body.fileName; // Extract the original file name from the FormData

    if (!issueKey) {
        return res.status(400).json({ error: 'Missing issueKey in request payload' });
    }

    try {
        const jiraBaseUrl = process.env.JIRA_URL;
        const jiraToken = process.env.JIRA_TOKEN;

        const jiraUrl = `${jiraBaseUrl}/rest/api/2/issue/${issueKey}/attachments`;

        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path), originalFileName || req.file.originalname); // Use the original file name if provided

        const response = await axios.post(jiraUrl, formData, {
            headers: {
                ...formData.getHeaders(), // Include headers generated by FormData
                'X-Atlassian-Token': 'no-check',
                'Authorization': `Bearer ${jiraToken}`
            }
        });

        fs.unlinkSync(req.file.path); // Clean up the uploaded file

        res.status(200).json({
            message: 'Image uploaded to Jira successfully',
            jiraResponse: response.data,
            fileName: originalFileName || req.file.originalname // Return the file name for confirmation
        });
    } catch (error) {
        fs.unlinkSync(req.file.path); // Ensure cleanup even on error
        logger.error(`Error uploading image to Jira: ${error.message}`);
        res.status(500).json({ error: 'Failed to upload image to Jira', details: error.message });
    }
}

// Controller to fetch a Jira issue by its ID
async function getJiraIssue(req, res) {
    const issueId = req.params.id;
    const jiraToken = process.env.JIRA_TOKEN;
    const jiraUrl = `${process.env.JIRA_URL}/rest/api/2/issue/${issueId}`;

    try {
        const response = await axios.get(jiraUrl, {
            headers: {
                'Authorization': `Bearer ${jiraToken}`,
                'Content-Type': 'application/json',
            }
        });
        res.status(200).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            message: error.response?.data || 'Failed to fetch Jira issue',
        });
    }
}

module.exports = {
    previewBugReport, // Ensure this matches the function name
    createJiraIssue,  // Ensure this matches the function name
    uploadImage,      // Ensure this matches the function name
    getJiraIssue      // Ensure this matches the function name
};
