#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Get the directory where the package is installed
const packageDir = path.dirname(__dirname);
const serverPath = path.join(packageDir, 'dist', 'server.js');

async function main() {
  // Handle command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('🚀 AI Workflow Utils');
    console.log('=' .repeat(50));
    console.log('Usage: ai-workflow-utils [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h     Show this help message');
    console.log('  --version, -v  Show version information');
    console.log('');
    console.log('Configuration:');
    console.log('  All configuration is done through the web interface.');
    console.log('  After starting the application, visit:');
    console.log('  http://localhost:3000/settings/environment');
    console.log('');
    return;
  }

  if (args.includes('--version') || args.includes('-v')) {
    const packageJson = require(path.join(packageDir, 'package.json'));
    console.log(`AI Workflow Utils v${packageJson.version}`);
    return;
  }

  console.log('🚀 AI Workflow Utils');
  console.log('=' .repeat(50));

  // Verify server build exists
  if (!fs.existsSync(serverPath)) {
    console.log('❌ Server build not found. Please run "npm run build" first.');
    process.exit(1);
  }

  console.log('🚀 Starting AI Workflow Utils server...');
  console.log(`📁 Package directory: ${packageDir}`);
  console.log(`🖥️  Server path: ${serverPath}`);
  console.log('');
  console.log('📋 Configuration:');
  console.log('   All settings can be configured through the web interface.');
  console.log('   Visit: http://localhost:3000/settings/environment');
  console.log('');
  console.log('🌐 Web Interface:');
  console.log('   Main Application: http://localhost:3000');
  console.log('   Settings: http://localhost:3000/settings');
  console.log('');

  // Start the server with default environment
  const server = spawn('node', [serverPath], {
    stdio: 'inherit',
    cwd: packageDir,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: '3000'
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
