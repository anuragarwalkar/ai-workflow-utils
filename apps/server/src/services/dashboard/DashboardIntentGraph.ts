import { StateGraph, START, END } from '@langchain/langgraph';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import langChainServiceFactory from '../langchain/LangChainServiceFactory.js';
import dashboardLangGraphService from './DashboardLangGraphService.ts';
import memoryService from './MemoryService.ts';
import logger from '../../logger.ts';
import todoDbService from './TodoDbService.ts';
import reminderDbService from './ReminderDbService.ts';
import noteDbService from './NoteDbService.ts';
import { RunnableSequence } from '@langchain/core/runnables';

const graphState: any = {
  input: {
    value: (_x: any, y: any) => y,
    default: () => '',
  },
  provider: {
    value: (_x: any, y: any) => y,
    default: () => null,
  },
  intent: {
    value: (_x: any, y: any) => y,
    default: () => null,
  },
  result: {
    value: (_x: any, y: any) => y,
    default: () => null,
  },
  context: {
    value: (_x: any, y: any) => y,
    default: () => [],
  },
};

const resolveChatModel = (providerName: string | null): any => {
  const chatService = langChainServiceFactory.getChatService();
  if (providerName) {
    const matched = chatService.getProviderByName(providerName);
    if (matched) return matched;
  }
  return chatService.getBestChatModel();
};

class DashboardIntentGraph {
  graph: any;

  constructor() {
    this.graph = this._buildGraph();
  }

  _buildGraph(): any {
    const builder = new StateGraph({ channels: graphState });

    // Node: Classify Intent
    builder.addNode('classifyIntent', async (state: any) => {
      logger.info('Classifying intent for:', state.input);
      const modelObj = resolveChatModel(state.provider);

      const parser = StructuredOutputParser.fromZodSchema(
        z.object({
          intent: z
            .enum(['query', 'reminder', 'todo', 'note', 'unknown'])
            .describe(
              'The intent of the user input. "query" for asking questions. "reminder" for setting a time-based reminder. "todo" for creating a task without a specific time. "note" for saving information to memory.'
            ),
        })
      );

      const prompt = PromptTemplate.fromTemplate(`
Analyze the user's input and determine their intent based on the following categories:
- query: The user is asking a question, asking for a summary, or trying to retrieve information.
- reminder: The user wants to be reminded about something at a specific time or date (e.g., "remind me to...").
- todo: The user wants to add a task to their to-do list (e.g., "I need to...", "add a todo...").
- note: The user is providing information, a dump of text, or a note to be saved for later (e.g., "save this note", "here is some info...").

If the intent is unclear, classify it as "unknown".

User Input: {input}

{format_instructions}
      `);

      const chain = RunnableSequence.from([prompt, modelObj.model, parser]);

      try {
        const result = await chain.invoke({
          input: state.input,
          format_instructions: parser.getFormatInstructions(),
        });
        logger.info(`Classified intent using ${modelObj.name}:`, result.intent);
        return { intent: result.intent };
      } catch (e) {
        logger.error('Error classifying intent:', e);
        const lowerInput = state.input.toLowerCase();
        if (lowerInput.includes('remind')) return { intent: 'reminder' };
        if (lowerInput.includes('todo') || lowerInput.includes('task')) return { intent: 'todo' };
        if (lowerInput.includes('note') || lowerInput.includes('save') || lowerInput.includes('dump'))
          return { intent: 'note' };
        return { intent: 'query' };
      }
    });

    // Node: Handle Query
    builder.addNode('handleQuery', async (state: any) => {
      logger.info('Handling query intent');

      const searchResults = await memoryService.searchMemory(state.input, 5);
      const contextDocs = searchResults.map((r: any) => r.pageContent).join('\n\n---\n\n');

      return {
        context: contextDocs,
        result: {
          type: 'query_context_ready',
          context: contextDocs,
        },
      };
    });

    // Node: Handle Reminder
    builder.addNode('handleReminder', async (state: any) => {
      logger.info('Handling reminder intent');
      const modelObj = resolveChatModel(state.provider);

      const parser = StructuredOutputParser.fromZodSchema(
        z.object({
          title: z.string().describe('The short title of the reminder'),
          description: z.string().describe('Detailed description if any, otherwise empty'),
          remindAt: z
            .string()
            .nullable()
            .describe(
              'ISO-8601 date-time string when the reminder should trigger. If no specific time mentioned, null.'
            ),
        })
      );

      const prompt = PromptTemplate.fromTemplate(`
Extract reminder details from the user's input. The current local date and time is ${new Date().toString()}.
If the user mentions relative time (e.g., "in 2 hours", "tomorrow at 3pm"), calculate the exact ISO-8601 timestamp that includes the current local timezone offset (e.g. YYYY-MM-DDTHH:mm:ss+05:30). Do not output a UTC time (Z) unless explicitly asked.

User Input: {input}

{format_instructions}
      `);

      const chain = RunnableSequence.from([prompt, modelObj.model, parser]);

      try {
        const parsedData = await chain.invoke({
          input: state.input,
          format_instructions: parser.getFormatInstructions(),
        });

        const savedReminder = await reminderDbService.addReminder(parsedData);

        return {
          result: {
            type: 'reminder_created',
            data: savedReminder,
          },
        };
      } catch (e) {
        logger.error('Error parsing reminder:', e);
        throw new Error('Failed to parse reminder details.');
      }
    });

    // Node: Handle Todo
    builder.addNode('handleTodo', async (state: any) => {
      logger.info('Handling todo intent');
      const todoData = await dashboardLangGraphService.processNaturalLanguageTodo(state.input, state.provider);
      const newTodo = await todoDbService.addTodo(todoData);

      return {
        result: {
          type: 'todo_created',
          data: newTodo,
        },
      };
    });

    // Node: Handle Note
    builder.addNode('handleNote', async (state: any) => {
      logger.info('Handling note intent');
      const summarizeResult = await dashboardLangGraphService.runSummarizeGraph(state.input, state.provider);

      const newNote = await noteDbService.addNote({
        content: state.input,
        summary: summarizeResult.summary,
        type: 'Note',
      });

      return {
        result: {
          type: 'note_created',
          data: newNote,
        },
      };
    });

    // Edges
    (builder as any).addEdge(START, 'classifyIntent');

    (builder as any).addConditionalEdges('classifyIntent', (state: any) => {
      switch (state.intent) {
        case 'query':
          return 'handleQuery';
        case 'reminder':
          return 'handleReminder';
        case 'todo':
          return 'handleTodo';
        case 'note':
          return 'handleNote';
        default:
          return 'handleQuery';
      }
    });

    (builder as any).addEdge('handleQuery', END);
    (builder as any).addEdge('handleReminder', END);
    (builder as any).addEdge('handleTodo', END);
    (builder as any).addEdge('handleNote', END);

    return builder.compile();
  }

  async processInput(input: string, provider: string | null = null): Promise<any> {
    const initialState = { input, provider, intent: null, result: null, context: [] };
    const finalState = await this.graph.invoke(initialState);
    return {
      intent: finalState.intent,
      result: finalState.result,
      context: finalState.context,
    };
  }

  async *streamInput(input: string, provider: string | null = null): AsyncGenerator<any, void, unknown> {
    const initialState = { input, provider, intent: null, result: null, context: [] };
    const stream = await this.graph.stream(initialState);
    for await (const chunk of stream) {
      yield chunk;
    }
  }
}

export default new DashboardIntentGraph();
