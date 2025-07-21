#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");

class EnvironmentSetup {
  constructor() {
    this.packageDir = path.dirname(__dirname);
    
    // Home directory configuration paths
    this.configDir = path.join(os.homedir(), ".ai-workflow-utils");
    this.serverEnvPath = path.join(this.configDir, "config.env");
    this.configMetaPath = path.join(this.configDir, "config.json");
    
    // Package directory paths for examples
    this.serverEnvExamplePath = path.join(this.packageDir, ".env.example");

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Environment variable configurations with descriptions and validation
    // UI configuration is now handled directly in the UI application
    this.envConfig = {
      server: {
        // Jira configuration
        jira: {
          required: false,
          description: "Jira integration for creating and managing tickets",
          url: {
            description:
              "Your Jira instance URL (e.g., https://your-company.atlassian.net)",
            required: true,
            envKey: "JIRA_URL",
          },
          token: {
            description:
              "Your Jira API token (create one at: https://id.atlassian.com/manage-profile/security/api-tokens)",
            required: true,
            sensitive: true,
            envKey: "JIRA_TOKEN",
          },
        },

        // AI configuration
        openai: {
          required: false,
          description: "OpenAI/Anthropic compatible AI API configuration",
          baseUrl: {
            description: "AI API base URL (default: https://api.anthropic.com), Else - setup local AI server with ollama",
            required: false,
            default: "https://api.anthropic.com",
            envKey: "OPENAI_COMPATIBLE_BASE_URL",
          },
          apiKey: {
            description: "Your AI API key (OpenAI, Anthropic, etc.)",
            required: false,
            sensitive: true,
            envKey: "OPENAI_COMPATIBLE_API_KEY",
          },
          model: {
            description: "AI model to use (default: claude-3-sonnet-20240229)",
            required: false,
            default: "claude-3-sonnet-20240229",
            envKey: "OPENAI_COMPATIBLE_MODEL",
          },
        },

        // Bitbucket configuration
        bitbucket: {
          required: false,
          description: "Bitbucket integration for PR creation and review",
          url: {
            description: "Your Bitbucket server URL (optional, To create, view & review PR using AI)",
            required: false,
            envKey: "BIT_BUCKET_URL",
          },
          token: {
            description: "Bitbucket API token (optional)",
            required: false,
            sensitive: true,
            envKey: "BITBUCKET_AUTHORIZATION_TOKEN",
          },
        },

        // Ollama configuration
        ollama: {
          required: false,
          description: "Local Ollama AI server configuration",
          baseUrl: {
            description: "Ollama base URL (default: http://localhost:11434)",
            required: false,
            default: "http://localhost:11434",
            envKey: "OLLAMA_BASE_URL",
          },
          model: {
            description: "Ollama model (default: llava)",
            required: false,
            default: "llava",
            envKey: "OLLAMA_MODEL",
          },
        },

        // Server configuration
        server: {
          required: false,
          description: "Basic server configuration",
          port: {
            description: "Server port (default: 3000)",
            required: false,
            default: "3000",
            envKey: "PORT",
          },
          environment: {
            description: "Server environment (default: prod)",
            required: false,
            default: "production",
            envKey: "NODE_ENV",
          },
        },
      },
    };
  }

  async question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  async setupEnvironment() {
    console.log("🚀 Welcome to AI Workflow Utils Setup!");
    console.log(
      "This setup will help you configure the application for first use.\n"
    );

    // Ensure config directory exists
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
      console.log(`📁 Created configuration directory: ${this.configDir}`);
    }

    // Check if .env files already exist
    const serverEnvExists = fs.existsSync(this.serverEnvPath);

    if (serverEnvExists) {
      console.log("⚠️  Configuration file already exists in:");
      console.log(`   📁 ${this.configDir}`);
      console.log("   - config.env (server configuration)");

      const overwrite = await this.question(
        "\nDo you want to reconfigure? (y/N): "
      );
      if (
        overwrite.toLowerCase() !== "y" &&
        overwrite.toLowerCase() !== "yes"
      ) {
        console.log("✅ Using existing configuration. Starting application...");
        this.rl.close();
        return false; // Don't run setup, use existing config
      }
    }

    // Load existing values from .env files or .env.example
    const existingServerEnv =
      this.loadExistingEnv(this.serverEnvPath) ||
      this.loadExistingEnv(this.serverEnvExamplePath);

    console.log("\n📋 Let's configure your environment variables...\n");

    // Setup server environment
    console.log("🖥️  Server Configuration:");
    console.log("=".repeat(50));
    const serverEnv = await this.configureEnvironment(
      "server",
      existingServerEnv
    );

    // Write environment files
    await this.writeEnvFile(this.serverEnvPath, serverEnv);

    console.log("\n✅ Configuration complete!");
    console.log("📁 Environment file created in:");
    console.log(`   📁 ${this.configDir}`);
    console.log("   - config.env (server configuration)");
    console.log("\n💡 Configuration will persist across package upgrades!");
    console.log("\n🌐 Frontend configuration is now handled directly in the UI application.");

    this.rl.close();
    return true; // Setup completed successfully
  }

  async configureEnvironment(type, existingEnv = {}) {
    const config = this.envConfig[type];
    const envVars = {};

    // Separate required and optional configuration sections
    const requiredSections = Object.entries(config).filter(
      ([_, conf]) => conf.required && conf.description
    );
    const optionalSections = Object.entries(config).filter(
      ([_, conf]) => !conf.required && conf.description
    );

    // Handle required sections first
    if (requiredSections.length > 0) {
      console.log("\n🔴 Required Configuration Sections:");
      for (const [sectionKey, sectionConf] of requiredSections) {
        console.log(`\n📋 ${sectionConf.description}`);
        const setupSection = await this.question(
          `Do you want to setup ${sectionKey}? (Y/n): `
        );
        
        if (setupSection.toLowerCase() !== "n" && setupSection.toLowerCase() !== "no") {
          await this.configureSectionVariables(sectionKey, sectionConf, existingEnv, envVars);
        }
      }
    }

    // Handle optional sections
    if (optionalSections.length > 0) {
      console.log("\n🟡 Optional Configuration Sections:");
      for (const [sectionKey, sectionConf] of optionalSections) {
        console.log(`\n📋 ${sectionConf.description || `${sectionKey} configuration`}`);
        const setupSection = await this.question(
          `Do you want to setup ${sectionKey}? (y/N): `
        );
        
        if (setupSection.toLowerCase() === "y" || setupSection.toLowerCase() === "yes") {
          await this.configureSectionVariables(sectionKey, sectionConf, existingEnv, envVars);
        } else {
          // Apply defaults for this section
          this.applyDefaultsForSection(sectionConf, envVars);
        }
      }
    }

    // Handle standalone variables (not in sections)
    const standaloneVars = Object.entries(config).filter(
      ([_, conf]) => !conf.description || (!conf.required && !conf.description)
    );

    if (standaloneVars.length > 0) {
      console.log("\n⚙️  Additional Configuration:");
      for (const [key, conf] of standaloneVars) {
        if (conf.envKey) {
          const value = await this.promptForVariable(key, conf, existingEnv[conf.envKey]);
          if (value) envVars[conf.envKey] = value;
        }
      }
    }

    return envVars;
  }

  async configureSectionVariables(sectionKey, sectionConf, existingEnv, envVars) {
    console.log(`\n🔧 Configuring ${sectionKey}:`);
    
    for (const [varKey, varConf] of Object.entries(sectionConf)) {
      // Skip meta properties
      if (varKey === 'required' || varKey === 'description') continue;
      
      if (varConf.envKey) {
        const value = await this.promptForVariable(
          `${sectionKey}.${varKey}`, 
          varConf, 
          existingEnv[varConf.envKey]
        );
        if (value) envVars[varConf.envKey] = value;
      }
    }
  }

  applyDefaultsForSection(sectionConf, envVars) {
    for (const [varKey, varConf] of Object.entries(sectionConf)) {
      // Skip meta properties
      if (varKey === 'required' || varKey === 'description') continue;
      
      if (varConf.default && varConf.envKey) {
        envVars[varConf.envKey] = varConf.default;
      }
    }
  }

  async promptForVariable(key, config, existingValue) {
    const hasExisting =
      existingValue &&
      existingValue !== `your_${key.toLowerCase()}_here` &&
      !existingValue.startsWith("your-");
    const defaultValue = hasExisting ? existingValue : config.default;

    let prompt = `\n${config.description}`;
    if (defaultValue) {
      const displayValue = config.sensitive ? "*".repeat(8) : defaultValue;
      prompt += `\n(current: ${displayValue})`;
    }
    prompt += `\n${key}: `;

    const value = await this.question(prompt);

    // If no value provided, use existing or default
    if (!value.trim()) {
      return defaultValue || "";
    }

    // Validate if validation function exists
    if (config.validate && !config.validate(value)) {
      console.log("❌ Invalid value. Please try again.");
      return await this.promptForVariable(key, config, existingValue);
    }

    return value.trim();
  }

  loadExistingEnv(filePath) {
    if (!fs.existsSync(filePath)) return {};

    try {
      const content = fs.readFileSync(filePath, "utf8");
      const env = {};

      content.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const [key, ...valueParts] = trimmed.split("=");
          if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join("=").replace(/^["']|["']$/g, "");
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
    console.log("\n🔍 Checking configuration health...");

    const serverEnv = this.loadExistingEnv(this.serverEnvPath);
    const missingVars = [];

    // Check required sections
    for (const [sectionKey, sectionConf] of Object.entries(this.envConfig.server)) {
      if (sectionConf.required && sectionConf.description) {
        // This is a required section, check all its required variables
        for (const [varKey, varConf] of Object.entries(sectionConf)) {
          if (varKey === 'required' || varKey === 'description') continue;
          
          if (varConf.required && varConf.envKey) {
            const envValue = serverEnv[varConf.envKey];
            if (!envValue || envValue.includes("your_")) {
              missingVars.push(`${sectionKey}.${varKey} (${varConf.envKey})`);
            }
          }
        }
      }
    }

    if (missingVars.length > 0) {
      console.log("⚠️  Missing required configuration:");
      missingVars.forEach((key) => console.log(`   - ${key}`));
      return false;
    }

    console.log("✅ Configuration looks good!");
    return true;
  }

  showConfigurationInfo() {
    console.log("\n📁 Configuration Information:");
    console.log("=".repeat(50));
    console.log(`Configuration directory: ${this.configDir}`);
    console.log(`Server config file: ${this.serverEnvPath}`);
    
    const serverExists = fs.existsSync(this.serverEnvPath);
    
    console.log(`\nStatus:`);
    console.log(`  Server config: ${serverExists ? '✅ Exists' : '❌ Missing'}`);
    console.log(`  UI config: Handled directly in the UI application`);
    
    if (!serverExists) {
      console.log(`\n💡 Run 'ai-workflow-setup' to create missing configuration file.`);
    }
  }
}

// Export for use in other modules
module.exports = EnvironmentSetup;

// Run setup if called directly
if (require.main === module) {
  const setup = new EnvironmentSetup();
  setup
    .setupEnvironment()
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
      console.error("❌ Setup failed:", error.message);
      process.exit(1);
    });
}
