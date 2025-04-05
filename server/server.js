const express = require('express');
const path = require('path');
const logger = require('./logger');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../ui'))); // Serve static files from UI folder

// Import routes
const jiraRoutes = require('./routes/jiraRoutes'); // Updated path to routes

// Use routes
app.use('/api', jiraRoutes);

// Wildcard route to serve index.html for all unmatched routes
app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, '../ui/index.html')); // Serve UI index.html
});

// Start the server
app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
});
