#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class EnvironmentSetup {
  packageDir: string;
  configDir: string;
  serverEnvPath: string;
  configMetaPath: string;
  serverEnvExamplePath: string;
  rl: readline.Interface | null = null;
  envConfig: Record<string, any>;

  constructor() {
    let base = path.resolve(__dirname, '../../..');
    if (!fs.existsSync(path.join(base, 'package.json'))) {
      base = path.resolve(__dirname, '..');
    }
    this.packageDir = base;

    // Home directory configuration paths
    this.configDir = path.join(os.homedir(), '.ai-workflow-utils');
    this.serverEnvPath = path.join(this.configDir, 'config.env');
    this.configMetaPath = path.join(this.configDir, 'config.json');

    // Package directory paths for examples
    this.serverEnvExamplePath = path.join(this.packageDir, '.env.example');

    this.envConfig = {
      server: {
        jira: {
          required: false,
          description: 'Jira integration for creating and managing tickets',
          url: {
            description: 'Your Jira instance URL (e.g., https://your-company.atlassian.net)',
            required: true,
            envKey: 'JIRA_URL',
          },
          token: {
            description:
              'Your Jira API token (create one at: https://id.atlassian.com/manage-profile/security/api-tokens)',
            required: true,
            sensitive: true,
            envKey: 'JIRA_TOKEN',
          },
        },
        openai: {
          required: false,
          description: 'OpenAI/Anthropic compatible AI API configuration',
          baseUrl: {
            description:
              'AI API base URL (default: https://api.anthropic.com), Else - setup local AI server with ollama',
            required: false,
            default: 'https://api.anthropic.com',
            envKey: 'OPENAI_COMPATIBLE_BASE_URL',
          },
          apiKey: {
            description: 'Your AI API key (OpenAI, Anthropic, etc.)',
            required: false,
            sensitive: true,
            envKey: 'OPENAI_COMPATIBLE_API_KEY',
          },
          model: {
            description: 'AI model to use (default: claude-3-sonnet-20240229)',
            required: false,
            default: 'claude-3-sonnet-20240229',
            envKey: 'OPENAI_COMPATIBLE_MODEL',
          },
        },
        bitbucket: {
          required: false,
          description: 'Bitbucket integration for PR creation and review',
          url: {
            description:
              'Your Bitbucket server URL (optional, To create, view & review PR using AI)',
            required: false,
            envKey: 'BIT_BUCKET_URL',
          },
          token: {
            description: 'Bitbucket API token (optional)',
            required: false,
            sensitive: true,
            envKey: 'BITBUCKET_AUTHORIZATION_TOKEN',
          },
        },
        ollama: {
          required: false,
          description: 'Local Ollama AI server configuration',
          baseUrl: {
            description: 'Ollama base URL (default: http://localhost:11434)',
            required: false,
            default: 'http://localhost:11434',
            envKey: 'OLLAMA_BASE_URL',
          },
          model: {
            description: 'Ollama model (default: llava)',
            required: false,
            default: 'llava',
            envKey: 'OLLAMA_MODEL',
          },
        },
        server: {
          required: false,
          description: 'Basic server configuration',
          port: {
            description: 'Server port (default: 3000)',
            required: false,
            default: '3000',
            envKey: 'PORT',
          },
          environment: {
            description: 'Server environment (default: prod)',
            required: false,
            default: 'production',
            envKey: 'NODE_ENV',
          },
        },
      },
    };
  }

  getReadline(): readline.Interface {
    if (!this.rl) {
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
    }
    return this.rl;
  }

  async question(prompt: string): Promise<string> {
    return new Promise(resolve => {
      this.getReadline().question(prompt, resolve);
    });
  }

  close(): void {
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
  }

  async setupEnvironment(): Promise<boolean> {
    console.log('🚀 Welcome to AI Workflow Utils Setup!');
    console.log('This setup will help you configure the application for first use.\n');

    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
      console.log(`📁 Created configuration directory: ${this.configDir}`);
    }

    const serverEnvExists = fs.existsSync(this.serverEnvPath);

    if (serverEnvExists) {
      console.log('⚠️  Configuration file already exists in:');
      console.log(`   📁 ${this.configDir}`);
      console.log('   - config.env (server configuration)');

      const overwrite = await this.question('\nDo you want to reconfigure? (y/N): ');
      if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
        console.log('✅ Using existing configuration. Starting application...');
        this.close();
        return false;
      }
    }

    const existingServerEnv =
      this.loadExistingEnv(this.serverEnvPath) || this.loadExistingEnv(this.serverEnvExamplePath);

    console.log("\n📋 Let's configure your environment variables...\n");

    console.log('🖥️  Server Configuration:');
    console.log('='.repeat(50));
    const serverEnv = await this.configureEnvironment('server', existingServerEnv);

    await this.writeEnvFile(this.serverEnvPath, serverEnv);

    console.log('\n✅ Configuration complete!');
    console.log('📁 Environment file created in:');
    console.log(`   📁 ${this.configDir}`);
    console.log('   - config.env (server configuration)');
    console.log('\n💡 Configuration will persist across package upgrades!');
    console.log('\n🌐 Frontend configuration is now handled directly in the UI application.');

    this.close();
    return true;
  }

  async configureEnvironment(type: string, existingEnv: Record<string, string> = {}): Promise<Record<string, string>> {
    const config = this.envConfig[type];
    const envVars: Record<string, string> = {};

    const requiredSections = Object.entries(config).filter(
      ([_, conf]: [string, any]) => conf.required && conf.description
    );
    const optionalSections = Object.entries(config).filter(
      ([_, conf]: [string, any]) => !conf.required && conf.description
    );

    if (requiredSections.length > 0) {
      console.log('\n🔴 Required Configuration Sections:');
      for (const [sectionKey, sectionConf] of requiredSections) {
        console.log(`\n📋 ${(sectionConf as any).description}`);
        const setupSection = await this.question(`Do you want to setup ${sectionKey}? (Y/n): `);

        if (setupSection.toLowerCase() !== 'n' && setupSection.toLowerCase() !== 'no') {
          await this.configureSectionVariables(sectionKey, sectionConf, existingEnv, envVars);
        }
      }
    }

    if (optionalSections.length > 0) {
      console.log('\n🟡 Optional Configuration Sections:');
      for (const [sectionKey, sectionConf] of optionalSections) {
        console.log(`\n📋 ${(sectionConf as any).description || `${sectionKey} configuration`}`);
        const setupSection = await this.question(`Do you want to setup ${sectionKey}? (y/N): `);

        if (setupSection.toLowerCase() === 'y' || setupSection.toLowerCase() === 'yes') {
          await this.configureSectionVariables(sectionKey, sectionConf, existingEnv, envVars);
        } else {
          this.applyDefaultsForSection(sectionConf, envVars);
        }
      }
    }

    const standaloneVars = Object.entries(config).filter(
      ([_, conf]: [string, any]) => !conf.description || (!conf.required && !conf.description)
    );

    if (standaloneVars.length > 0) {
      console.log('\n⚙️  Additional Configuration:');
      for (const [key, conf] of standaloneVars) {
        if ((conf as any).envKey) {
          const value = await this.promptForVariable(key, conf, existingEnv[(conf as any).envKey]);
          if (value) envVars[(conf as any).envKey] = value;
        }
      }
    }

    return envVars;
  }

  async configureSectionVariables(sectionKey: string, sectionConf: any, existingEnv: Record<string, string>, envVars: Record<string, string>): Promise<void> {
    console.log(`\n🔧 Configuring ${sectionKey}:`);

    for (const [varKey, varConf] of Object.entries(sectionConf)) {
      if (varKey === 'required' || varKey === 'description') continue;

      if ((varConf as any).envKey) {
        const value = await this.promptForVariable(
          `${sectionKey}.${varKey}`,
          varConf,
          existingEnv[(varConf as any).envKey]
        );
        if (value) envVars[(varConf as any).envKey] = value;
      }
    }
  }

  applyDefaultsForSection(sectionConf: any, envVars: Record<string, string>): void {
    for (const [varKey, varConf] of Object.entries(sectionConf)) {
      if (varKey === 'required' || varKey === 'description') continue;

      if ((varConf as any).default && (varConf as any).envKey) {
        envVars[(varConf as any).envKey] = (varConf as any).default;
      }
    }
  }

  async promptForVariable(key: string, config: any, existingValue?: string): Promise<string> {
    const hasExisting =
      existingValue &&
      existingValue !== `your_${key.toLowerCase()}_here` &&
      !existingValue.startsWith('your-');
    const defaultValue = hasExisting ? existingValue : config.default;

    let prompt = `\n${config.description}`;
    if (defaultValue) {
      const displayValue = config.sensitive ? '*'.repeat(8) : defaultValue;
      prompt += `\n(current: ${displayValue})`;
    }
    prompt += `\n${key}: `;

    const value = await this.question(prompt);

    if (!value.trim()) {
      return defaultValue || '';
    }

    if (config.validate && !config.validate(value)) {
      console.log('❌ Invalid value. Please try again.');
      return await this.promptForVariable(key, config, existingValue);
    }

    return value.trim();
  }

  loadExistingEnv(filePath: string): Record<string, string> {
    if (!fs.existsSync(filePath)) return {};

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const env: Record<string, string> = {};

      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join('=').replace(/^["']|["']$/g, '');
          }
        }
      });

      return env;
    } catch (error: any) {
      console.warn(`Warning: Could not read ${filePath}:`, error.message);
      return {};
    }
  }

  async writeEnvFile(filePath: string, envVars: Record<string, string>): Promise<void> {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let content = '# AI Workflow Utils Configuration\n';
      content += `# Generated on ${new Date().toISOString()}\n\n`;

      Object.entries(envVars).forEach(([key, value]) => {
        content += `${key}=${value}\n`;
      });

      fs.writeFileSync(filePath, content);
      console.log(`✅ Created: ${path.relative(this.packageDir, filePath)}`);
    } catch (error: any) {
      console.error(`❌ Failed to write ${filePath}:`, error.message);
      throw error;
    }
  }

  async checkEnvironmentHealth(): Promise<boolean> {
    console.log('\n🔍 Checking configuration health...');

    const serverEnv = this.loadExistingEnv(this.serverEnvPath);
    const missingVars: string[] = [];

    for (const [sectionKey, sectionConf] of Object.entries(this.envConfig.server)) {
      if ((sectionConf as any).required && (sectionConf as any).description) {
        for (const [varKey, varConf] of Object.entries(sectionConf as any)) {
          if (varKey === 'required' || varKey === 'description') continue;

          if ((varConf as any).required && (varConf as any).envKey) {
            const envValue = serverEnv[(varConf as any).envKey];
            if (!envValue || envValue.includes('your_')) {
              missingVars.push(`${sectionKey}.${varKey} (${(varConf as any).envKey})`);
            }
          }
        }
      }
    }

    if (missingVars.length > 0) {
      console.log('⚠️  Missing required configuration:');
      missingVars.forEach(key => console.log(`   - ${key}`));
      return false;
    }

    console.log('✅ Configuration looks good!');
    return true;
  }
}

export default EnvironmentSetup;
