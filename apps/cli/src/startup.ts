#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class StartupManager {
  packageDir: string;
  packageJson: any;
  serviceName: string;
  serviceLabel: string;
  platform: NodeJS.Platform;

  constructor() {
    let base = path.resolve(__dirname, '../../..');
    if (!fs.existsSync(path.join(base, 'package.json'))) {
      base = path.resolve(__dirname, '..');
    }
    if (!fs.existsSync(path.join(base, 'package.json'))) {
      base = process.cwd();
    }
    this.packageDir = base;

    const packageJsonPath = path.join(this.packageDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      this.packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    } else {
      this.packageJson = { name: 'ai-workflow-utils', version: '1.0.0' };
    }

    this.serviceName = 'ai-workflow-utils';
    this.serviceLabel = `com.anuragarwalkar.${this.serviceName}`;
    this.platform = os.platform();
  }

  async install(): Promise<void> {
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
    } catch (error: any) {
      console.error('❌ Failed to install startup service:', error.message);
      process.exit(1);
    }
  }

  async uninstall(): Promise<void> {
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
    } catch (error: any) {
      console.error('❌ Failed to remove startup service:', error.message);
      process.exit(1);
    }
  }

  async start(): Promise<void> {
    console.log('🚀 Starting AI Workflow Utils service...');
    try {
      switch (this.platform) {
        case 'darwin': {
          const plistPath = path.join(os.homedir(), 'Library', 'LaunchAgents', `${this.serviceLabel}.plist`);
          if (fs.existsSync(plistPath)) {
            try {
              execSync(`launchctl load -w "${plistPath}" 2>/dev/null || true`);
            } catch (_) {}
          }
          execSync(`launchctl start ${this.serviceLabel}`);
          break;
        }
        case 'linux':
          execSync(`systemctl --user start ${this.serviceName}`);
          break;
        case 'win32':
          execSync(`sc start ${this.serviceName}`);
          break;
      }
      console.log('✅ Service started successfully!');
    } catch (error: any) {
      console.error('❌ Failed to start service:', error.message);
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    console.log('🛑 Stopping AI Workflow Utils service...');
    try {
      switch (this.platform) {
        case 'darwin':
          execSync(`launchctl stop ${this.serviceLabel}`);
          break;
        case 'linux':
          execSync(`systemctl --user stop ${this.serviceName}`);
          break;
        case 'win32':
          execSync(`sc stop ${this.serviceName}`);
          break;
      }
      console.log('✅ Service stopped successfully!');
    } catch (error: any) {
      console.error('❌ Failed to stop service:', error.message);
      process.exit(1);
    }
  }

  async status(): Promise<void> {
    console.log('📊 Checking AI Workflow Utils service status...\n');
    try {
      switch (this.platform) {
        case 'darwin': {
          const plistPath = path.join(os.homedir(), 'Library', 'LaunchAgents', `${this.serviceLabel}.plist`);
          const isInstalled = fs.existsSync(plistPath);
          const out = execSync(`launchctl list | grep -E "${this.serviceName}|${this.serviceLabel}" || true`, { encoding: 'utf8' }).trim();

          if (out) {
            const parts = out.split(/\s+/);
            const pid = parts[0] !== '-' ? parts[0] : 'Idle / Stopped';
            const exitCode = parts[1];
            console.log(`🟢 Service Status: RUNNING / LOADED`);
            console.log(`   • Label:       ${parts[2] || this.serviceLabel}`);
            console.log(`   • Process PID: ${pid}`);
            console.log(`   • Last Exit:   ${exitCode}`);
            console.log(`   • Plist Path:  ${plistPath}`);
            console.log(`   • Output Log:  ${os.homedir()}/Library/Logs/${this.serviceName}.log`);
            console.log(`   • Error Log:   ${os.homedir()}/Library/Logs/${this.serviceName}.error.log`);
          } else if (isInstalled) {
            console.log(`🟡 Service is installed (${plistPath}) but not currently loaded in launchctl.`);
            console.log(`   Run "ai-workflow-utils startup start" to start it.`);
          } else {
            console.log(`🔴 Service is not installed.`);
            console.log(`   Run "ai-workflow-utils startup install" to register the service.`);
          }
          break;
        }
        case 'linux': {
          const out = execSync(`systemctl --user status ${this.serviceName} || true`, { encoding: 'utf8' }).toString();
          console.log(out || '🔴 Service status not available');
          break;
        }
        case 'win32': {
          const out = execSync(`sc query ${this.serviceName} || true`, { encoding: 'utf8' }).toString();
          console.log(out || '🔴 Service status not available');
          break;
        }
      }
    } catch (error: any) {
      console.error('❌ Error checking status:', error.message);
    }
  }

  private getNodePath(): string {
    let nodePath: string;
    try {
      nodePath = execSync('which node', { encoding: 'utf8' }).trim();
    } catch {
      const commonPaths = ['/usr/local/bin/node', '/opt/homebrew/bin/node', process.execPath];
      nodePath = commonPaths.find(p => fs.existsSync(p)) || process.execPath;
    }
    return nodePath;
  }

  private async installMacOS(): Promise<void> {
    const launchAgentsDir = path.join(os.homedir(), 'Library', 'LaunchAgents');
    if (!fs.existsSync(launchAgentsDir)) {
      fs.mkdirSync(launchAgentsDir, { recursive: true });
    }

    const plistPath = path.join(launchAgentsDir, `${this.serviceLabel}.plist`);
    const legacyPlistPath = path.join(launchAgentsDir, `${this.serviceName}.plist`);
    const nodePath = this.getNodePath();
    const serverPath = path.join(this.packageDir, 'dist', 'apps', 'server', 'server.js');
    const logDir = path.join(os.homedir(), 'Library', 'Logs');

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Clean up any legacy or previously loaded version
    try {
      execSync(`launchctl unload "${plistPath}" 2>/dev/null || true`);
      execSync(`launchctl unload "${legacyPlistPath}" 2>/dev/null || true`);
    } catch (_) {}

    const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${this.serviceLabel}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${nodePath}</string>
        <string>${serverPath}</string>
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
    <string>${logDir}/${this.serviceName}.log</string>
    <key>StandardErrorPath</key>
    <string>${logDir}/${this.serviceName}.error.log</string>
    <key>WorkingDirectory</key>
    <string>${this.packageDir}</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PORT</key>
        <string>3000</string>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:${path.dirname(nodePath)}</string>
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
    console.log(`🖥️  Server script: ${serverPath}`);
    console.log(`📊 Logs will be written to:`);
    console.log(`   • Output: ${logDir}/${this.serviceName}.log`);
    console.log(`   • Errors: ${logDir}/${this.serviceName}.error.log`);

    execSync(`launchctl load -w "${plistPath}"`, { stdio: 'inherit' });
    console.log('🔄 Service loaded into launchctl');
  }

  private async uninstallMacOS(): Promise<void> {
    const launchAgentsDir = path.join(os.homedir(), 'Library', 'LaunchAgents');
    const plistPath = path.join(launchAgentsDir, `${this.serviceLabel}.plist`);
    const legacyPlistPath = path.join(launchAgentsDir, `${this.serviceName}.plist`);

    let removed = false;
    for (const p of [plistPath, legacyPlistPath]) {
      if (fs.existsSync(p)) {
        try {
          execSync(`launchctl unload "${p}" 2>/dev/null || true`);
        } catch (_) {}
        try {
          fs.unlinkSync(p);
        } catch (_) {}
        removed = true;
      }
    }

    if (removed) {
      console.log('🗑️  Removed plist file and unloaded launchctl service');
    } else {
      console.log('ℹ️  Service was not installed');
    }
  }

  private async installLinux(): Promise<void> {
    const systemdDir = path.join(os.homedir(), '.config', 'systemd', 'user');
    if (!fs.existsSync(systemdDir)) {
      fs.mkdirSync(systemdDir, { recursive: true });
    }
    const servicePath = path.join(systemdDir, `${this.serviceName}.service`);
    const nodePath = this.getNodePath();
    const serverPath = path.join(this.packageDir, 'dist', 'apps', 'server', 'server.js');

    const content = `[Unit]
Description=AI Workflow Utils Service
After=network.target

[Service]
Type=simple
ExecStart=${nodePath} ${serverPath}
WorkingDirectory=${this.packageDir}
Restart=always
RestartSec=3
Environment=NODE_ENV=production
Environment=PORT=3000
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target`;

    fs.writeFileSync(servicePath, content);
    execSync(`systemctl --user daemon-reload`);
    execSync(`systemctl --user enable ${this.serviceName}`);
    execSync(`systemctl --user start ${this.serviceName}`);
    console.log(`📝 Created systemd service: ${servicePath}`);
  }

  private async uninstallLinux(): Promise<void> {
    const servicePath = path.join(os.homedir(), '.config', 'systemd', 'user', `${this.serviceName}.service`);
    try {
      execSync(`systemctl --user stop ${this.serviceName}`);
      execSync(`systemctl --user disable ${this.serviceName}`);
    } catch (_) {}
    if (fs.existsSync(servicePath)) {
      fs.unlinkSync(servicePath);
      execSync(`systemctl --user daemon-reload`);
    }
  }

  private async installWindows(): Promise<void> {
    const nodePath = process.execPath;
    const serverPath = path.join(this.packageDir, 'dist', 'apps', 'server', 'server.js');

    const createCmd = `sc create "${this.serviceName}" binPath= "\"${nodePath}\" \"${serverPath}\"" start= auto DisplayName= "AI Workflow Utils"`;
    execSync(createCmd, { stdio: 'inherit' });
    console.log('🔧 Windows service created');

    const descCmd = `sc description "${this.serviceName}" "AI Workflow Utils - Automation platform for software development workflows"`;
    execSync(descCmd, { stdio: 'inherit' });
    console.log('📝 Service description set');

    execSync(`sc start "${this.serviceName}"`, { stdio: 'inherit' });
    console.log('▶️  Service started');
  }

  private async uninstallWindows(): Promise<void> {
    try {
      execSync(`sc stop "${this.serviceName}"`, { stdio: 'pipe' });
    } catch (_) {}
    execSync(`sc delete "${this.serviceName}"`, { stdio: 'inherit' });
    console.log('🗑️  Windows service removed');
  }
}

// Standalone execution support
if (process.argv[1]?.endsWith('startup.ts') || process.argv[1]?.endsWith('startup.js')) {
  const manager = new StartupManager();
  const command = process.argv[2];

  switch (command) {
    case 'install':
      manager.install();
      break;
    case 'uninstall':
      manager.uninstall();
      break;
    case 'start':
      manager.start();
      break;
    case 'stop':
      manager.stop();
      break;
    case 'status':
      manager.status();
      break;
    default:
      console.log('🚀 AI Workflow Utils - Startup Manager');
      console.log('='.repeat(50));
      console.log('Usage: ai-workflow-utils startup <command>');
      console.log('');
      console.log('Commands:');
      console.log('  install    Install as startup service');
      console.log('  uninstall  Remove startup service');
      console.log('  start      Start the service');
      console.log('  stop       Stop the service');
      console.log('  status     Check service status');
      break;
  }
}

export default StartupManager;
