#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class EnvironmentSetup {
  constructor() {
    this.packageDir = path.dirname(__dirname);
    this.serverEnvPath = path.join(this.packageDir, '.env');
    this.uiEnvPath = path.join(this.packageDir, 'ui', '.env');
    this.serverEnvExamplePath = path.join(this.packageDir, '.env.example');
    this.uiEnvExamplePath = path.join(this.packageDir, 'ui', '.env.example');
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Environment variable configurations with descriptions and validation
    this.envConfig = {
      server: {
        // Required configurations
        JIRA_URL: {
          description: 'Your Jira instance URL (e.g., https://your-company.atlassian.net)',
          required: true
        },
        JIRA_TOKEN: {
          description: 'Your Jira API token (create one at: https://id.atlassian.com/manage-profile/security/api-tokens)',
          required: true,
          sensitive: true
        },
        WIKI_URL: {
          description: 'Your Atlassian Wiki URL (e.g., https://your-company.atlassian.net/wiki)',
          required: true
        },
        WIKI_BASIC_AUTH: {
          description: 'Your Wiki basic authentication token',
          required: true,
          sensitive: true
        },
        
        // Optional but recommended
        OPENAI_COMPATIBLE_API_KEY: {
          description: 'Your AI API key (OpenAI, Anthropic, etc.)',
          required: false,
          sensitive: true
        },
        OPENAI_COMPATIBLE_BASE_URL: {
          description: 'AI API base URL (default: https://api.anthropic.com)',
          required: false,
          default: 'https://api.anthropic.com'
        },
        OPENAI_COMPATIBLE_MODEL: {
          description: 'AI model to use (default: claude-3-sonnet-20240229)',
          required: false,
          default: 'claude-3-sonnet-20240229'
        },
        
        // Optional configurations
        BITBUCKET_AUTHORIZATION_TOKEN: {
          description: 'Bitbucket API token (optional, for PR creation)',
          required: false,
          sensitive: true
        },
        BIT_BUCKET_URL: {
          description: 'Your Bitbucket server URL (optional)',
          required: false
        },
        EMAIL_USER: {
          description: 'Email address for notifications (optional)',
          required: false
        },
        EMAIL_PASS: {
          description: 'Email app password (optional)',
          required: false,
          sensitive: true
        },
        
        // System configurations with defaults
        PORT: {
          description: 'Server port (default: 3000)',
          required: false,
          default: '3000'
        },
        NODE_ENV: {
          description: 'Node environment (default: production)',
          required: false,
          default: 'production'
        }
      },
      ui: {
        VITE_API_BASE_URL: {
          description: 'API base URL for the frontend (default: http://localhost:3000)',
          required: false,
          default: 'http://localhost:3000'
        },
        VITE_PR_CREATION_REPO_KEY: {
          description: 'Repository key for PR creation (optional)',
          required: false
        },
        VITE_PR_CREATION_REPO_SLUG: {
          description: 'Repository slug for PR creation (optional)',
          required: false
        },
        VITE_GIT_REPOS: {
          description: 'Comma-separated list of Git repositories (optional)',
          required: false
        }
      }
    };
  }

  async question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  async setupEnvironment() {
    console.log('🚀 Welcome to AI Workflow Utils Setup!');
    console.log('This setup will help you configure the application for first use.\n');

    // Check if .env files already exist
    const serverEnvExists = fs.existsSync(this.serverEnvPath);
    const uiEnvExists = fs.existsSync(this.uiEnvPath);

    if (serverEnvExists || uiEnvExists) {
      console.log('⚠️  Environment files already exist:');
      if (serverEnvExists) console.log('   - .env (server configuration)');
      if (uiEnvExists) console.log('   - ui/.env (frontend configuration)');
      
      const overwrite = await this.question('\nDo you want to reconfigure? (y/N): ');
      if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
        console.log('✅ Using existing configuration. Starting application...');
        this.rl.close();
        return false; // Don't run setup, use existing config
      }
    }

    // Load existing values from .env files or .env.example
    const existingServerEnv = this.loadExistingEnv(this.serverEnvPath) || this.loadExistingEnv(this.serverEnvExamplePath);
    const existingUiEnv = this.loadExistingEnv(this.uiEnvPath) || this.loadExistingEnv(this.uiEnvExamplePath);

    console.log('\n📋 Let\'s configure your environment variables...\n');

    // Setup server environment
    console.log('🖥️  Server Configuration:');
    console.log('=' .repeat(50));
    const serverEnv = await this.configureEnvironment('server', existingServerEnv);

    console.log('\n🌐 Frontend Configuration:');
    console.log('=' .repeat(50));
    const uiEnv = await this.configureEnvironment('ui', existingUiEnv);

    // Write environment files
    await this.writeEnvFile(this.serverEnvPath, serverEnv);
    await this.writeEnvFile(this.uiEnvPath, uiEnv);

    console.log('\n✅ Configuration complete!');
    console.log('📁 Environment files created:');
    console.log('   - .env (server configuration)');
    console.log('   - ui/.env (frontend configuration)');
    
    this.rl.close();
    return true; // Setup completed successfully
  }

  async configureEnvironment(type, existingEnv = {}) {
    const config = this.envConfig[type];
    const envVars = {};

    // First, handle required variables
    const requiredVars = Object.entries(config).filter(([_, conf]) => conf.required);
    const optionalVars = Object.entries(config).filter(([_, conf]) => !conf.required);

    if (requiredVars.length > 0) {
      console.log('\n🔴 Required Configuration:');
      for (const [key, conf] of requiredVars) {
        const value = await this.promptForVariable(key, conf, existingEnv[key]);
        if (value) envVars[key] = value;
      }
    }

    if (optionalVars.length > 0) {
      console.log('\n🟡 Optional Configuration:');
      const configureOptional = await this.question('Configure optional settings? (y/N): ');
      
      if (configureOptional.toLowerCase() === 'y' || configureOptional.toLowerCase() === 'yes') {
        for (const [key, conf] of optionalVars) {
          const value = await this.promptForVariable(key, conf, existingEnv[key]);
          if (value) envVars[key] = value;
        }
      } else {
        // Use defaults for optional variables
        for (const [key, conf] of optionalVars) {
          if (conf.default) {
            envVars[key] = conf.default;
          }
        }
      }
    }

    return envVars;
  }

  async promptForVariable(key, config, existingValue) {
    const hasExisting = existingValue && existingValue !== `your_${key.toLowerCase()}_here` && !existingValue.startsWith('your-');
    const defaultValue = hasExisting ? existingValue : config.default;
    
    let prompt = `\n${config.description}`;
    if (defaultValue) {
      const displayValue = config.sensitive ? '*'.repeat(8) : defaultValue;
      prompt += `\n(current: ${displayValue})`;
    }
    prompt += `\n${key}: `;

    const value = await this.question(prompt);
    
    // If no value provided, use existing or default
    if (!value.trim()) {
      return defaultValue || '';
    }

    // Validate if validation function exists
    if (config.validate && !config.validate(value)) {
      console.log('❌ Invalid value. Please try again.');
      return await this.promptForVariable(key, config, existingValue);
    }

    return value.trim();
  }

  loadExistingEnv(filePath) {
    if (!fs.existsSync(filePath)) return {};
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const env = {};
      
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
    } catch (error) {
      console.warn(`Warning: Could not read ${filePath}:`, error.message);
      return {};
    }
  }

  async writeEnvFile(filePath, envVars) {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Generate content with comments
      let content = `# AI Workflow Utils Configuration\n`;
      content += `# Generated on ${new Date().toISOString()}\n\n`;

      Object.entries(envVars).forEach(([key, value]) => {
        content += `${key}=${value}\n`;
      });

      fs.writeFileSync(filePath, content);
      console.log(`✅ Created: ${path.relative(this.packageDir, filePath)}`);
    } catch (error) {
      console.error(`❌ Failed to write ${filePath}:`, error.message);
      throw error;
    }
  }

  async checkEnvironmentHealth() {
    console.log('\n🔍 Checking configuration health...');
    
    const serverEnv = this.loadExistingEnv(this.serverEnvPath);
    const requiredServerVars = Object.entries(this.envConfig.server)
      .filter(([_, conf]) => conf.required)
      .map(([key]) => key);

    const missingVars = requiredServerVars.filter(key => !serverEnv[key] || serverEnv[key].includes('your_'));
    
    if (missingVars.length > 0) {
      console.log('⚠️  Missing required configuration:');
      missingVars.forEach(key => console.log(`   - ${key}`));
      return false;
    }

    console.log('✅ Configuration looks good!');
    return true;
  }
}

// Export for use in other modules
module.exports = EnvironmentSetup;

// Run setup if called directly
if (require.main === module) {
  const setup = new EnvironmentSetup();
  setup.setupEnvironment()
    .then((completed) => {
      if (completed) {
        return setup.checkEnvironmentHealth();
      }
      return true;
    })
    .then((healthy) => {
      process.exit(healthy ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    });
}
