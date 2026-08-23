#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Find root where package.json lives
let packageDir = path.resolve(__dirname, '../../..');
if (!fs.existsSync(path.join(packageDir, 'package.json'))) {
  packageDir = path.resolve(__dirname, '..');
}
if (!fs.existsSync(path.join(packageDir, 'package.json'))) {
  packageDir = process.cwd();
}

const serverPathCandidates = [
  path.join(packageDir, 'dist', 'apps', 'server', 'server.js'),
  path.join(packageDir, 'dist', 'server.js'),
  path.join(packageDir, 'server.js'),
];

const serverPath = serverPathCandidates.find(p => fs.existsSync(p)) || serverPathCandidates[0];

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Handle startup command
  if (args[0] === 'startup') {
    const startupCandidates = [
      path.join(__dirname, 'startup.js'),
      path.join(__dirname, 'startup.ts'),
      path.join(packageDir, 'apps', 'cli', 'src', 'startup.js'),
    ];
    const startupScript = startupCandidates.find(p => fs.existsSync(p)) || startupCandidates[0];
    const startupArgs = args.slice(1);

    const startupProcess = spawn('node', [startupScript, ...startupArgs], {
      stdio: 'inherit',
      cwd: packageDir,
    });

    startupProcess.on('exit', (code: number | null) => {
      process.exit(code || 0);
    });

    return;
  }

  // Handle validate command
  if (args[0] === 'validate') {
    const validateCandidates = [
      path.join(__dirname, 'validate.js'),
      path.join(__dirname, 'validate.ts'),
    ];
    const validateScript = validateCandidates.find(p => fs.existsSync(p)) || validateCandidates[0];

    const validateProcess = spawn('node', [validateScript], {
      stdio: 'inherit',
      cwd: packageDir,
    });

    validateProcess.on('exit', (code: number | null) => {
      process.exit(code || 0);
    });

    return;
  }

  if (args.includes('--help') || args.includes('-h')) {
    console.log('🚀 AI Workflow Utils');
    console.log('='.repeat(50));
    console.log('Usage: ai-workflow-utils [command] [options]');
    console.log('');
    console.log('Commands:');
    console.log('  startup        Manage startup service');
    console.log('    install      Install as startup service');
    console.log('    uninstall    Remove startup service');
    console.log('    start        Start the service');
    console.log('    stop         Stop the service');
    console.log('    status       Check service status');
    console.log('  validate       Validate startup configuration');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h     Show this help message');
    console.log('  --version, -v  Show version information');
    console.log('');
    console.log('Examples:');
    console.log('  ai-workflow-utils                    # Start normally');
    console.log('  ai-workflow-utils startup install   # Install as startup service');
    console.log('  ai-workflow-utils startup status    # Check service status');
    console.log('  ai-workflow-utils validate          # Validate configuration');
    console.log('');
    console.log('Configuration:');
    console.log('  All configuration is done through the web interface.');
    console.log('  After starting the application, visit:');
    console.log('  http://localhost:3000/settings/environment');
    console.log('');
    return;
  }

  if (args.includes('--version') || args.includes('-v')) {
    const packageJsonPath = path.join(packageDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log(`AI Workflow Utils v${packageJson.version}`);
    return;
  }

  console.log('🚀 AI Workflow Utils');
  console.log('='.repeat(50));

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
      PORT: '3000',
    },
  });

  server.on('error', (err: Error) => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  });

  server.on('close', (code: number | null) => {
    console.log(`🛑 Server process exited with code ${code}`);
    process.exit(code || 0);
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
main().catch((error: Error) => {
  console.error('❌ Application failed to start:', error.message);
  process.exit(1);
});
