#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync, spawn } = require('child_process');

class StartupManager {
  constructor() {
    this.packageDir = path.dirname(__dirname);
    this.packageJson = require(path.join(this.packageDir, 'package.json'));
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
          console.log('⏳ Starting Windows service (this may take a moment)...');
          execSync(`sc start "${this.serviceName}"`, { stdio: 'inherit', timeout: 30000 });
          
          // Wait and verify service started
          await new Promise(resolve => setTimeout(resolve, 3000));
          try {
            const result = execSync(`sc query "${this.serviceName}"`, { encoding: 'utf8' });
            if (result.includes('RUNNING')) {
              console.log('✅ Service is now running');
            } else {
              console.log('⚠️  Service may not be running properly. Check status with: sc query "ai-workflow-utils"');
            }
          } catch (error) {
            console.log('⚠️  Could not verify service status:', error.message);
          }
          break;
        case 'linux':
          execSync(`sudo systemctl start ${this.serviceName}`, { stdio: 'inherit' });
          break;
      }
      
      if (this.platform !== 'win32') {
        console.log('✅ Service started successfully!');
      }
    } catch (error) {
      console.error('❌ Failed to start service:', error.message);
      
      if (this.platform === 'win32') {
        console.log('');
        console.log('💡 Troubleshooting tips:');
        console.log('   • Check if the service is installed: sc query "ai-workflow-utils"');
        console.log('   • Check service logs in the logs/ directory');
        console.log('   • Try reinstalling: ai-workflow-utils startup uninstall && ai-workflow-utils startup install');
      }
      
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
          console.log('⏳ Stopping Windows service...');
          execSync(`sc stop "${this.serviceName}"`, { stdio: 'inherit', timeout: 15000 });
          
          // Wait and verify service stopped
          await new Promise(resolve => setTimeout(resolve, 2000));
          try {
            const result = execSync(`sc query "${this.serviceName}"`, { encoding: 'utf8' });
            if (result.includes('STOPPED')) {
              console.log('✅ Service stopped successfully');
            } else {
              console.log('⚠️  Service may still be running. Check status with: sc query "ai-workflow-utils"');
            }
          } catch (error) {
            console.log('⚠️  Could not verify service status after stop');
          }
          break;
        case 'linux':
          execSync(`sudo systemctl stop ${this.serviceName}`, { stdio: 'inherit' });
          break;
      }
      
      if (this.platform !== 'win32') {
        console.log('✅ Service stopped successfully!');
      }
    } catch (error) {
      console.error('❌ Failed to stop service:', error.message);
      
      if (this.platform === 'win32') {
        console.log('');
        console.log('💡 If the service won\'t stop, you may need to:');
        console.log('   • Check Windows Services (services.msc) and stop it manually');
        console.log('   • Or restart your computer to force stop the service');
      }
      
      process.exit(1);
    }
  }

  async status() {
    console.log('🔍 Checking AI Workflow Utils service status...');
    console.log('');
    
    try {
      switch (this.platform) {
        case 'darwin':
          execSync(`launchctl list | grep ${this.serviceName}`, { stdio: 'inherit' });
          break;
        case 'win32': {
          console.log('Windows Service Status:');
          console.log('='.repeat(40));
          execSync(`sc query "${this.serviceName}"`, { stdio: 'inherit' });
          
          // Also check if service is set to auto-start
          console.log('');
          console.log('Service Configuration:');
          console.log('='.repeat(40));
          try {
            execSync(`sc qc "${this.serviceName}"`, { stdio: 'inherit' });
          } catch (error) {
            console.log('Could not retrieve service configuration');
          }
          
          // Check if logs exist and show recent entries
          const logFile = path.join(this.packageDir, 'logs', 'service.log');
          if (fs.existsSync(logFile)) {
            console.log('');
            console.log('Recent Log Entries:');
            console.log('='.repeat(40));
            try {
              const logContent = fs.readFileSync(logFile, 'utf8');
              const lines = logContent.split('\n').slice(-10).filter(line => line.trim());
              if (lines.length > 0) {
                console.log(lines.join('\n'));
              } else {
                console.log('No recent log entries found');
              }
            } catch (error) {
              console.log('Could not read log file');
            }
          }
          break;
        }
        case 'linux':
          execSync(`sudo systemctl status ${this.serviceName}`, { stdio: 'inherit' });
          break;
      }
      
      if (this.platform === 'win32') {
        console.log('');
        console.log('💡 Useful commands:');
        console.log(`   • Start service: sc start "${this.serviceName}"`);
        console.log(`   • Stop service: sc stop "${this.serviceName}"`);
        console.log(`   • View logs: type "${path.join(this.packageDir, 'logs', 'service.log')}"`);
        console.log('   • Web interface: http://localhost:3000');
      }
    } catch (error) {
      if (this.platform === 'win32') {
        console.log('❌ Service is not installed or not accessible');
        console.log('');
        console.log('💡 To install the service, run:');
        console.log('   ai-workflow-utils startup install');
      } else {
        console.log('❌ Service is not running or not installed');
      }
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
        process.execPath
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
    console.log(`📊 Logs will be written to:`);
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

    // Create the service using sc command with proper timeout and delayed start
    const createCmd = `sc create "${this.serviceName}" binPath= "${nodePath} \\"${servicePath}\\"" start= delayed-auto DisplayName= "AI Workflow Utils"`;
    execSync(createCmd, { stdio: 'inherit' });
    console.log('🔧 Windows service created with delayed auto-start');

    // Set service description
    const descCmd = `sc description "${this.serviceName}" "AI Workflow Utils - Comprehensive automation platform for software development workflows"`;
    execSync(descCmd, { stdio: 'inherit' });
    console.log('📝 Service description set');

    // Configure service failure actions
    const failureCmd = `sc failure "${this.serviceName}" reset= 30 actions= restart/5000/restart/10000/restart/30000`;
    try {
      execSync(failureCmd, { stdio: 'pipe' });
      console.log('🔧 Service failure recovery configured');
    } catch (error) {
      console.log('⚠️  Could not configure failure recovery (this is optional)');
    }

    // Configure service to allow longer startup time
    try {
      const configCmd = `sc config "${this.serviceName}" depend= ""`; // Remove dependencies that might delay startup
      execSync(configCmd, { stdio: 'pipe' });
      console.log('🔧 Service dependencies configured');
    } catch (error) {
      console.log('⚠️  Could not configure service dependencies');
    }

    // Start the service with extended timeout handling
    console.log('▶️  Starting service...');
    try {
      // Use a longer timeout for service start
      execSync(`sc start "${this.serviceName}"`, { stdio: 'inherit', timeout: 60000 });
      console.log('✅ Service start command issued');
      
      // Wait longer and check service status multiple times
      console.log('⏳ Waiting for service to fully initialize...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      let attempts = 0;
      let serviceRunning = false;
      
      while (attempts < 6 && !serviceRunning) {
        try {
          const result = execSync(`sc query "${this.serviceName}"`, { encoding: 'utf8', stdio: 'pipe' });
          if (result.includes('RUNNING')) {
            console.log('✅ Service is now running');
            serviceRunning = true;
          } else if (result.includes('START_PENDING')) {
            console.log('⏳ Service is still starting, please wait...');
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 3000));
          } else {
            console.log('⚠️  Service status:', result.match(/STATE\s*:\s*\d+\s+([^\r\n]+)/)?.[1] || 'Unknown');
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error) {
          console.log(`⚠️  Could not check service status (attempt ${attempts + 1}/6)`);
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      if (!serviceRunning) {
        console.log('⚠️  Service may not be running properly. Check the logs for details.');
        console.log('💡 You can:');
        console.log('   • Check service status: sc query "ai-workflow-utils"');
        console.log(`   • View logs: type "${path.join(this.packageDir, 'logs', 'service.log')}"`);
        console.log('   • Try manual start: sc start "ai-workflow-utils"');
      }
    } catch (error) {
      console.log('⚠️  Service created but failed to start automatically.');
      console.log('   This is common and usually not a problem.');
      console.log('   The service will start automatically on next system boot.');
      console.log('');
      console.log('💡 To start it now, you can try:');
      console.log('   • sc start "ai-workflow-utils"');
      console.log('   • Or restart your computer to test auto-start');
      console.log('   • Check service status with: sc query "ai-workflow-utils"');
    }
  }

  async uninstallWindows() {
    // Try to stop the service first
    try {
      console.log('🛑 Stopping service...');
      execSync(`sc stop "${this.serviceName}"`, { stdio: 'pipe' });
      console.log('✅ Service stopped');
      
      // Wait a moment for the service to fully stop
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log('ℹ️  Service was not running or already stopped');
    }
    
    // Delete the service
    try {
      execSync(`sc delete "${this.serviceName}"`, { stdio: 'inherit' });
      console.log('🗑️  Windows service removed');
    } catch (error) {
      console.error('❌ Failed to remove service:', error.message);
      throw error;
    }

    // Remove service wrapper file
    const servicePath = path.join(this.packageDir, 'bin', 'windows-service.js');
    if (fs.existsSync(servicePath)) {
      try {
        fs.unlinkSync(servicePath);
        console.log('🗑️  Service wrapper file removed');
      } catch (error) {
        console.log('⚠️  Could not remove service wrapper file:', error.message);
      }
    }
  }

  createWindowsServiceWrapper(servicePath) {
    // Create the Windows service wrapper with properly escaped template literals
    const wrapperContent = `// Windows Service Wrapper for AI Workflow Utils
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Service control handler for Windows Service Manager
let serviceExiting = false;
let serverProcess = null;
let serviceStarted = false;

// Implement proper Windows service signal handling
let isWindowsService = false;

// Check if running as Windows service (no console attached)
try {
  if (process.platform === 'win32' && !process.stdout.isTTY) {
    isWindowsService = true;
  }
} catch (e) {
  isWindowsService = true;
}

// Windows service control handler
function handleServiceControl(signal) {
  if (isWindowsService) {
    switch (signal) {
      case 'SIGTERM':
      case 'SIGINT':
      case 'SIGHUP':
        gracefulShutdown();
        break;
    }
  }
}

// Handle Windows service control events
process.on('SIGINT', handleServiceControl);
process.on('SIGTERM', handleServiceControl);
process.on('SIGHUP', handleServiceControl);

// Handle Windows-specific service stop signals
if (process.platform === 'win32') {
  // For Windows services, we need to handle the console control events
  try {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
  } catch (e) {
    // Ignore errors when running as service
  }
}

function gracefulShutdown() {
  if (serviceExiting) return;
  serviceExiting = true;
  
  if (isWindowsService) {
    writeServiceLog('Service shutdown requested...');
  } else {
    console.log('Service shutdown requested...');
  }
  
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
      process.exit(0);
    }, 10000); // 10 second timeout
  } else {
    process.exit(0);
  }
}

function writeServiceLog(message) {
  const timestamp = new Date().toISOString();
  const logEntry = \`[\${timestamp}] \${message}\\n\`;
  
  try {
    const packageDir = path.dirname(__dirname);
    const logDir = path.join(packageDir, 'logs');
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, 'service.log');
    fs.appendFileSync(logFile, logEntry);
  } catch (err) {
    // Ignore logging errors when running as service
  }
}

function startServer() {
  const packageDir = path.dirname(__dirname);
  const serverPath = path.join(packageDir, 'dist', 'server.js');
  const logDir = path.join(packageDir, 'logs');
  
  // Ensure logs directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, 'service.log');
  const errorLogFile = path.join(logDir, 'service-error.log');
  
  const startupMessage = 'Starting AI Workflow Utils server...';
  const pathMessage = \`Server path: \${serverPath}\`;
  const packageMessage = \`Package directory: \${packageDir}\`;
  const logMessage = \`Log file: \${logFile}\`;
  
  if (isWindowsService) {
    writeServiceLog(startupMessage);
    writeServiceLog(pathMessage);
    writeServiceLog(packageMessage);
    writeServiceLog(logMessage);
  } else {
    console.log(startupMessage);
    console.log(pathMessage);
    console.log(packageMessage);
    console.log(logMessage);
  }
  
  // Check if server build exists
  if (!fs.existsSync(serverPath)) {
    const errorMsg = \`Server build not found at: \${serverPath}. Please ensure the package is properly built.\`;
    if (isWindowsService) {
      writeServiceLog('ERROR: ' + errorMsg);
    } else {
      console.error(errorMsg);
    }
    process.exit(1);
  }
  
  // Start the server process
  serverProcess = spawn('node', [serverPath], {
    cwd: packageDir,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: '3000'
    },
    stdio: isWindowsService ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe']
  });
  
  // Immediately signal that service has started (important for Windows SCM)
  serviceStarted = true;
  
  // Log server output
  if (serverProcess.stdout) {
    serverProcess.stdout.on('data', (data) => {
      const timestamp = new Date().toISOString();
      const logEntry = \`[\${timestamp}] \${data.toString()}\`;
      
      if (isWindowsService) {
        // For Windows service, only write to log file
        try {
          fs.appendFileSync(logFile, logEntry);
        } catch (err) {
          // Ignore file write errors in service mode
        }
      } else {
        console.log(logEntry);
        try {
          fs.appendFileSync(logFile, logEntry);
        } catch (err) {
          console.error('Failed to write to log file:', err.message);
        }
      }
    });
  }
  
  if (serverProcess.stderr) {
    serverProcess.stderr.on('data', (data) => {
      const timestamp = new Date().toISOString();
      const logEntry = \`[\${timestamp}] ERROR: \${data.toString()}\`;
      
      if (isWindowsService) {
        // For Windows service, only write to log file
        try {
          fs.appendFileSync(errorLogFile, logEntry);
        } catch (err) {
          // Ignore file write errors in service mode
        }
      } else {
        console.error(logEntry);
        try {
          fs.appendFileSync(errorLogFile, logEntry);
        } catch (err) {
          console.error('Failed to write to error log file:', err.message);
        }
      }
    });
  }
  
  serverProcess.on('error', (err) => {
    const errorMsg = \`Failed to start server process: \${err.message}\`;
    if (isWindowsService) {
      writeServiceLog('ERROR: ' + errorMsg);
    } else {
      console.error(errorMsg);
    }
    
    if (!serviceExiting) {
      process.exit(1);
    }
  });
  
  serverProcess.on('exit', (code, signal) => {
    const exitMsg = \`Server process exited with code \${code} and signal \${signal}\`;
    if (isWindowsService) {
      writeServiceLog(exitMsg);
    } else {
      console.log(exitMsg);
    }
    
    if (!serviceExiting) {
      const restartMsg = 'Server process exited unexpectedly, restarting in 5 seconds...';
      if (isWindowsService) {
        writeServiceLog(restartMsg);
      } else {
        console.log(restartMsg);
      }
      
      setTimeout(() => {
        if (!serviceExiting) {
          startServer();
        }
      }, 5000);
    } else {
      process.exit(0);
    }
  });
  
  const successMsg = 'AI Workflow Utils service started successfully';
  const pidMsg = \`PID: \${serverProcess.pid}\`;
  const webMsg = 'Web interface will be available at: http://localhost:3000';
  
  if (isWindowsService) {
    writeServiceLog(successMsg);
    writeServiceLog(pidMsg);
    writeServiceLog(webMsg);
  } else {
    console.log(successMsg);
    console.log(pidMsg);
    console.log(webMsg);
  }
}

// Start the server
if (isWindowsService) {
  writeServiceLog('AI Workflow Utils Windows Service starting...');
} else {
  console.log('AI Workflow Utils Windows Service starting...');
}

// Add timeout to ensure service responds to SCM quickly
if (isWindowsService) {
  // Start the server immediately, don't wait
  setTimeout(() => {
    startServer();
  }, 100);
  
  // Set up a watchdog to ensure the service stays responsive
  setInterval(() => {
    if (serviceStarted && !serviceExiting) {
      writeServiceLog('Service heartbeat - still running');
    }
  }, 60000); // Every minute
} else {
  startServer();
}

// Handle process exit gracefully
process.on('beforeExit', (code) => {
  if (isWindowsService) {
    writeServiceLog(\`Service process exiting with code: \${code}\`);
  }
});

process.on('exit', (code) => {
  if (isWindowsService) {
    writeServiceLog(\`Service process terminated with code: \${code}\`);
  }
});`;

    fs.writeFileSync(servicePath, wrapperContent);
    console.log(`📝 Created Windows service wrapper: ${servicePath}`);
    console.log('📊 Service logs will be written to:');
    console.log(`   • Output: ${this.packageDir}/logs/service.log`);
    console.log(`   • Errors: ${this.packageDir}/logs/service-error.log`);
  }

  async installLinux() {
    const serviceFilePath = `/etc/systemd/system/${this.serviceName}.service`;
    const nodePath = execSync('which node', { encoding: 'utf8' }).trim();
    const cliPath = path.join(this.packageDir, 'bin', 'cli.js');
    const username = os.userInfo().username;

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
      console.log('🛑 Stopping and disabling service...');
      execSync(`sudo systemctl stop ${this.serviceName}`, { stdio: 'pipe' });
      execSync(`sudo systemctl disable ${this.serviceName}`, { stdio: 'pipe' });
      console.log('✅ Service stopped and disabled');
    } catch (error) {
      console.log('ℹ️  Service was not running or not enabled:', error.message);
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
