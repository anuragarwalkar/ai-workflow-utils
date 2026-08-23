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
  platform: NodeJS.Platform;

  constructor() {
    let base = path.resolve(__dirname, '../../..');
    if (!fs.existsSync(path.join(base, 'package.json'))) {
      base = path.resolve(__dirname, '..');
    }
    this.packageDir = base;
    const packageJsonPath = path.join(this.packageDir, 'package.json');
    this.packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    this.serviceName = 'ai-workflow-utils';
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
        case 'darwin':
          execSync(`launchctl start com.anuragarwalkar.${this.serviceName}`);
          break;
        case 'linux':
          execSync(`systemctl --user start ${this.serviceName}`);
          break;
        case 'win32':
          execSync(`net start ${this.serviceName}`);
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
          execSync(`launchctl stop com.anuragarwalkar.${this.serviceName}`);
          break;
        case 'linux':
          execSync(`systemctl --user stop ${this.serviceName}`);
          break;
        case 'win32':
          execSync(`net stop ${this.serviceName}`);
          break;
      }
      console.log('✅ Service stopped successfully!');
    } catch (error: any) {
      console.error('❌ Failed to stop service:', error.message);
      process.exit(1);
    }
  }

  async status(): Promise<void> {
    try {
      switch (this.platform) {
        case 'darwin': {
          const out = execSync(`launchctl list | grep com.anuragarwalkar.${this.serviceName} || true`).toString();
          console.log(out.trim() ? `🟢 Service is registered: ${out}` : '🔴 Service is not running/registered');
          break;
        }
        case 'linux': {
          const out = execSync(`systemctl --user status ${this.serviceName} || true`).toString();
          console.log(out);
          break;
        }
        case 'win32': {
          const out = execSync(`sc query ${this.serviceName} || true`).toString();
          console.log(out);
          break;
        }
      }
    } catch (error: any) {
      console.error('❌ Error checking status:', error.message);
    }
  }

  private async installMacOS(): Promise<void> {
    const plistDir = path.join(os.homedir(), 'Library', 'LaunchAgents');
    if (!fs.existsSync(plistDir)) {
      fs.mkdirSync(plistDir, { recursive: true });
    }
    const plistPath = path.join(plistDir, `com.anuragarwalkar.${this.serviceName}.plist`);
    const nodePath = process.execPath;
    const serverPath = path.join(this.packageDir, 'dist', 'apps', 'server', 'server.js');

    const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.anuragarwalkar.${this.serviceName}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${nodePath}</string>
        <string>${serverPath}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>${this.packageDir}</string>
</dict>
</plist>`;
    fs.writeFileSync(plistPath, plistContent);
    execSync(`launchctl load -w "${plistPath}"`);
  }

  private async uninstallMacOS(): Promise<void> {
    const plistPath = path.join(os.homedir(), 'Library', 'LaunchAgents', `com.anuragarwalkar.${this.serviceName}.plist`);
    if (fs.existsSync(plistPath)) {
      try {
        execSync(`launchctl unload "${plistPath}"`);
      } catch (_) {}
      fs.unlinkSync(plistPath);
    }
  }

  private async installLinux(): Promise<void> {
    const systemdDir = path.join(os.homedir(), '.config', 'systemd', 'user');
    if (!fs.existsSync(systemdDir)) {
      fs.mkdirSync(systemdDir, { recursive: true });
    }
    const servicePath = path.join(systemdDir, `${this.serviceName}.service`);
    const nodePath = process.execPath;
    const serverPath = path.join(this.packageDir, 'dist', 'apps', 'server', 'server.js');

    const content = `[Unit]
Description=AI Workflow Utils Service
After=network.target

[Service]
Type=simple
ExecStart=${nodePath} ${serverPath}
WorkingDirectory=${this.packageDir}
Restart=always

[Install]
WantedBy=default.target`;
    fs.writeFileSync(servicePath, content);
    execSync(`systemctl --user daemon-reload`);
    execSync(`systemctl --user enable ${this.serviceName}`);
    execSync(`systemctl --user start ${this.serviceName}`);
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
    console.log('Windows service installation requires manual or NSSM setup.');
  }

  private async uninstallWindows(): Promise<void> {
    console.log('Windows service uninstallation requires manual or NSSM removal.');
  }
}

export default StartupManager;
