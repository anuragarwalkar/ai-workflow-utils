/**
 * Legacy LangChain service - now acts as a proxy to the factory pattern
 * This maintains backward compatibility while using the new modular architecture
 */
import langChainServiceFactory from './langchain/LangChainServiceFactory.js';
import logger from "../logger.js";

/**
 * Legacy wrapper class that delegates to the appropriate specialized service
 */
class LangChainService {
  constructor() {
    this.factory = langChainServiceFactory;
  }

  // Delegate provider initialization to factory
  initializeProviders() {
    logger.info('LangChainService: Initializing providers via factory');
    this.factory.initializeProviders();
  }

  // Delegate to factory for providers info
  get providers() {
    return this.factory.getBaseService().providers;
  }

  getAvailableProviders() {
    return this.factory.getAvailableProviders();
  }

  // Delegate streaming to Jira service (most common use case)
  async streamContent(promptTemplateFormatter, images, issueType, res) {
    logger.info('LangChainService: Delegating streamContent to Jira service');
    const jiraService = this.factory.getJiraService();
    return jiraService.streamContent(promptTemplateFormatter, images, issueType, res);
  }

  // Delegate structured content to PR service (most common use case)
  async generateStructuredContent(promptTemplateFormatter, schema, templateIdentifier, streaming = false) {
    logger.info('LangChainService: Delegating generateStructuredContent to PR service');
    const prService = this.factory.getPRService();
    return prService.generateStructuredContent(promptTemplateFormatter, schema, templateIdentifier, streaming);
  }

  // Delegate general content generation to base service
  async generateContent(promptTemplateFormatter, images, promptTemplateIdentifier, streaming = false) {
    logger.info('LangChainService: Delegating generateContent to base service');
    const baseService = this.factory.getBaseService();
    return baseService.generateContent(promptTemplateFormatter, images, promptTemplateIdentifier, streaming);
  }

  // Legacy methods that delegate to base service
  modelSupportsVision(modelName) {
    return this.factory.getBaseService().modelSupportsVision(modelName);
  }

  async createPromptTemplate(issueType, hasImages) {
    return this.factory.getBaseService().createPromptTemplate(issueType, hasImages);
  }

  prepareMessageContent(prompt, images) {
    return this.factory.getBaseService().prepareMessageContent(prompt, images);
  }
}

export default new LangChainService();
