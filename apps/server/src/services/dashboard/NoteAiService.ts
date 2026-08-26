import noteDbService, { NoteData } from './NoteDbService.ts';
import memoryService from './MemoryService.ts';
import langChainServiceFactory from '../langchain/LangChainServiceFactory.js';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import logger from '../../logger.ts';

class NoteAiService {
  getModel(): any {
    const chatService = langChainServiceFactory.getChatService();
    const bestModel = chatService.getBestChatModel();
    if (!bestModel || !bestModel.model) {
      throw new Error('No AI chat model is currently available or configured.');
    }
    return bestModel.model;
  }

  async summarizeNote(noteId: string, customPrompt = ''): Promise<{ summary: string; note: NoteData }> {
    try {
      const note = await noteDbService.getNoteById(noteId);
      const textToSummarize = `${note.title ? `Title: ${note.title}\n` : ''}${note.content || ''}`.trim();

      if (!textToSummarize) {
        throw new Error('Note content is empty. Cannot summarize.');
      }

      const model = this.getModel();
      const promptTemplate = PromptTemplate.fromTemplate(`
You are an intelligent note-taking AI assistant.
Summarize the following note into 2-3 crisp, clear sentences or concise bullet points capturing key insights, decisions, and action items.
${customPrompt ? `Special User Instruction: ${customPrompt}\n` : ''}

Note:
"""
{text}
"""

Output ONLY the summary text, without prefixes like "Summary:" or extra conversational filler.
      `);

      const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());
      const summaryResult = (await chain.invoke({ text: textToSummarize })).trim();

      const updatedNote = await noteDbService.updateNote(noteId, { summary: summaryResult });

      return {
        summary: summaryResult,
        note: updatedNote,
      };
    } catch (err: any) {
      logger.error(`Failed to summarize note ${noteId}:`, err);
      throw err;
    }
  }

  async autoTagNote(noteId: string): Promise<{ tags: string[] }> {
    try {
      const note = await noteDbService.getNoteById(noteId);
      const text = `${note.title ? `Title: ${note.title}\n` : ''}${note.content || ''}`.trim();

      if (!text) {
        return { tags: ['note'] };
      }

      const model = this.getModel();
      const promptTemplate = PromptTemplate.fromTemplate(`
Analyze the following note and extract 3 to 6 concise, relevant topic tags (lowercase, hyphenated if multiple words, no '#' symbol).
Existing tags on the note: {existingTags}

Note:
"""
{text}
"""

Return a valid JSON array of strings ONLY. Example: ["meeting", "sprint-planning", "jira", "frontend"].
Do not output markdown codeblocks, just the JSON array.
      `);

      const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());
      const rawResult = await chain.invoke({
        text,
        existingTags: JSON.stringify(note.tags || []),
      });

      let tags: any[] = [];
      try {
        let cleaned = rawResult.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
        else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/```/g, '').trim();
        tags = JSON.parse(cleaned);
      } catch {
        logger.warn('Failed to parse auto-tag JSON output, fallback to regex:', rawResult);
        tags = (rawResult.match(/[a-zA-Z0-9_-]+/g) || []).slice(0, 5);
      }

      const sanitizedTags = Array.from(
        new Set(
          tags
            .map((t: any) => String(t).toLowerCase().replace(/[^a-z0-9_-]/g, '').trim())
            .filter(Boolean)
        )
      ).slice(0, 6) as string[];

      return { tags: sanitizedTags };
    } catch (err: any) {
      logger.error(`Failed to auto-tag note ${noteId}:`, err);
      throw err;
    }
  }

  async expandNote(noteId: string, instruction = 'Elaborate with more details, action items, and technical context.'): Promise<{ expandedHtml: string; noteId: string }> {
    try {
      const note = await noteDbService.getNoteById(noteId);
      const model = this.getModel();

      const promptTemplate = PromptTemplate.fromTemplate(`
You are an expert technical writer and AI assistant.
Expand and enhance the following note according to this instruction:
"{instruction}"

Current Note:
Title: {title}
Content:
"""
{content}
"""

Guidelines:
1. Provide a comprehensive, well-structured response.
2. Format output in clean HTML (using tags like <h2>, <h3>, <p>, <ul>, <li>, <ol>, <strong>, <em>, <code>, <blockquote>).
3. Do not include <html>, <head>, or <body> tags. Output only the content HTML.
4. Keep what was already valuable in the original note, and add depth, structured sections, and clear takeaways.
      `);

      const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());
      let expandedHtml = await chain.invoke({
        instruction: instruction || 'Elaborate with more details and structured sections.',
        title: note.title || 'Untitled Note',
        content: note.content || note.richContent || '',
      });

      expandedHtml = expandedHtml.replace(/```html/gi, '').replace(/```/gi, '').trim();

      return {
        expandedHtml,
        noteId,
      };
    } catch (err: any) {
      logger.error(`Failed to expand note ${noteId}:`, err);
      throw err;
    }
  }

  async generateFromPrompt(userPrompt: string, autoSave = false): Promise<any> {
    try {
      const model = this.getModel();
      const promptTemplate = PromptTemplate.fromTemplate(`
You are an expert AI productivity assistant.
The user wants to generate a well-structured note based on this prompt:
"{prompt}"

Respond with a JSON object containing:
1. "title": A concise, descriptive title for the note.
2. "tags": An array of 3-5 relevant lowercase tags (strings).
3. "summary": A 1-2 sentence executive summary.
4. "richContent": Clean HTML formatted note content (using <h2>, <h3>, <p>, <ul>, <li>, <strong>, <code>, <blockquote>, <hr>). Do not include <html>/<body> wrappers.

Return ONLY the raw JSON object, without markdown code fences or conversational text.
      `);

      const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());
      const rawResult = await chain.invoke({ prompt: userPrompt });

      let parsed: any;
      try {
        let cleaned = rawResult.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
        else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch {
        logger.error('Failed to parse generated note JSON:', rawResult);
        throw new Error('AI was unable to format the generated note properly.');
      }

      const generatedData = {
        title: parsed.title || 'AI Generated Note',
        richContent: parsed.richContent || `<p>${userPrompt}</p>`,
        tags: Array.isArray(parsed.tags) ? parsed.tags : ['ai-generated'],
        summary: parsed.summary || '',
        contentType: 'rich',
      };

      if (autoSave) {
        const savedNote = await noteDbService.addNote(generatedData);
        return { note: savedNote };
      }

      return { generated: generatedData };
    } catch (err: any) {
      logger.error('Failed to generate note from prompt:', err);
      throw err;
    }
  }

  async suggestRelated(noteId: string, limit = 5): Promise<any[]> {
    try {
      const currentNote = await noteDbService.getNoteById(noteId);
      const queryText = `${currentNote.title ? `${currentNote.title}: ` : ''}${currentNote.content || ''}`.trim();

      if (!queryText) {
        return [];
      }

      const rawResults = await memoryService.searchMemory(queryText, limit + 3);
      const allNotes = await noteDbService.getNotes();
      const noteMap = new Map(allNotes.map(n => [n.id, n]));

      const related: any[] = [];
      for (const res of rawResults) {
        const sourceId = res.metadata?.sourceId || res.metadata?.id;
        if (sourceId && sourceId !== noteId) {
          const dbNote = noteMap.get(sourceId);
          if (dbNote && !related.some(r => r.id === dbNote.id)) {
            related.push({
              id: dbNote.id,
              title: dbNote.title || 'Untitled Note',
              contentSnippet: (dbNote.content || '').slice(0, 140),
              tags: dbNote.tags || [],
              updatedAt: dbNote.updatedAt || dbNote.createdAt,
              summary: dbNote.summary || '',
            });
          }
        }
        if (related.length >= limit) break;
      }

      return related;
    } catch (err: any) {
      logger.error(`Failed to find related notes for ${noteId}:`, err);
      return [];
    }
  }

  async improveWriting(text: string, mode = 'improve'): Promise<any> {
    try {
      if (!text || !text.trim()) {
        throw new Error('Text to improve cannot be empty');
      }

      const instructions: Record<string, string> = {
        improve: 'Enhance clarity, vocabulary, sentence flow, and readability while preserving meaning.',
        concise: 'Make this text significantly more concise, direct, and impactful. Eliminate fluff and redundant words.',
        fix_grammar: 'Correct all spelling, grammar, punctuation, and capitalization errors without altering the tone.',
        professional: 'Rewrite this in a polished, executive, professional workplace tone.',
        bulletize: 'Convert the main points, arguments, or steps into structured, readable bullet points.',
        action_items: 'Extract or transform this text into clear, actionable next steps and todo items.',
      };

      const instruction = instructions[mode] || instructions.improve;
      const model = this.getModel();

      const promptTemplate = PromptTemplate.fromTemplate(`
You are an elite copywriter and AI editor.
Task: ${instruction}

Input Text:
"""
{text}
"""

Output ONLY the improved text. Do not wrap in quotes or add conversational introductory/closing text.
      `);

      const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());
      const improvedText = (await chain.invoke({ text })).trim();

      return {
        originalText: text,
        improvedText,
        mode,
      };
    } catch (err: any) {
      logger.error('Failed to improve writing:', err);
      throw err;
    }
  }
}

export default new NoteAiService();
