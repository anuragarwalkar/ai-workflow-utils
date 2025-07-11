const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const logger = require('../logger');

module.exports = (io) => {
  const router = express.Router();

  // Start mobile app build process
  router.post('/release', (req, res) => {
    try {
      const { ticketNumber, selectedPackages, createPullRequest } = req.body;
      
      logger.info('Starting mobile app build process', {
        ticketNumber,
        selectedPackages: selectedPackages?.length || 0,
        createPullRequest
      });
      
      // Validate required parameters
      if (!ticketNumber) {
        return res.status(400).json({
          success: false,
          message: 'Ticket number is required'
        });
      }
      
      // Send immediate response to client
      res.json({ 
        success: true, 
        message: 'Build process started',
        buildId: Date.now().toString()
      });

      // Path to the release script
      const scriptPath = path.join(__dirname, '../scripts/release_build.sh');
      
      // Prepare script arguments
      const scriptArgs = [
        scriptPath,
        ticketNumber,
        selectedPackages ? selectedPackages.join(',') : '',
        createPullRequest ? 'true' : 'false'
      ];
      
      // Spawn the shell script process with arguments
      const buildProcess = spawn('bash', scriptArgs, {
        cwd: path.dirname(scriptPath),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Emit build started event
      io.emit('build-progress', {
        type: 'start',
        message: 'Build process initiated...',
        timestamp: new Date().toISOString()
      });

      // Handle stdout (normal output)
      buildProcess.stdout.on('data', (data) => {
        const output = data.toString();
        logger.info(`Build stdout: ${output}`);
        
        io.emit('build-progress', {
          type: 'stdout',
          message: output,
          timestamp: new Date().toISOString()
        });
      });

      // Handle stderr (error output)
      buildProcess.stderr.on('data', (data) => {
        const output = data.toString();
        logger.warn(`Build stderr: ${output}`);
        
        io.emit('build-progress', {
          type: 'stderr',
          message: output,
          timestamp: new Date().toISOString()
        });
      });

      // Handle process completion
      buildProcess.on('close', (code) => {
        const message = `Build process completed with exit code: ${code}`;
        logger.info(message);
        
        io.emit('build-progress', {
          type: code === 0 ? 'success' : 'error',
          message: message,
          exitCode: code,
          timestamp: new Date().toISOString()
        });
      });

      // Handle process errors
      buildProcess.on('error', (error) => {
        const message = `Build process error: ${error.message}`;
        logger.error(message);
        
        io.emit('build-progress', {
          type: 'error',
          message: message,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      });

      // Handle user input for interactive prompts
      buildProcess.stdin.on('error', (error) => {
        logger.error(`Build stdin error: ${error.message}`);
      });

    } catch (error) {
      logger.error(`Failed to start build process: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to start build process',
        error: error.message 
      });
    }
  });

  // Get build status
  router.get('/status', (req, res) => {
    res.json({ 
      success: true, 
      message: 'Build service is running',
      timestamp: new Date().toISOString()
    });
  });

  return router;
};
