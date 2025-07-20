#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const EnvironmentSetup = require('./setup.js');

// Get the directory where the package is installed
const packageDir = path.dirname(__dirname);
const serverPath = path.join(packageDir, 'dist', 'server.js');

// Use home directory for configuration
const configDir = path.join(require('os').homedir(), '.ai-workflow-utils');
const serverEnvPath = path.join(configDir, 'config.env');

async function main() {
  // Handle command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--config-info') || args.includes('--show-config')) {
    const setup = new EnvironmentSetup();
    setup.showConfigurationInfo();
    return;
  }

  console.log('🚀 AI Workflow Utils');
  console.log('=' .repeat(50));

  // Check if this is the first run or if environment files are missing
  const serverEnvExists = fs.existsSync(serverEnvPath);
  
  if (!serverEnvExists) {
    console.log('🔧 First time setup required...');
    console.log('Missing environment configuration files.\n');
    
    const setup = new EnvironmentSetup();
    const setupCompleted = await setup.setupEnvironment();
    
    if (!setupCompleted) {
      console.log('❌ Setup was cancelled or failed.');
      process.exit(1);
    }
    
    const isHealthy = await setup.checkEnvironmentHealth();
    if (!isHealthy) {
      console.log('❌ Configuration is incomplete. Please run setup again.');
      process.exit(1);
    }
  } else {
    // Check if existing configuration is healthy
    const setup = new EnvironmentSetup();
    const isHealthy = await setup.checkEnvironmentHealth();
    
    if (!isHealthy) {
      console.log('⚠️  Configuration issues detected.');
      const reconfigure = await setup.question('Would you like to reconfigure now? (y/N): ');
      
      if (reconfigure.toLowerCase() === 'y' || reconfigure.toLowerCase() === 'yes') {
        const setupCompleted = await setup.setupEnvironment();
        if (!setupCompleted) {
          console.log('❌ Setup was cancelled.');
          process.exit(1);
        }
      } else {
        console.log('⚠️  Continuing with current configuration...');
      }
    }
  }

  // Verify server build exists
  if (!fs.existsSync(serverPath)) {
    console.log('❌ Server build not found. Please run "npm run build" first.');
    process.exit(1);
  }

  console.log('\n🚀 Starting AI Workflow Utils server...');
  console.log(`📁 Package directory: ${packageDir}`);
  console.log(`🖥️  Server path: ${serverPath}`);

  // Load NODE_ENV from config file if it exists
  let nodeEnv = 'production'; // default
  if (fs.existsSync(serverEnvPath)) {
    try {
      const configContent = fs.readFileSync(serverEnvPath, 'utf8');
      const nodeEnvMatch = configContent.match(/^NODE_ENV=(.+)$/m);
      if (nodeEnvMatch) {
        nodeEnv = nodeEnvMatch[1].trim();
      }
    } catch (error) {
      console.warn('⚠️  Could not read NODE_ENV from config file, using default');
    }
  }

  // Start the server
  const server = spawn('node', [serverPath], {
    stdio: 'inherit',
    cwd: packageDir,
    env: {
      ...process.env,
      NODE_ENV: nodeEnv
    }
  });

  server.on('error', (err) => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  });

  server.on('close', (code) => {
    console.log(`🛑 Server process exited with code ${code}`);
    process.exit(code);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    server.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    server.kill('SIGTERM');
  });
}

// Handle async errors
main().catch((error) => {
  console.error('❌ Application failed to start:', error.message);
  process.exit(1);
});
