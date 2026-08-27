#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { StartupManager } from './startup.js';
import { checkPermissions } from './check-permissions.js';
import { EnvironmentSetup } from './setup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Capture the user's working directory where CLI/npx was invoked
const userCwd = process.env.AI_WORKFLOW_USER_CWD || process.env.INIT_CWD || process.cwd();

// Find root where package.json lives
let packageDir = path.resolve(__dirname, '../../..');
if (!fs.existsSync(path.join(packageDir, 'package.json'))) {
  packageDir = path.resolve(__dirname, '..');
}
if (!fs.existsSync(path.join(packageDir, 'package.json'))) {
  packageDir = userCwd;
}

// Load environment variables from user directory, global config, and package dir
const loadedEnvFiles: string[] = [];
const candidatePaths = [
  path.join(userCwd, '.env.local'),
  path.join(userCwd, '.env'),
  path.join(os.homedir(), '.ai-workflow-utils', 'config.env'),
  path.join(os.homedir(), '.ai-workflow-utils', '.env'),
  path.join(packageDir, '.env'),
];

for (const filePath of candidatePaths) {
  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const result = dotenv.config({ path: filePath });
      if (!result.error && !loadedEnvFiles.includes(filePath)) {
        loadedEnvFiles.push(filePath);
      }
    }
  } catch {
    // Ignore error reading file
  }
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
    const manager = new StartupManager();
    const subCommand = args[1];

    switch (subCommand) {
      case 'install':
        await manager.install();
        break;
      case 'uninstall':
        await manager.uninstall();
        break;
      case 'start':
        await manager.start();
        break;
      case 'stop':
        await manager.stop();
        break;
      case 'status':
        await manager.status();
        break;
      default:
        console.log('🚀 AI Workflow Utils - Startup Service Manager');
        console.log('='.repeat(50));
        console.log('Usage: ai-workflow-utils startup <command>');
        console.log('');
        console.log('Commands:');
        console.log('  install      Install and register as startup service');
        console.log('  uninstall    Remove and unregister startup service');
        console.log('  start        Start the registered service');
        console.log('  stop         Stop the registered service');
        console.log('  status       Check service registration & running status');
        console.log('');
        console.log('Examples:');
        console.log('  ai-workflow-utils startup install');
        console.log('  ai-workflow-utils startup status');
        console.log('  ai-workflow-utils startup stop');
        break;
    }
    return;
  }

  // Handle validate / setup command
  if (args[0] === 'validate') {
    console.log('🔍 Running system validation & permission checks...\n');
    const setup = new EnvironmentSetup();
    const envOk = await setup.checkEnvironmentHealth();
    const permOk = await checkPermissions();

    if (envOk && permOk) {
      console.log('\n🎉 Validation successful! System is ready to run.');
    } else {
      console.log('\n⚠️  Validation finished with warnings or issues. See details above.');
    }
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
    console.log('  validate       Validate startup configuration and permissions');
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
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      console.log(`AI Workflow Utils v${packageJson.version}`);
    } else {
      console.log('AI Workflow Utils');
    }
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
  console.log(`📁 Working directory: ${userCwd}`);
  console.log(`📦 Package directory: ${packageDir}`);
  console.log(`🖥️  Server path: ${serverPath}`);
  if (loadedEnvFiles.length > 0) {
    console.log(`🌲 Loaded environment: ${loadedEnvFiles.join(', ')}`);
  }
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
      AI_WORKFLOW_USER_CWD: userCwd,
      AI_WORKFLOW_PACKAGE_DIR: packageDir,
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: process.env.PORT || '3000',
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
