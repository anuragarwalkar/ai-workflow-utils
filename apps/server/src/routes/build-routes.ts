import express, { Request, Response, NextFunction } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';
import os from 'os';
import multer from 'multer';
import { Server as SocketIOServer } from 'socket.io';
import logger from '../logger.ts';
import { asyncHandler, createRateLimit } from '../middleware/index.ts';

const projectRoot = process.cwd();

const getUploadDir = (): { projectUploadDir: string; tempUploadDir: string } => {
  if (process.env.UPLOAD_DIR) {
    const customDir = path.resolve(process.env.UPLOAD_DIR, 'build-scripts');
    return { projectUploadDir: customDir, tempUploadDir: customDir };
  }

  const projectUploadDir = path.join(projectRoot, 'uploads', 'build-scripts');
  const tempUploadDir = path.join(os.tmpdir(), 'ai-workflow-utils', 'build-scripts');

  return { projectUploadDir, tempUploadDir };
};

const ensureUploadDir = async (): Promise<string> => {
  const { projectUploadDir, tempUploadDir } = getUploadDir();

  try {
    await fs.mkdir(projectUploadDir, { recursive: true });
    const testFile = path.join(projectUploadDir, '.write-test');
    await fs.writeFile(testFile, 'test');
    await fs.unlink(testFile);

    logger.info('Using project upload directory', { dir: projectUploadDir });
    return projectUploadDir;
  } catch (error: any) {
    logger.warn('Project upload directory not writable, using temp directory', {
      projectDir: projectUploadDir,
      tempDir: tempUploadDir,
      error: error.message,
    });

    try {
      await fs.mkdir(tempUploadDir, { recursive: true });
      return tempUploadDir;
    } catch (tempError: any) {
      logger.error('Failed to create temp upload directory', {
        error: tempError.message,
      });
      throw new Error('Unable to create upload directory');
    }
  }
};

export default (io: SocketIOServer): express.Router => {
  const router = express.Router();

  const scriptStorage = multer.diskStorage({
    destination: async (_req, _file, cb) => {
      try {
        const uploadDir = await ensureUploadDir();
        cb(null, uploadDir);
      } catch (error: any) {
        logger.error('Failed to ensure upload directory', { error: error.message });
        cb(error, '');
      }
    },
    filename: (_req, file, cb) => {
      const timestamp = Date.now();
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `${timestamp}-${sanitizedName}`);
    },
  });

  const uploadScript = multer({
    storage: scriptStorage,
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
    fileFilter: (_req, file, cb) => {
      if (file.originalname.endsWith('.sh')) {
        cb(null, true);
      } else {
        cb(new Error('Only shell script files (.sh) are allowed'));
      }
    },
  });

  const makeScriptExecutable = async (filePath: string): Promise<void> => {
    try {
      if (process.platform !== 'win32') {
        await fs.chmod(filePath, 0o755);
        logger.info('Made script executable', { filePath });
      }
    } catch (error: any) {
      logger.warn('Failed to make script executable', {
        filePath,
        error: error.message,
      });
    }
  };

  const buildRateLimit = createRateLimit(60 * 60 * 1000, 5);
  router.use(buildRateLimit);

  router.post(
    '/upload-script',
    (req: Request, res: Response, next: NextFunction) => {
      uploadScript.single('buildScript')(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({
              success: false,
              error: 'File too large. Maximum size is 5MB.',
            });
            return;
          }
          res.status(400).json({
            success: false,
            error: `Upload error: ${err.message}`,
          });
          return;
        } else if (err) {
          res.status(400).json({
            success: false,
            error: err.message,
          });
          return;
        }
        next();
      });
    },
    asyncHandler(async (req: Request, res: Response) => {
      logger.info('Uploading build script', { file: req.file });

      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
        return;
      }

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

  const getScriptPath = async (customScriptPath?: string): Promise<string> => {
    if (customScriptPath) {
      const scriptPath = path.resolve(customScriptPath);
      logger.info('Using custom build script', { scriptPath });

      try {
        await fs.access(scriptPath);
        return scriptPath;
      } catch (error: any) {
        logger.error('Custom script not found, falling back to default', {
          customScriptPath,
          error: error.message,
        });
      }
    }

    const defaultPath = path.join(projectRoot, 'server/scripts/release_build.sh');
    logger.info('Using default build script', { scriptPath: defaultPath });
    return defaultPath;
  };

  router.post(
    '/release',
    asyncHandler(async (req: Request, res: Response) => {
      const {
        ticketNumber,
        selectedPackages,
        createPullRequest,
        scriptPath: customScriptPath,
      } = req.body;

      logger.info('Starting mobile app build process', {
        ticketNumber,
        selectedPackages: selectedPackages?.length || 0,
        createPullRequest,
        customScript: Boolean(customScriptPath),
      });

      if (!ticketNumber) {
        res.status(400).json({
          success: false,
          message: 'Ticket number is required',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Build process started',
        buildId: Date.now().toString(),
      });

      const scriptPath = await getScriptPath(customScriptPath);

      const scriptArgs = [
        scriptPath,
        ticketNumber,
        selectedPackages ? selectedPackages.join(',') : '',
        createPullRequest ? 'true' : 'false',
      ];

      const buildProcess = spawn('bash', scriptArgs, {
        cwd: path.dirname(scriptPath),
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      io.emit('build-progress', {
        type: 'start',
        message: 'Build process initiated...',
        timestamp: new Date().toISOString(),
      });

      buildProcess.stdout.on('data', data => {
        const output = data.toString();
        logger.info(`Build stdout: ${output}`);

        io.emit('build-progress', {
          type: 'stdout',
          message: output,
          timestamp: new Date().toISOString(),
        });
      });

      buildProcess.stderr.on('data', data => {
        const output = data.toString();
        logger.warn(`Build stderr: ${output}`);

        io.emit('build-progress', {
          type: 'stderr',
          message: output,
          timestamp: new Date().toISOString(),
        });
      });

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

      buildProcess.stdin.on('error', error => {
        logger.error(`Build stdin error: ${error.message}`);
      });
    })
  );

  router.get('/status', (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Build service is running',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
};
