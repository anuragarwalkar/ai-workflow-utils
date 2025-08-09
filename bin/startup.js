#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get the directory where the package is installed
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class StartupManager {
  constructor() {
    this.packageDir = path.dirname(__dirname);
    const packageJsonPath = path.join(this.packageDir, 'package.json');
    this.packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    this.serviceName = 'ai-workflow-utils';
    this.platform = os.platform();
  }

  async install() {
    console.log('🚀 Installing AI Workflow Utils as startup service...');
    console.log(`📦 Package: ${this.packageJson.name} v${this.packageJson.version}`);
    console.log(`🖥️  Platform: ${this.platform}`);
    console.log('');

    try {
      switch (this.platform) {
      case 'darwin':
        await this.installMacOS();
        break;
      case 'win32':
        await this.installWindows();
        break;
      case 'linux':
        await this.installLinux();
        break;
      default:
        throw new Error(`Unsupported platform: ${this.platform}`);
      }

      console.log('');
      console.log('✅ Startup service installed successfully!');
      console.log('');
      console.log('📋 Next steps:');
      console.log('   • The service will start automatically on system boot');
      console.log('   • Access the web interface at: http://localhost:3000');
      console.log('   • Configure settings at: http://localhost:3000/settings/environment');
      console.log('');
      console.log('🔧 Management commands:');
      console.log('   • Start:   ai-workflow-utils startup start');
      console.log('   • Stop:    ai-workflow-utils startup stop');
      console.log('   • Status:  ai-workflow-utils startup status');
      console.log('   • Remove:  ai-workflow-utils startup uninstall');

    } catch (error) {
      console.error('❌ Failed to install startup service:', error.message);
      process.exit(1);
    }
  }

  async uninstall() {
    console.log('🗑️  Removing AI Workflow Utils startup service...');
    
    try {
      switch (this.platform) {
      case 'darwin':
        await this.uninstallMacOS();
        break;
      case 'win32':
        await this.uninstallWindows();
        break;
      case 'linux':
        await this.uninstallLinux();
        break;
      default:
        throw new Error(`Unsupported platform: ${this.platform}`);
      }

      console.log('✅ Startup service removed successfully!');
    } catch (error) {
      console.error('❌ Failed to remove startup service:', error.message);
      process.exit(1);
    }
  }

  async start() {
    console.log('▶️  Starting AI Workflow Utils service...');
    
    try {
      switch (this.platform) {
      case 'darwin':
        execSync(`launchctl start ${this.serviceName}`, { stdio: 'inherit' });
        break;
      case 'win32':
        execSync(`sc start "${this.serviceName}"`, { stdio: 'inherit' });
        break;
      case 'linux':
        execSync(`sudo systemctl start ${this.serviceName}`, { stdio: 'inherit' });
        break;
      }
      console.log('✅ Service started successfully!');
    } catch (error) {
      console.error('❌ Failed to start service:', error.message);
      process.exit(1);
    }
  }

  async stop() {
    console.log('⏹️  Stopping AI Workflow Utils service...');
    
    try {
      switch (this.platform) {
      case 'darwin':
        execSync(`launchctl stop ${this.serviceName}`, { stdio: 'inherit' });
        break;
      case 'win32':
        execSync(`sc stop "${this.serviceName}"`, { stdio: 'inherit' });
        break;
      case 'linux':
        execSync(`sudo systemctl stop ${this.serviceName}`, { stdio: 'inherit' });
        break;
      }
      console.log('✅ Service stopped successfully!');
    } catch (error) {
      console.error('❌ Failed to stop service:', error.message);
      process.exit(1);
    }
  }

  async status() {
    console.log('🔍 Checking AI Workflow Utils service status...');
    
    try {
      switch (this.platform) {
      case 'darwin':
        execSync(`launchctl list | grep ${this.serviceName}`, { stdio: 'inherit' });
        break;
      case 'win32':
        execSync(`sc query "${this.serviceName}"`, { stdio: 'inherit' });
        break;
      case 'linux':
        execSync(`sudo systemctl status ${this.serviceName}`, { stdio: 'inherit' });
        break;
      }
    } catch (error) {
      console.log('❌ Service is not running or not installed');
    }
  }

  async installMacOS() {
    const launchAgentsDir = path.join(os.homedir(), 'Library', 'LaunchAgents');
    const plistPath = path.join(launchAgentsDir, `${this.serviceName}.plist`);
    
    // Get the full path to Node.js, handling NVM installations
    let nodePath;
    try {
      nodePath = execSync('which node', { encoding: 'utf8' }).trim();
    } catch (error) {
      // Fallback to common Node.js locations
      const commonPaths = [
        '/usr/local/bin/node',
        '/opt/homebrew/bin/node',
        process.execPath,
      ];
      
      nodePath = commonPaths.find(p => fs.existsSync(p)) || process.execPath;
    }
    
    const cliPath = path.join(this.packageDir, 'bin', 'cli.js');

    // Ensure LaunchAgents directory exists
    if (!fs.existsSync(launchAgentsDir)) {
      fs.mkdirSync(launchAgentsDir, { recursive: true });
    }

    // Create plist file with better environment handling
    const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${this.serviceName}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${nodePath}</string>
        <string>${cliPath}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
        <key>Crashed</key>
        <true/>
    </dict>
    <key>StandardOutPath</key>
    <string>${os.homedir()}/Library/Logs/${this.serviceName}.log</string>
    <key>StandardErrorPath</key>
    <string>${os.homedir()}/Library/Logs/${this.serviceName}.error.log</string>
    <key>WorkingDirectory</key>
    <string>${this.packageDir}</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PORT</key>
        <string>3000</string>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:${path.dirname(nodePath)}</string>
    </dict>
    <key>ProcessType</key>
    <string>Background</string>
    <key>ThrottleInterval</key>
    <integer>10</integer>
</dict>
</plist>`;

    fs.writeFileSync(plistPath, plistContent);
    console.log(`📝 Created plist file: ${plistPath}`);
    console.log(`🔧 Using Node.js at: ${nodePath}`);
    console.log(`📁 CLI path: ${cliPath}`);
    console.log('📊 Logs will be written to:');
    console.log(`   • Output: ${os.homedir()}/Library/Logs/${this.serviceName}.log`);
    console.log(`   • Errors: ${os.homedir()}/Library/Logs/${this.serviceName}.error.log`);

    // Load the service
    execSync(`launchctl load ${plistPath}`, { stdio: 'inherit' });
    console.log('🔄 Service loaded into launchctl');
  }

  async uninstallMacOS() {
    const plistPath = path.join(os.homedir(), 'Library', 'LaunchAgents', `${this.serviceName}.plist`);
    
    if (fs.existsSync(plistPath)) {
      try {
        execSync(`launchctl unload ${plistPath}`, { stdio: 'pipe' });
      } catch (error) {
        // Ignore errors if service is not loaded
      }
      fs.unlinkSync(plistPath);
      console.log('🗑️  Removed plist file and unloaded service');
    } else {
      console.log('ℹ️  Service was not installed');
    }
  }

  async installWindows() {
    const servicePath = path.join(this.packageDir, 'bin', 'windows-service.js');
    const nodePath = process.execPath;
    
    // Create Windows service wrapper
    this.createWindowsServiceWrapper(servicePath);

    // Create the service using sc command
    const createCmd = `sc create "${this.serviceName}" binPath= "${nodePath} ${servicePath}" start= auto DisplayName= "AI Workflow Utils"`;
    execSync(createCmd, { stdio: 'inherit' });
    console.log('🔧 Windows service created');

    // Set service description
    const descCmd = `sc description "${this.serviceName}" "AI Workflow Utils - Comprehensive automation platform for software development workflows"`;
    execSync(descCmd, { stdio: 'inherit' });
    console.log('📝 Service description set');

    // Start the service
    execSync(`sc start "${this.serviceName}"`, { stdio: 'inherit' });
    console.log('▶️  Service started');
  }

  async uninstallWindows() {
    try {
      execSync(`sc stop "${this.serviceName}"`, { stdio: 'pipe' });
    } catch (error) {
      // Ignore if service is already stopped
    }
    
    execSync(`sc delete "${this.serviceName}"`, { stdio: 'inherit' });
    console.log('🗑️  Windows service removed');

    // Remove service wrapper file
    const servicePath = path.join(this.packageDir, 'bin', 'windows-service.js');
    if (fs.existsSync(servicePath)) {
      fs.unlinkSync(servicePath);
    }
  }

  createWindowsServiceWrapper(servicePath) {
    const wrapperContent = `import { Service } from 'node-windows';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new service object
const svc = new Service({
  name: '${this.serviceName}',
  description: 'AI Workflow Utils - Comprehensive automation platform',
  script: path.join(__dirname, 'cli.js'),
  nodeOptions: [
    '--max_old_space_size=4096'
  ],
  env: {
    name: 'NODE_ENV',
    value: 'production'
  }
});

// Listen for the "install" event, which indicates the process is available as a service
svc.on('install', function() {
  svc.start();
});

svc.on('alreadyinstalled', function() {
  console.log('Service is already installed.');
});

// Install the script as a service
if (process.argv.includes('--install')) {
  svc.install();
} else if (process.argv.includes('--uninstall')) {
  svc.uninstall();
} else {
  // Run directly
  const cliPath = path.join(__dirname, 'cli.js');
  const server = spawn('node', [cliPath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });

  server.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

  process.on('SIGINT', () => {
    server.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    server.kill('SIGTERM');
  });
}`;

    fs.writeFileSync(servicePath, wrapperContent);
    console.log(`📝 Created Windows service wrapper: ${servicePath}`);
  }

  async installLinux() {
    const serviceFilePath = `/etc/systemd/system/${this.serviceName}.service`;
    const nodePath = execSync('which node', { encoding: 'utf8' }).trim();
    const cliPath = path.join(this.packageDir, 'bin', 'cli.js');
    const { username } = os.userInfo();

    const serviceContent = `[Unit]
Description=AI Workflow Utils - Comprehensive automation platform
After=network.target

[Service]
Type=simple
User=${username}
WorkingDirectory=${this.packageDir}
ExecStart=${nodePath} ${cliPath}
Restart=always
RestartSec=3
Environment=NODE_ENV=production
Environment=PORT=3000
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target`;

    // Write service file (requires sudo)
    fs.writeFileSync('/tmp/ai-workflow-utils.service', serviceContent);
    execSync(`sudo mv /tmp/ai-workflow-utils.service ${serviceFilePath}`, { stdio: 'inherit' });
    console.log(`📝 Created systemd service file: ${serviceFilePath}`);

    // Reload systemd and enable service
    execSync('sudo systemctl daemon-reload', { stdio: 'inherit' });
    execSync(`sudo systemctl enable ${this.serviceName}`, { stdio: 'inherit' });
    console.log('🔄 Service enabled for startup');

    // Start the service
    execSync(`sudo systemctl start ${this.serviceName}`, { stdio: 'inherit' });
    console.log('▶️  Service started');
  }

  async uninstallLinux() {
    const serviceFilePath = `/etc/systemd/system/${this.serviceName}.service`;
    
    try {
      execSync(`sudo systemctl stop ${this.serviceName}`, { stdio: 'pipe' });
      execSync(`sudo systemctl disable ${this.serviceName}`, { stdio: 'pipe' });
    } catch (error) {
      // Ignore if service is not running
    }

    if (fs.existsSync(serviceFilePath)) {
      execSync(`sudo rm ${serviceFilePath}`, { stdio: 'inherit' });
      execSync('sudo systemctl daemon-reload', { stdio: 'inherit' });
      console.log('🗑️  Systemd service removed');
    } else {
      console.log('ℹ️  Service was not installed');
    }
  }
}

async function main() {
  const manager = new StartupManager();
  const command = process.argv[2];

  switch (command) {
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
    console.log('🚀 AI Workflow Utils - Startup Manager');
    console.log('=' .repeat(50));
    console.log('Usage: ai-workflow-utils startup <command>');
    console.log('');
    console.log('Commands:');
    console.log('  install    Install as startup service');
    console.log('  uninstall  Remove startup service');
    console.log('  start      Start the service');
    console.log('  stop       Stop the service');
    console.log('  status     Check service status');
    console.log('');
    console.log('Examples:');
    console.log('  ai-workflow-utils startup install');
    console.log('  ai-workflow-utils startup status');
    console.log('  ai-workflow-utils startup uninstall');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Startup manager failed:', error.message);
  process.exit(1);
});
