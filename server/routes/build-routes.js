import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';
import os from 'os';
import multer from 'multer';
import logger from '../logger.js';
import { asyncHandler, createRateLimit } from '../middleware/index.js';

// Use project root for consistent path resolution
const projectRoot = process.cwd();

// Create a safe upload directory that works across different environments
const getUploadDir = () => {
  // Allow custom upload directory via environment variable
  if (process.env.UPLOAD_DIR) {
    const customDir = path.resolve(process.env.UPLOAD_DIR, 'build-scripts');
    return { projectUploadDir: customDir, tempUploadDir: customDir };
  }
  
  // Try to use a directory within the project first
  const projectUploadDir = path.join(projectRoot, 'uploads', 'build-scripts');
  
  // Fallback to OS temp directory if project directory is not writable
  const tempUploadDir = path.join(os.tmpdir(), 'ai-workflow-utils', 'build-scripts');
  
  return { projectUploadDir, tempUploadDir };
};

const ensureUploadDir = async () => {
  const { projectUploadDir, tempUploadDir } = getUploadDir();
  
  try {
    // Try to create and test write permissions in project directory
    await fs.mkdir(projectUploadDir, { recursive: true });
    
    // Test write permissions by creating a test file
    const testFile = path.join(projectUploadDir, '.write-test');
    await fs.writeFile(testFile, 'test');
    await fs.unlink(testFile);
    
    logger.info('Using project upload directory', { dir: projectUploadDir });
    return projectUploadDir;
  } catch (error) {
    logger.warn('Project upload directory not writable, using temp directory', { 
      projectDir: projectUploadDir,
      tempDir: tempUploadDir,
      error: error.message 
    });
    
    try {
      await fs.mkdir(tempUploadDir, { recursive: true });
      return tempUploadDir;
    } catch (tempError) {
      logger.error('Failed to create temp upload directory', { 
        error: tempError.message 
      });
      throw new Error('Unable to create upload directory');
    }
  }
};

export default io => {
  const router = express.Router();

  // Configure multer for build script uploads
  const scriptStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        const uploadDir = await ensureUploadDir();
        cb(null, uploadDir);
      } catch (error) {
        logger.error('Failed to ensure upload directory', { error: error.message });
        cb(error, null);
      }
    },
    filename: (req, file, cb) => {
      // Keep original filename with timestamp prefix for uniqueness
      const timestamp = Date.now();
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `${timestamp}-${sanitizedName}`);
    },
  });

  const uploadScript = multer({
    storage: scriptStorage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
      files: 1,
    },
    fileFilter: (req, file, cb) => {
      // Allow only shell script files
      if (file.originalname.endsWith('.sh') && file.mimetype === 'application/x-sh') {
        cb(null, true);
      } else if (file.originalname.endsWith('.sh')) {
        // Sometimes .sh files don't have the correct MIME type
        cb(null, true);
      } else {
        cb(new Error('Only shell script files (.sh) are allowed'), false);
      }
    },
  });

  // Function to make script executable (Unix-like systems)
  const makeScriptExecutable = async filePath => {
    try {
      // Only attempt to change permissions on Unix-like systems
      if (process.platform !== 'win32') {
        await fs.chmod(filePath, 0o755);
        logger.info('Made script executable', { filePath });
      }
    } catch (error) {
      logger.warn('Failed to make script executable', { 
        filePath, 
        error: error.message 
      });
      // Don't throw - this is not critical for functionality
    }
  };

  // Apply rate limiting for build routes (very restrictive)
  const buildRateLimit = createRateLimit(60 * 60 * 1000, 5); // 5 builds per hour
  router.use(buildRateLimit);

  // Upload build script route
  router.post(
    '/upload-script',
    (req, res, next) => {
      uploadScript.single('buildScript')(req, res, err => {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
              success: false,
              error: 'File too large. Maximum size is 5MB.' 
            });
          }
          return res.status(400).json({ 
            success: false,
            error: `Upload error: ${err.message}` 
          });
        } else if (err) {
          return res.status(400).json({ 
            success: false,
            error: err.message 
          });
        }
        next();
      });
    },
    asyncHandler(async (req, res) => {
      logger.info('Uploading build script', { file: req.file });

      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          error: 'No file uploaded' 
        });
      }

      // Make the script executable
      await makeScriptExecutable(req.file.path);

      res.json({
        success: true,
        message: 'Build script uploaded successfully',
        script: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: req.file.path,
          size: req.file.size,
        },
      });
    })
  );

  // Helper function to determine script path
  const getScriptPath = async customScriptPath => {
    if (customScriptPath) {
      // Use uploaded script
      const scriptPath = path.resolve(customScriptPath);
      logger.info('Using custom build script', { scriptPath });
      
      // Verify the custom script exists
      try {
        await fs.access(scriptPath);
        return scriptPath;
      } catch (error) {
        logger.error('Custom script not found, falling back to default', { 
          customScriptPath, 
          error: error.message 
        });
      }
    }
    
    // Use default script
    const defaultPath = path.join(projectRoot, 'server/scripts/release_build.sh');
    logger.info('Using default build script', { scriptPath: defaultPath });
    return defaultPath;
  };

  // Start mobile app build process
  router.post(
    '/release',
    asyncHandler(async (req, res) => {
      const { 
        ticketNumber, 
        selectedPackages, 
        createPullRequest,
        scriptPath: customScriptPath
      } = req.body;

      logger.info('Starting mobile app build process', {
        ticketNumber,
        selectedPackages: selectedPackages?.length || 0,
        createPullRequest,
        customScript: !!customScriptPath,
      });

      // Validate required parameters
      if (!ticketNumber) {
        return res.status(400).json({
          success: false,
          message: 'Ticket number is required',
        });
      }

      // Send immediate response to client
      res.json({
        success: true,
        message: 'Build process started',
        buildId: Date.now().toString(),
      });

      // Determine which script to use
      const scriptPath = await getScriptPath(customScriptPath);

      // Prepare script arguments
      const scriptArgs = [
        scriptPath,
        ticketNumber,
        selectedPackages ? selectedPackages.join(',') : '',
        createPullRequest ? 'true' : 'false',
      ];

      // Spawn the shell script process with arguments
      const buildProcess = spawn('bash', scriptArgs, {
        cwd: path.dirname(scriptPath),
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Emit build started event
      io.emit('build-progress', {
        type: 'start',
        message: 'Build process initiated...',
        timestamp: new Date().toISOString(),
      });

      // Handle stdout (normal output)
      buildProcess.stdout.on('data', data => {
        const output = data.toString();
        logger.info(`Build stdout: ${output}`);

        io.emit('build-progress', {
          type: 'stdout',
          message: output,
          timestamp: new Date().toISOString(),
        });
      });

      // Handle stderr (error output)
      buildProcess.stderr.on('data', data => {
        const output = data.toString();
        logger.warn(`Build stderr: ${output}`);

        io.emit('build-progress', {
          type: 'stderr',
          message: output,
          timestamp: new Date().toISOString(),
        });
      });

      // Handle process completion
      buildProcess.on('close', code => {
        const message = `Build process completed with exit code: ${code}`;
        logger.info(message);

        io.emit('build-progress', {
          type: code === 0 ? 'success' : 'error',
          message,
          exitCode: code,
          timestamp: new Date().toISOString(),
        });
      });

      // Handle process errors
      buildProcess.on('error', error => {
        const message = `Build process error: ${error.message}`;
        logger.error(message);

        io.emit('build-progress', {
          type: 'error',
          message,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      });

      // Handle user input for interactive prompts
      buildProcess.stdin.on('error', error => {
        logger.error(`Build stdin error: ${error.message}`);
      });
    })
  );

  // Get build status
  router.get('/status', (req, res) => {
    res.json({
      success: true,
      message: 'Build service is running',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
};
