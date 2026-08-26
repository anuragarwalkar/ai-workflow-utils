import memoryService from './MemoryService.ts';
import langChainServiceFactory from '../langchain/LangChainServiceFactory.js';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import logger from '../../logger.ts';

class DashboardLangGraphService {
  async runSummarizeGraph(rawText: string, preferredProvider: string | null = null): Promise<{ summary: string; storedId: string; status: string }> {
    try {
      const chatService = langChainServiceFactory.getChatService();
      const modelObj = preferredProvider
        ? chatService.getProviderByName(preferredProvider) || chatService.getBestChatModel()
        : chatService.getBestChatModel();

      const prompt = PromptTemplate.fromTemplate(`
You are a helpful AI assistant. Summarize the following text into 2-3 concise bullet points.
Output ONLY the bullet points.

Text to summarize:
{text}
      `);

      const chain = prompt.pipe(modelObj.model).pipe(new StringOutputParser());

      logger.info(`Generating summary for knowledge dump using provider: ${modelObj.name}...`);
      const summary = await chain.invoke({ text: rawText });

      logger.info('Storing text and summary into LanceDB memory...');
      const originalId = await memoryService.addMemory(rawText, { type: 'knowledge_dump', summary });

      return {
        summary,
        storedId: originalId,
        status: 'success',
      };
    } catch (err: any) {
      logger.error('Failed to run summarize graph:', err);
      throw err;
    }
  }

  async processNaturalLanguageTodo(text: string, preferredProvider: string | null = null): Promise<any> {
    try {
      const chatService = langChainServiceFactory.getChatService();
      const modelObj = preferredProvider
        ? chatService.getProviderByName(preferredProvider) || chatService.getBestChatModel()
        : chatService.getBestChatModel();

      const prompt = PromptTemplate.fromTemplate(`
Extract a TODO item from the following text. The current local date and time is ${new Date().toString()}.
If the user mentions relative time (e.g., "in 2 hours", "tomorrow at 3pm"), calculate the exact ISO-8601 timestamp that includes the current local timezone offset (e.g. YYYY-MM-DDTHH:mm:ss+05:30). Do not output a UTC time (Z) unless explicitly asked.

You MUST output a valid JSON object with these exact keys (do NOT output markdown blocks, just the raw JSON):
- title: (string) The main task
- priority: (string) "High", "Medium", or "Low"
- dueAt: (string or null) ISO-8601 date-time format (including timezone offset) if a specific time is mentioned, or null.
- notifyAt: (string or null) ISO-8601 date-time format for when to notify, usually a bit before due time, or exactly at due time, or null.

Text: {text}
      `);

      const chain = prompt.pipe(modelObj.model).pipe(new StringOutputParser());
      logger.info(`Processing natural language TODO using provider: ${modelObj.name}...`);
      const resultStr = await chain.invoke({ text });

      try {
        let jsonStr = resultStr.trim();
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/```/g, '').trim();
        }
        return JSON.parse(jsonStr);
      } catch {
        logger.error('Failed to parse JSON from AI TODO response:', resultStr);
        throw new Error('AI could not parse the TODO reliably.');
      }
    } catch (err: any) {
      logger.error('Error processing natural language TODO:', err);
      throw err;
    }
  }
}

export default new DashboardLangGraphService();
