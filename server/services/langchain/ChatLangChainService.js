import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ConversationChain } from 'langchain/chains';
import { BufferMemory } from 'langchain/memory';
import { BaseLangChainService } from './BaseLangChainService.js';
import logger from '../../logger.js';
import templateDbService from '../../services/templateDbService.js';
/**
 *
 * Chat-specific LangChain service extending the base service
 * Provides advanced chat functionality with conversation memory and streaming
 * Leverages BaseLangChainService for LLM setup and provider management
 */
class ChatLangChainService extends BaseLangChainService {
  constructor() {
    super();
    this.conversationMemories = new Map(); // Store conversation memories by session ID
    this.activeChains = new Map(); // Store active conversation chains

    // Initialize providers from base class
    this.initializeProviders();
  }

  /**
   * Get template content for chat
   * @param {string} templateType - Template type (CHAT_DEV, CHAT_GENERIC, etc.)
   * @returns {Promise<string>} Template content or default prompt
   */
  async getChatTemplate(templateType = 'CHAT_GENERIC') {
    try {
      const template = await templateDbService.getActiveTemplate(templateType);

      if (template && template.content) {
        logger.info(
          `Using chat template: ${template.name} for ${templateType}`
        );
        return template.content;
      } else {
        logger.warn(`No template found for ${templateType}, using default`);
        return 'You are a helpful AI assistant for developers.';
      }
    } catch (error) {
      logger.error(`Error getting chat template for ${templateType}:`, error);
      return 'You are a helpful AI assistant for developers.';
    }
  }

  /**
   * Get the best available chat model from initialized providers
   * @returns {Object} Provider object with model and metadata
   */
  getBestChatModel() {
    if (this.providers.length === 0) {
      throw new Error(
        'No AI providers are configured. Please check your environment configuration.'
      );
    }

    // Return the highest priority provider (first in sorted array)
    return this.providers[0];
  }

  /**
   * Get a specific provider by name
   * @param {string} providerName - Name of the provider to get
   * @returns {Object|null} Provider object or null if not found
   */
  getProviderByName(providerName) {
    return (
      this.providers.find(p =>
        p.name.toLowerCase().includes(providerName.toLowerCase())
      ) || null
    );
  }

  /**
   * Create a conversation chain with memory
   * @param {string} sessionId - Unique session identifier
   * @param {Object} provider - Provider object from base class
   * @param {Object} options - Chain configuration options
   * @returns {ConversationChain} LangChain conversation chain
   */
  createConversationChain(sessionId, provider, options = {}) {
    const {
      systemPrompt = 'You are a helpful AI assistant for developers. Provide clear, concise, and accurate responses.',
      memoryKey = 'history',
      returnMessages = true,
    } = options;

    // Create or retrieve memory for this session
    let memory = this.conversationMemories.get(sessionId);
    if (!memory) {
      memory = new BufferMemory({
        memoryKey,
        returnMessages,
        humanPrefix: 'Human',
        aiPrefix: 'Assistant',
      });
      this.conversationMemories.set(sessionId, memory);
    }

    // Create prompt template with system message and conversation history
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      ['placeholder', '{history}'],
      ['human', '{input}'],
    ]);

    // Create conversation chain using the provider's model
    const chain = new ConversationChain({
      llm: provider.model,
      memory,
      prompt,
      verbose: process.env.NODE_ENV === 'development',
    });

    this.activeChains.set(sessionId, chain);
    return chain;
  }

  /**
   * Create a simple chat chain without memory (for one-off interactions)
   * @param {Object} provider - Provider object from base class
   * @param {string} systemPrompt - System prompt for the conversation
   * @returns {RunnableSequence} Simple chat chain
   */
  createSimpleChatChain(
    provider,
    systemPrompt = 'You are a helpful AI assistant for developers.'
  ) {
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      ['human', '{input}'],
    ]);

    const outputParser = new StringOutputParser();
    return prompt.pipe(provider.model).pipe(outputParser);
  }

  /**
   * Generate a chat response with conversation memory
   * @param {string} sessionId - Unique session identifier
   * @param {string} message - User message
   * @param {Object} options - Generation options
   * @param {string} options.template - Template type to use (CHAT_DEV, CHAT_GENERIC)
   * @param {string} options.systemPrompt - Override system prompt
   * @returns {Promise<Object>} Chat response with metadata
   */
  async generateChatResponse(sessionId, message, options = {}) {
    try {
      logger.info(`Generating chat response for session ${sessionId}`);

      // Get the best available provider
      const provider = this.getBestChatModel();

      // Get system prompt from template or options
      let systemPrompt = options.systemPrompt;
      if (!systemPrompt && options.template) {
        systemPrompt = await this.getChatTemplate(options.template);
      }
      if (!systemPrompt) {
        systemPrompt = await this.getChatTemplate('CHAT_GENERIC');
      }

      // Create or get conversation chain
      const chain = this.createConversationChain(sessionId, provider, {
        systemPrompt,
      });

      // Generate response
      const response = await chain.call({
        input: message,
      });

      logger.info(
        `Successfully generated chat response for session ${sessionId} using ${provider.name}`
      );

      return {
        content: response.response,
        sessionId,
        provider: provider.name,
        template: options.template || 'CHAT_GENERIC',
        timestamp: new Date().toISOString(),
        success: true,
      };
    } catch (error) {
      logger.error(
        `Chat response generation failed for session ${sessionId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Generate streaming chat response
   * @param {string} sessionId - Unique session identifier
   * @param {string} message - User message
   * @param {Function} onToken - Callback for each token
   * @param {Object} options - Generation options
   * @param {string} options.template - Template type to use (CHAT_DEV, CHAT_GENERIC)
   * @param {string} options.systemPrompt - Override system prompt
   * @returns {Promise<Object>} Final response with metadata
   */
  async generateStreamingChatResponse(
    sessionId,
    message,
    onToken,
    options = {}
  ) {
    try {
      logger.info(
        `Generating streaming chat response for session ${sessionId}`
      );

      // Get the best available provider
      const provider = this.getBestChatModel();

      // Get system prompt from template or options
      let systemPrompt = options.systemPrompt;
      if (!systemPrompt && options.template) {
        systemPrompt = await this.getChatTemplate(options.template);
      }
      if (!systemPrompt) {
        systemPrompt = await this.getChatTemplate('CHAT_GENERIC');
      }

      // For streaming, we'll use a simpler approach to handle tokens properly
      const prompt = ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', '{input}'],
      ]);

      let fullContent = '';

      // Create streaming chain
      const chain = prompt.pipe(provider.model);

      // Stream the response
      const stream = await chain.stream({
        input: message,
      });

      for await (const chunk of stream) {
        const content = chunk.content || '';
        if (content) {
          fullContent += content;
          onToken(content);
        }
      }

      // Update conversation memory manually for streaming responses
      const memory = this.conversationMemories.get(sessionId);
      if (memory) {
        await memory.chatMemory.addUserMessage(message);
        await memory.chatMemory.addAIChatMessage(fullContent);
      }

      logger.info(
        `Successfully generated streaming chat response for session ${sessionId} using ${provider.name}`
      );

      return {
        content: fullContent,
        sessionId,
        provider: provider.name,
        template: options.template || 'CHAT_GENERIC',
        timestamp: new Date().toISOString(),
        success: true,
      };
    } catch (error) {
      logger.error(
        `Streaming chat response generation failed for session ${sessionId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Clear conversation memory for a session
   * @param {string} sessionId - Session identifier to clear
   */
  clearConversationMemory(sessionId) {
    if (this.conversationMemories.has(sessionId)) {
      this.conversationMemories.delete(sessionId);
      this.activeChains.delete(sessionId);
      logger.info(`Cleared conversation memory for session: ${sessionId}`);
    }
  }

  /**
   * Get conversation history for a session
   * @param {string} sessionId - Session identifier
   * @returns {Array} Conversation history
   */
  async getConversationHistory(sessionId) {
    const memory = this.conversationMemories.get(sessionId);
    if (!memory) {
      return [];
    }

    try {
      const history = await memory.chatMemory.getMessages();
      return history.map(msg => ({
        role: msg._getType() === 'human' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: msg.timestamp || new Date().toISOString(),
      }));
    } catch (error) {
      logger.error(
        `Failed to get conversation history for session ${sessionId}:`,
        error
      );
      return [];
    }
  }

  /**
   * List active chat sessions
   * @returns {Array<string>} Array of active session IDs
   */
  getActiveSessions() {
    return Array.from(this.conversationMemories.keys());
  }

  /**
   * Get chat statistics
   * @returns {Object} Chat usage statistics
   */
  getChatStats() {
    return {
      activeSessions: this.conversationMemories.size,
      activeChains: this.activeChains.size,
      availableProviders: this.getAvailableProviders(),
      currentProvider: this.getEnvironmentConfig().ai_provider || 'openai',
    };
  }

  /**
   * Test chat functionality with a simple message
   * @param {string} testMessage - Test message to send
   * @param {string} providerName - Optional specific provider to test
   * @param {Object} options - Additional options including template
   * @returns {Promise<Object>} Test result
   */
  async testChatFunctionality(
    testMessage = 'Hello, can you help me?',
    providerName = null,
    options = {}
  ) {
    const testSessionId = `test_${Date.now()}`;

    try {
      let provider;

      if (providerName) {
        provider = this.getProviderByName(providerName);
        if (!provider) {
          throw new Error(
            `Provider '${providerName}' not found or not configured`
          );
        }
      } else {
        provider = this.getBestChatModel();
      }

      const startTime = Date.now();
      const response = await this.generateChatResponse(
        testSessionId,
        testMessage,
        options
      );
      const responseTime = Date.now() - startTime;

      // Clean up test session
      this.clearConversationMemory(testSessionId);

      return {
        success: true,
        provider: provider.name,
        template: options.template || 'CHAT_GENERIC',
        response: response.content,
        responseTime,
      };
    } catch (error) {
      this.clearConversationMemory(testSessionId);
      return {
        success: false,
        provider: providerName || 'default',
        template: options.template || 'CHAT_GENERIC',
        error: error.message,
      };
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.conversationMemories.clear();
    this.activeChains.clear();
    logger.info('ChatLangChainService cleaned up');
  }
}

export default new ChatLangChainService();
