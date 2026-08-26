/* eslint-disable max-statements */
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ConversationChain } from '@langchain/classic/chains';
import { BufferMemory } from '@langchain/classic/memory';
import { BaseLangChainService, AIProvider } from './BaseLangChainService.ts';
import logger from '../../logger.ts';
import templateDbService from '../templateDbService.ts';

class ChatLangChainService extends BaseLangChainService {
  conversationMemories: Map<string, any>;
  activeChains: Map<string, any>;

  constructor() {
    super();
    this.conversationMemories = new Map();
    this.activeChains = new Map();
  }

  async getChatTemplate(templateType = 'CHAT_GENERIC'): Promise<string> {
    try {
      const template = await templateDbService.getActiveTemplate(templateType);

      if (template && template.content) {
        logger.info(`Using chat template: ${template.name} for ${templateType}`);
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

  getBestChatModel(): AIProvider {
    if (this.providers.length === 0) {
      throw new Error(
        'No AI providers are configured. Please check your environment configuration.'
      );
    }

    return this.providers[0];
  }

  getProviderByName(providerName: string): AIProvider | null {
    return (
      this.providers.find(p => p.name.toLowerCase().includes(providerName.toLowerCase())) || null
    );
  }

  createConversationChain(
    sessionId: string,
    provider: AIProvider,
    options: { systemPrompt?: string; memoryKey?: string; returnMessages?: boolean } = {}
  ): any {
    const {
      systemPrompt = 'You are a helpful AI assistant for developers. Provide clear, concise, and accurate responses.',
      memoryKey = 'history',
      returnMessages = true,
    } = options;

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

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      ['placeholder', '{history}'],
      ['human', '{input}'],
    ]);

    const chain = new ConversationChain({
      llm: provider.model,
      memory,
      prompt,
      verbose: process.env.NODE_ENV === 'development',
    });

    this.activeChains.set(sessionId, chain);
    return chain;
  }

  createSimpleChatChain(
    provider: AIProvider,
    systemPrompt = 'You are a helpful AI assistant for developers.'
  ): any {
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      ['human', '{input}'],
    ]);

    const outputParser = new StringOutputParser();
    return prompt.pipe(provider.model).pipe(outputParser);
  }

  async generateChatResponse(
    sessionId: string,
    message: string,
    options: { template?: string; systemPrompt?: string } = {}
  ): Promise<any> {
    try {
      logger.info(`Generating chat response for session ${sessionId}`);

      const provider = this.getBestChatModel();

      let { systemPrompt } = options;
      if (!systemPrompt && options.template) {
        systemPrompt = await this.getChatTemplate(options.template);
      }
      if (!systemPrompt) {
        systemPrompt = await this.getChatTemplate('CHAT_GENERIC');
      }

      const chain = this.createConversationChain(sessionId, provider, {
        systemPrompt,
      });

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
    } catch (error: any) {
      logger.error(`Chat response generation failed for session ${sessionId}:`, error);
      throw error;
    }
  }

  async generateStreamingChatResponse(
    sessionId: string,
    message: string,
    onToken: (token: string) => void,
    options: { template?: string; systemPrompt?: string } = {}
  ): Promise<any> {
    try {
      logger.info(`Generating streaming chat response for session ${sessionId}`);

      const provider = this.getBestChatModel();

      let { systemPrompt } = options;
      if (!systemPrompt && options.template) {
        systemPrompt = await this.getChatTemplate(options.template);
      }
      if (!systemPrompt) {
        systemPrompt = await this.getChatTemplate('CHAT_GENERIC');
      }

      const prompt = ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', '{input}'],
      ]);

      let fullContent = '';
      const chain = prompt.pipe(provider.model);

      const stream = await chain.stream({
        input: message,
      });

      for await (const chunk of stream) {
        const content = (chunk as any).content || '';
        if (content) {
          fullContent += content;
          onToken(content);
        }
      }

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
    } catch (error: any) {
      logger.error(`Streaming chat response generation failed for session ${sessionId}:`, error);
      throw error;
    }
  }

  clearConversationMemory(sessionId: string): void {
    if (this.conversationMemories.has(sessionId)) {
      this.conversationMemories.delete(sessionId);
      this.activeChains.delete(sessionId);
      logger.info(`Cleared conversation memory for session: ${sessionId}`);
    }
  }

  async getConversationHistory(sessionId: string): Promise<any[]> {
    const memory = this.conversationMemories.get(sessionId);
    if (!memory) {
      return [];
    }

    try {
      const history = await memory.chatMemory.getMessages();
      return history.map((msg: any) => ({
        role: msg._getType() === 'human' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: msg.timestamp || new Date().toISOString(),
      }));
    } catch (error) {
      logger.error(`Failed to get conversation history for session ${sessionId}:`, error);
      return [];
    }
  }

  getActiveSessions(): string[] {
    return Array.from(this.conversationMemories.keys());
  }

  getChatStats(): any {
    return {
      activeSessions: this.conversationMemories.size,
      activeChains: this.activeChains.size,
      availableProviders: this.getAvailableProviders(),
    };
  }

  async testChatFunctionality(
    testMessage = 'Hello, can you help me?',
    providerName: string | null = null,
    options: Record<string, any> = {}
  ): Promise<any> {
    const testSessionId = `test_${Date.now()}`;

    try {
      let provider: AIProvider;

      if (providerName) {
        const found = this.getProviderByName(providerName);
        if (!found) {
          throw new Error(`Provider '${providerName}' not found or not configured`);
        }
        provider = found;
      } else {
        provider = this.getBestChatModel();
      }

      const startTime = Date.now();
      const response = await this.generateChatResponse(testSessionId, testMessage, options);
      const responseTime = Date.now() - startTime;

      this.clearConversationMemory(testSessionId);

      return {
        success: true,
        provider: provider.name,
        template: options.template || 'CHAT_GENERIC',
        response: response.content,
        responseTime,
      };
    } catch (error: any) {
      this.clearConversationMemory(testSessionId);
      return {
        success: false,
        provider: providerName || 'default',
        template: options.template || 'CHAT_GENERIC',
        error: error.message,
      };
    }
  }

  override async cleanup(): Promise<void> {
    this.conversationMemories.clear();
    this.activeChains.clear();
    await super.cleanup();
    logger.info('ChatLangChainService cleaned up');
  }
}

export default new ChatLangChainService();
