const express = require('express');
const path = require('path');
const axios = require('axios'); // Add axios for HTTP requests
require('dotenv').config(); // Load environment variables

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' })); // Increase JSON payload size limit

// Serve static files (e.g., CSS, JS)
app.use(express.static(path.join(__dirname)));

// Serve the index.html file on the default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Function to create a Jira issue
async function createJiraIssue(summary, description) {
    const jiraBaseUrl = process.env.JIRA_URL; // Pull Jira base URL from .env
    const jiraToken = process.env.JIRA_TOKEN; // Pull Jira token from .env

    if (!jiraBaseUrl || !jiraToken) {
        throw new Error('JIRA_URL or JIRA_TOKEN is not defined in the environment variables');
    }

    const jiraUrl = `${jiraBaseUrl}/rest/api/2/issue`; // Append the endpoint to the base URL

    const payload = {
        fields: {
            project: { key: "CUDI" },
            summary,
            description,
            issuetype: { name: "Bug" },
            priority: { name: "Low" },
            customfield_16302: { id: "21304" },
            customfield_16300: { id: "21302" },
            customfield_11301: { id: "11023" },
            customfield_11302: { id: "11029" },
            customfield_11400: "11222"
        }
    };

    try {
        const response = await axios.post(jiraUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jiraToken}`
            }
        });
        return response.data; // Return the Jira issue response
    } catch (error) {
        console.error('Error creating Jira issue:', error.message);
        throw new Error('Failed to create Jira issue');
    }
}

// Function to generate a bug report
async function generateBugReport(prompt, images) {
    const model = "llava"; // Hardcoded model value
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

    if (!summary || !description) {
        throw new Error('Failed to extract summary or description from the bug report');
    }

    return { summary, description, bugReport: generatedBugReport };
}

// API endpoint to preview the bug report
app.post('/api/preview', async (req, res) => {
    const { prompt, images } = req.body;

    if (!prompt || !images || !Array.isArray(images)) {
        return res.status(400).json({ error: 'Invalid request payload' });
    }

    try {
        const { summary, description, bugReport } = await generateBugReport(prompt, images);

        // Respond with the generated bug report
        res.status(200).json({
            message: 'Bug report preview generated successfully',
            bugReport,
            summary,
            description
        });
    } catch (error) {
        console.error('Error generating bug report preview:', error.message);
        res.status(500).json({ error: 'Failed to generate bug report preview', details: error.message });
    }
});

// API endpoint to create a Jira issue
app.post('/api/generate', async (req, res) => {
    const { summary, description } = req.body;

    if (!summary || !description) {
        return res.status(400).json({ error: 'Invalid request payload' });
    }

    try {
        // Create a Jira issue
        const jiraResponse = await createJiraIssue(summary, description);

        // Respond with the Jira issue key
        res.status(200).json({
            message: 'Jira issue created successfully',
            jiraIssue: jiraResponse
        });
    } catch (error) {
        console.error('Error creating Jira issue:', error.message);
        res.status(500).json({ error: 'Failed to create Jira issue', details: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
