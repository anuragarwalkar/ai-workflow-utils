const express = require('express');
const router = express.Router();
const jiraController = require('../controllers/jiraController'); // Import Jira controller
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Configure multer

// Example route for preview
router.post('/preview', jiraController.previewBugReport); // Correct method name

// Example route for generating Jira issue
router.post('/generate', jiraController.createJiraIssue); // Correct method name

// Example route for uploading files
router.post('/upload', upload.single('file'), jiraController.uploadImage); // Use multer middleware

// Example route for fetching a Jira issue by ID
router.get('/issue/:id', jiraController.getJiraIssue);

// Route for creating pull requests
router.post('/create-pr', jiraController.createPullRequest);

module.exports = router;
