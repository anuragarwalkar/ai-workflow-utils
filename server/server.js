const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const logger = require('./logger');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST']
  }
});
const PORT = 3000;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // React dev server ports
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../react-ui/dist'))); // Serve static files from UI folder

// Import routes
const jiraRoutes = require('./routes/jiraRoutes');

// Import routes
const emailRoutes = require('./routes/emailRoutes');
const buildRoutes = require('./routes/buildRoutes');

// Use routes
app.use('/api', jiraRoutes);

// Use routes
app.use('/api/email', emailRoutes);

// Use routes with socket.io instance
app.use('/api/build', buildRoutes(io));

// Wildcard route to serve index.html for all unmatched routes
app.get('/', (_, res) => {
    res.sendFile(path.join(__dirname, '../ui_backup/index.html')); // Serve UI index.html
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    logger.info('Client connected to WebSocket');
    
    socket.on('disconnect', () => {
        logger.info('Client disconnected from WebSocket');
    });
});

// Start the server
server.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
});
