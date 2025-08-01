import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import os from "os";
import path from "path";
import fs from "fs";
import logger from "../logger.js";

class TemplateDbService {
  constructor() {

    // Store in user's home directory like .env
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, ".ai-workflow-utils");
    const dbPath = path.join(configDir, "templates.json");

    // Ensure directory exists
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
      logger.info(`Created config directory: ${configDir}`);
    }

    this.adapter = new JSONFile(dbPath);
    this.db = new Low(this.adapter, {});
    logger.info(`Template database initialized at: ${dbPath}`);
  }

  async loadDefaultTemplates() {
    try {
      const defaultTemplatesPath = path.join(
        process.cwd(),
        "./data/defaultTemplates.json"
      );
      const defaultTemplatesData = JSON.parse(
        fs.readFileSync(defaultTemplatesPath, "utf8")
      );

      // Add timestamps to templates
      const templatesWithTimestamps = defaultTemplatesData.templates.map(
        (template) => ({
          ...template,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      );

      return {
        templates: templatesWithTimestamps,
        settings: {
          ...defaultTemplatesData.settings,
          lastUpdated: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error("Failed to load default templates from file:", error);
      // Fallback to minimal default
      return {
        templates: [],
        settings: {
          version: "1.0.0",
          lastUpdated: new Date().toISOString(),
          activeTemplates: {},
        },
      };
    }
  }

  async init() {
    try {
      await this.db.read();

      // If database is empty or doesn't exist, initialize with defaults
      if (!this.db.data || !this.db.data.templates) {
        const defaultData = await this.loadDefaultTemplates();
        this.db.data = defaultData;
        await this.db.write();
        logger.info(
          "Template database initialized with default templates from file"
        );
      }

      return true;
    } catch (error) {
      logger.error("Failed to initialize template database:", error);
      throw error;
    }
  }

  async getAllTemplates() {
    try {
      await this.db.read();
      return this.db.data.templates || [];
    } catch (error) {
      logger.error("Failed to get templates:", error);
      throw error;
    }
  }

  async getTemplatesByType(issueType) {
    try {
      await this.db.read();
      return this.db.data.templates.filter(
        (t) => t.issueType === issueType || t.issueType === "All"
      );
    } catch (error) {
      logger.error("Failed to get templates by type:", error);
      throw error;
    }
  }

  async getActiveTemplate(issueType) {
    try {
      await this.db.read();
      const activeTemplateId = this.db.data.settings.activeTemplates[issueType];
      if (activeTemplateId) {
        return this.db.data.templates.find((t) => t.id === activeTemplateId);
      }

      // Fallback to first template of that type
      return this.db.data.templates.find(
        (t) => t.issueType === issueType && t.isActive
      );
    } catch (error) {
      logger.error("Failed to get active template:", error);
      throw error;
    }
  }

  async createTemplate(template) {
    try {
      await this.db.read();

      const newTemplate = {
        id: `template-${Date.now()}`,
        name: template.name,
        issueType: template.issueType,
        content: template.content,
        variables: this.extractVariables(template.content),
        isDefault: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.db.data.templates.push(newTemplate);
      await this.db.write();

      logger.info(`Created new template: ${newTemplate.name}`);
      return newTemplate;
    } catch (error) {
      logger.error("Failed to create template:", error);
      throw error;
    }
  }

  async updateTemplate(id, updates) {
    try {
      await this.db.read();

      const index = this.db.data.templates.findIndex((t) => t.id === id);
      if (index === -1) {
        throw new Error(`Template with id ${id} not found`);
      }

      this.db.data.templates[index] = {
        ...this.db.data.templates[index],
        ...updates,
        variables: updates.content
          ? this.extractVariables(updates.content)
          : this.db.data.templates[index].variables,
        updatedAt: new Date().toISOString(),
      };

      await this.db.write();

      logger.info(`Updated template: ${id}`);
      return this.db.data.templates[index];
    } catch (error) {
      logger.error("Failed to update template:", error);
      throw error;
    }
  }

  async deleteTemplate(id) {
    try {
      await this.db.read();

      const index = this.db.data.templates.findIndex((t) => t.id === id);
      if (index === -1) {
        throw new Error(`Template with id ${id} not found`);
      }

      const template = this.db.data.templates[index];

      // If this was the active template, switch to another template of the same type
      const issueType = template.issueType;
      if (this.db.data.settings.activeTemplates[issueType] === id) {
        const alternativeTemplate = this.db.data.templates.find(
          (t) => t.issueType === issueType && t.id !== id
        );
        if (alternativeTemplate) {
          this.db.data.settings.activeTemplates[issueType] =
            alternativeTemplate.id;
        } else {
          // Remove the active template mapping if no alternatives exist
          delete this.db.data.settings.activeTemplates[issueType];
        }
      }

      const deleted = this.db.data.templates.splice(index, 1)[0];
      await this.db.write();

      logger.info(`Deleted template: ${id}`);
      return deleted;
    } catch (error) {
      logger.error("Failed to delete template:", error);
      throw error;
    }
  }

  async setActiveTemplate(issueType, templateId) {
    try {
      await this.db.read();

      const template = this.db.data.templates.find((t) => t.id === templateId);
      if (!template) {
        throw new Error(`Template with id ${templateId} not found`);
      }

      if (template.issueType !== issueType && template.issueType !== "All") {
        throw new Error(
          `Template ${templateId} is not compatible with issue type ${issueType}`
        );
      }

      this.db.data.settings.activeTemplates[issueType] = templateId;
      this.db.data.settings.lastUpdated = new Date().toISOString();

      await this.db.write();

      logger.info(`Set active template for ${issueType}: ${templateId}`);
      return template;
    } catch (error) {
      logger.error("Failed to set active template:", error);
      throw error;
    }
  }

  async getSettings() {
    try {
      await this.db.read();
      return this.db.data.settings;
    } catch (error) {
      logger.error("Failed to get settings:", error);
      throw error;
    }
  }

  async updateSettings(updates) {
    try {
      await this.db.read();

      this.db.data.settings = {
        ...this.db.data.settings,
        ...updates,
        lastUpdated: new Date().toISOString(),
      };

      await this.db.write();

      logger.info("Updated settings");
      return this.db.data.settings;
    } catch (error) {
      logger.error("Failed to update settings:", error);
      throw error;
    }
  }

  async resetToDefaults() {
    try {
      // Keep user templates but reset settings and ensure defaults exist
      await this.db.read();

      const userTemplates = this.db.data.templates.filter((t) => !t.isDefault);
      const defaultData = await this.loadDefaultTemplates();

      this.db.data = {
        ...defaultData,
        templates: [...defaultData.templates, ...userTemplates],
      };

      await this.db.write();

      logger.info("Reset templates to defaults from file");
      return this.db.data;
    } catch (error) {
      logger.error("Failed to reset to defaults:", error);
      throw error;
    }
  }

  extractVariables(content) {
    const variableRegex = /\{([^}]+)\}/g;
    const variables = [];
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }

  async exportTemplates() {
    try {
      await this.db.read();
      return {
        templates: this.db.data.templates.filter((t) => !t.isDefault),
        exportedAt: new Date().toISOString(),
        version: this.db.data.settings.version,
      };
    } catch (error) {
      logger.error("Failed to export templates:", error);
      throw error;
    }
  }

  async importTemplates(importData) {
    try {
      await this.db.read();

      if (!importData.templates || !Array.isArray(importData.templates)) {
        throw new Error("Invalid import data format");
      }

      const importedTemplates = importData.templates.map((template) => ({
        ...template,
        id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        variables: this.extractVariables(template.content),
      }));

      this.db.data.templates.push(...importedTemplates);
      await this.db.write();

      logger.info(`Imported ${importedTemplates.length} templates`);
      return importedTemplates;
    } catch (error) {
      logger.error("Failed to import templates:", error);
      throw error;
    }
  }
}

export default new TemplateDbService();
