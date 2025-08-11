import express from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import logger from './logger.js';
import dotenv from 'dotenv';
import configBridge from './services/configBridge.js';

// Import middleware
import { errorHandler, notFoundHandler, requestLogger } from './middleware/index.js';

// Import routes
import jiraRoutes from './routes/jira-routes.js';
import emailRoutes from './routes/email-routes.js';
import buildRoutes from './routes/build-routes.js';
import chatRoutes from './routes/chat-routes.js';
import prRoutes from './routes/pull-request-routes.js';
import templateRoutes from './routes/template-routes.js';
import environmentSettingsRoutes from './routes/environment-routes.js';
import logsRoutes from './routes/logs-routes.js';
import langChainServiceFactory from './services/langchain/LangChainServiceFactory.js';

// Load default .env file first (for fallback values)
dotenv.config();

// Load dynamic configuration from database to process.env
if (process.env.NODE_ENV === 'production') {
  await configBridge.loadConfigToEnv();
}

langChainServiceFactory.initializeProviders();

logger.info('🔁 Configuration loaded from database and environment variables');

// Determine project root directory
const projectRoot = process.cwd();

const app = express();
const server = http.createServer(app);

// Socket.IO configuration
// For Deploying on Cloud origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3000;

// Trust proxy for production deployments
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security and CORS middleware
// For Deploying on Cloud origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body parsing middleware
app.use(
  express.json({
    limit: process.env.JSON_LIMIT || '10mb',
    strict: true,
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.URL_ENCODED_LIMIT || '10mb',
  })
);

// Request logging middleware
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/jira', jiraRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/build', buildRoutes(io));
app.use('/api/chat', chatRoutes);
app.use('/api/pr', prRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/environment-settings', environmentSettingsRoutes);
app.use('/api/logs', logsRoutes);

// Serve static files from React build
const staticPath = path.join(projectRoot, 'ui/dist');

app.use(
  express.static(staticPath, {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
    etag: true,
    lastModified: true,
  })
);

// Serve React app for all non-API routes (SPA routing)
app.use((req, res, next) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }

  res.sendFile('index.html', { root: staticPath }, err => {
    if (err) {
      logger.error('❌ Error sending index.html:', err.message, err.path, err.status);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      logger.info(`✅ index.html served for: ${req.path}`);
    }
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', socket => {
  logger.info(`Client connected to WebSocket: ${socket.id}`);

  // Handle client disconnection
  socket.on('disconnect', reason => {
    logger.info(`Client disconnected from WebSocket: ${socket.id}, reason: ${reason}`);
  });

  // Handle connection errors
  socket.on('error', error => {
    logger.error(`Socket.IO error for client ${socket.id}:`, error);
  });
});

// Graceful shutdown handling
let isShuttingDown = false;

const gracefulShutdown = signal => {
  if (isShuttingDown) {
    logger.warn(`${signal} received again, forcing exit`);
    process.exit(1);
  }

  isShuttingDown = true;
  logger.info(`${signal} received, shutting down gracefully`);

  // Set a timeout to force exit if graceful shutdown takes too long
  const forceExitTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timeout, forcing exit');
    process.exit(1);
  }, 10000); // 10 seconds timeout

  // Close Socket.IO server first
  try {
    io.close(err => {
      if (err) {
        logger.error('Error closing Socket.IO server:', err);
      } else {
        logger.info('Socket.IO server closed');
      }

      // Close HTTP server
      if (server.listening) {
        server.close(err => {
          if (err) {
            logger.error('Error closing HTTP server:', err);
          } else {
            logger.info('HTTP server closed');
          }
          clearTimeout(forceExitTimeout);
          logger.info('Process terminated gracefully');
          process.exit(0);
        });
      } else {
        logger.info('HTTP server was not running');
        clearTimeout(forceExitTimeout);
        logger.info('Process terminated gracefully');
        process.exit(0);
      }
    });
  } catch (error) {
    logger.error('Error during shutdown:', error);
    clearTimeout(forceExitTimeout);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', err => {
  logger.error('Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the server
server.listen(PORT, () => {
  logger.info(`🚀 Server is running on http://localhost:${PORT}`);
  logger.info(`📁 Serving static files from: ${staticPath}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Export for testing purposes
export { app, server, io };
