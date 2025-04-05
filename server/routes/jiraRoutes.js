const express = require('express');
const router = express.Router();
const jiraController = require('../controllers/jiraController'); // Import Jira controller

// Example route for preview
router.post('/preview', jiraController.previewBugReport); // Correct method name

// Example route for generating Jira issue
router.post('/generate', jiraController.createJiraIssue); // Correct method name

// Example route for uploading files
router.post('/upload', jiraController.uploadImage); // Correct method name

module.exports = router;
