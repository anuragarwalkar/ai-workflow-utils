import memoryService from './MemoryService.js';
import langChainServiceFactory from '../langchain/LangChainServiceFactory.js';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import logger from '../../logger.js';

class DashboardLangGraphService {
  /**
   * Simple pipeline to summarize and store text chunks
   * We can use LangGraph for complex routing, but for a linear flow a simple chain or async sequence is fine.
   */
  async runSummarizeGraph(rawText) {
    try {
      // 1. Summarize the text
      const chatService = langChainServiceFactory.getChatService();
      const bestModel = chatService.getBestChatModel();
      
      const prompt = PromptTemplate.fromTemplate(`
You are a helpful AI assistant. Summarize the following text into 2-3 concise bullet points.
Output ONLY the bullet points.

Text to summarize:
{text}
      `);

      const chain = prompt.pipe(bestModel.model).pipe(new StringOutputParser());
      
      logger.info('Generating summary for knowledge dump...');
      const summary = await chain.invoke({ text: rawText });

      // 2. Store the original text and summary as memories
      logger.info('Storing text and summary into LanceDB memory...');
      const originalId = await memoryService.addMemory(rawText, { type: 'knowledge_dump', summary });
      
      return { 
        summary, 
        storedId: originalId,
        status: 'success'
      };
    } catch (err) {
      logger.error('Failed to run summarize graph:', err);
      throw err;
    }
  }

  async processNaturalLanguageTodo(text) {
    try {
      const chatService = langChainServiceFactory.getChatService();
      const bestModel = chatService.getBestChatModel();

      const prompt = PromptTemplate.fromTemplate(`
Extract a TODO item from the following text.
You MUST output a valid JSON object with these exact keys (do NOT output markdown blocks, just the raw JSON):
- title: (string) The main task
- priority: (string) "High", "Medium", or "Low"
- dueAt: (string or null) ISO-8601 date-time format if a specific time is mentioned, or null.
- notifyAt: (string or null) ISO-8601 date-time format for when to notify, usually a bit before due time, or exactly at due time, or null.

Text: {text}
      `);

      const chain = prompt.pipe(bestModel.model).pipe(new StringOutputParser());
      const resultStr = await chain.invoke({ text });
      
      try {
        let jsonStr = resultStr.trim();
        // Remove markdown json block if model ignored instructions
        if (jsonStr.startsWith('\`\`\`json')) {
            jsonStr = jsonStr.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        } else if (jsonStr.startsWith('\`\`\`')) {
            jsonStr = jsonStr.replace(/\`\`\`/g, '').trim();
        }
        return JSON.parse(jsonStr);
      } catch (e) {
        logger.error('Failed to parse JSON from AI TODO response:', resultStr);
        throw new Error('AI could not parse the TODO reliably.');
      }

    } catch (err) {
      logger.error('Error processing natural language TODO:', err);
      throw err;
    }
  }
}

export default new DashboardLangGraphService();
