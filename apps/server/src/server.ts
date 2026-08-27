import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import fs from 'fs';
import { Server as SocketIOServer } from 'socket.io';
import logger from './logger.ts';
import dotenv from 'dotenv';
import loadEnvironment from './utils/envLoader.ts';
import configBridge from './services/configBridge.ts';

// Import middleware
import { errorHandler, notFoundHandler, requestLogger } from './middleware/index.ts';

// Import routes
import apiClientRoutes from './routes/api-client-routes.ts';
import jiraRoutes from './routes/jira-routes.ts';
import emailRoutes from './routes/email-routes.ts';
import buildRoutes from './routes/build-routes.ts';
import chatRoutes from './routes/chat-routes.ts';
import prRoutes from './routes/pull-request-routes.ts';
import templateRoutes from './routes/template-routes.ts';
import environmentSettingsRoutes from './routes/environment-routes.ts';
import logsRoutes from './routes/logs-routes.ts';
import mcpRoutes from './routes/mcp-routes.ts';
import voiceRoutes from './routes/voice-routes.ts';
import appStateRoutes from './routes/app-state-routes.ts';
import dashboardRoutes from './routes/dashboard-routes.ts';
import langChainServiceFactory from './services/langchain/LangChainServiceFactory.ts';
import geminiVoiceService from './services/voice/GeminiVoiceService.ts';
import dashboardNotificationService from './services/dashboard/DashboardNotificationService.ts';

// Discover and load environment files across workspace, global config, and package dir
loadEnvironment();

// Load dynamic configuration from database to process.env
await configBridge.loadConfigToEnv();

langChainServiceFactory.initializeProviders();

logger.info('🔁 Configuration loaded from database and environment variables');

// Determine project root directory
const projectRoot = process.cwd();

const app = express();
const server = http.createServer(app);

// Socket.IO configuration
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
});

// Initialize server-driven notification engine for AI Dashboard
dashboardNotificationService.init(io);

const PORT = process.env.PORT || 3000;

// Trust proxy for production deployments
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security and CORS middleware
app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/api-client', apiClientRoutes);
app.use('/api/jira', jiraRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/build', buildRoutes(io));
app.use('/api/chat', chatRoutes);
app.use('/api/pr', prRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/environment-settings', environmentSettingsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/mcp', mcpRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/app-state', appStateRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Serve static files from React build (check dist/apps/ui first, fallback to ui/dist)
const packageRoot = process.env.AI_WORKFLOW_PACKAGE_DIR || projectRoot;
let staticPath = path.join(packageRoot, 'dist/apps/ui');
if (!fs.existsSync(staticPath)) {
  staticPath = path.join(projectRoot, 'dist/apps/ui');
}
if (!fs.existsSync(staticPath)) {
  staticPath = path.join(packageRoot, 'ui/dist');
}
if (!fs.existsSync(staticPath)) {
  staticPath = path.join(projectRoot, 'ui/dist');
}

app.use(
  express.static(staticPath, {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      // Never cache index.html, service worker, or manifest files
      if (
        filePath.endsWith('index.html') ||
        filePath.endsWith('sw.js') ||
        filePath.endsWith('registerSW.js') ||
        filePath.endsWith('manifest.webmanifest')
      ) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else if (filePath.includes('/assets/') || filePath.includes('\\assets\\')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  })
);

// Serve React app for all non-API routes (SPA routing)
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  const hasFileExtension = /\.[a-zA-Z0-9]+$/.test(req.path);
  if (hasFileExtension) {
    return next();
  }

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  res.sendFile('index.html', { root: staticPath }, (err: any) => {
    if (err) {
      logger.error('❌ Error sending index.html:', err.message, err.path, err.status);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      logger.info(`✅ index.html served for navigation route: ${req.path}`);
    }
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', socket => {
  logger.info(`Client connected to WebSocket: ${socket.id}`);

  // Handle voice session events
  socket.on('start-voice-session', async (data: any) => {
    try {
      logger.info(`Starting voice session for socket ${socket.id}:`, data);

      const sessionInfo = await geminiVoiceService.startVoiceSession(data.sessionId, data);

      const handleVoiceEvent = (event: string, eventData: any) => {
        if (eventData.sessionId === data.sessionId) {
          socket.emit(event, eventData);
        }
      };

      geminiVoiceService.on('session-connected', (eventData: any) =>
        handleVoiceEvent('voice-session-connected', eventData)
      );
      geminiVoiceService.on('session-ready', (eventData: any) =>
        handleVoiceEvent('voice-session-ready', eventData)
      );
      geminiVoiceService.on('voice-text', (eventData: any) => handleVoiceEvent('voice-text', eventData));
      geminiVoiceService.on('voice-audio', (eventData: any) =>
        handleVoiceEvent('voice-audio', eventData)
      );
      geminiVoiceService.on('session-disconnected', (eventData: any) =>
        handleVoiceEvent('voice-session-disconnected', eventData)
      );
      geminiVoiceService.on('session-error', (eventData: any) =>
        handleVoiceEvent('voice-session-error', eventData)
      );

      socket.emit('voice-session-started', sessionInfo);
    } catch (error: any) {
      logger.error(`Error starting voice session for socket ${socket.id}:`, error);
      socket.emit('voice-session-error', { error: error.message });
    }
  });

  socket.on('stop-voice-session', async (data: any) => {
    try {
      logger.info(`Stopping voice session for socket ${socket.id}:`, data);
      await geminiVoiceService.stopVoiceSession(data.sessionId);
      socket.emit('voice-session-stopped', { sessionId: data.sessionId });
    } catch (error: any) {
      logger.error(`Error stopping voice session for socket ${socket.id}:`, error);
      socket.emit('voice-session-error', { error: error.message });
    }
  });

  socket.on('voice-audio-input', async (data: any) => {
    try {
      const audioBuffer = Buffer.from(data.audioData, 'base64');
      await geminiVoiceService.sendAudioInput(data.sessionId, audioBuffer, data.mimeType);
    } catch (error: any) {
      logger.error(`Error sending voice audio for socket ${socket.id}:`, error);
      socket.emit('voice-session-error', { error: error.message });
    }
  });

  socket.on('voice-text-input', async (data: any) => {
    try {
      await geminiVoiceService.sendTextInput(data.sessionId, data.text);
    } catch (error: any) {
      logger.error(`Error sending voice text for socket ${socket.id}:`, error);
      socket.emit('voice-session-error', { error: error.message });
    }
  });

  // Handle client disconnection
  socket.on('disconnect', (reason: any) => {
    logger.info(`Client disconnected from WebSocket: ${socket.id}, reason: ${reason}`);
  });

  // Handle connection errors
  socket.on('error', (error: any) => {
    logger.error(`Socket.IO error for client ${socket.id}:`, error);
  });
});

// Graceful shutdown handling
let isShuttingDown = false;

const gracefulShutdown = (signal: string) => {
  if (isShuttingDown) {
    logger.warn(`${signal} received again, forcing exit`);
    process.exit(1);
  }

  isShuttingDown = true;
  logger.info(`${signal} received, shutting down gracefully`);

  dashboardNotificationService.stop();

  geminiVoiceService
    .cleanupAll()
    .then(() => {
      logger.info('Voice sessions cleaned up');
    })
    .catch((error: any) => {
      logger.error('Error cleaning up voice sessions:', error);
    });

  const forceExitTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timeout, forcing exit');
    process.exit(1);
  }, 10000);

  try {
    io.close((err: any) => {
      if (err) {
        logger.error('Error closing Socket.IO server:', err);
      } else {
        logger.info('Socket.IO server closed');
      }

      if (server.listening) {
        server.close((serverErr: any) => {
          if (serverErr) {
            logger.error('Error closing HTTP server:', serverErr);
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

export { app, server, io };
