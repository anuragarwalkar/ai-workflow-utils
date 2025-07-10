const express = require('express');
const path = require('path');
const logger = require('./logger');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../ui_backup'))); // Serve static files from UI folder

// Import routes
const jiraRoutes = require('./routes/jiraRoutes');

// Import routes
const emailRoutes = require('./routes/emailRoutes');

// Use routes
app.use('/api', jiraRoutes);

// Use routes
app.use('/api/email', emailRoutes);

// Wildcard route to serve index.html for all unmatched routes
app.get('/', (_, res) => {
    res.sendFile(path.join(__dirname, '../ui_backup/index.html')); // Serve UI index.html
});

// Start the server
app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
});
