import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../logger.js';
import memoryService from './MemoryService.js';

export function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/div>|<\/p>|<\/li>|<\/h[1-6]>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

class NoteDbService {
  constructor() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.ai-workflow-utils');
    const dbPath = path.join(configDir, 'notes.json');

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    this.adapter = new JSONFile(dbPath);
    this.db = new Low(this.adapter, { notes: [] });
    this.reindexPromise = null;
  }

  async init() {
    await this.db.read();
    if (!this.db.data) {
      this.db.data = { notes: [] };
      await this.db.write();
    }
  }

  async getNotes() {
    await this.init();
    // Return sorted: pinned first, then newest updated/created
    return [...(this.db.data.notes || [])].sort((a, b) => {
      if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
        return a.isPinned ? -1 : 1;
      }
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      return timeB - timeA;
    });
  }

  async getNoteById(id) {
    await this.init();
    const note = (this.db.data.notes || []).find(n => n.id === id);
    if (!note) {
      throw new Error(`Note with id ${id} not found`);
    }
    return note;
  }

  async addNote(noteData) {
    await this.init();

    const contentType = noteData.contentType || (noteData.richContent ? 'rich' : 'plain');
    const richContent = noteData.richContent || noteData.content || '';
    const plainContent = noteData.content || (contentType === 'rich' ? stripHtml(richContent) : richContent);

    const newNote = {
      id: uuidv4(),
      title: (noteData.title || '').trim(),
      content: plainContent,
      richContent: richContent,
      contentType: contentType,
      summary: noteData.summary || '',
      tags: Array.isArray(noteData.tags) ? noteData.tags : [],
      type: noteData.type || 'Note',
      isPinned: Boolean(noteData.isPinned),
      isFavorite: Boolean(noteData.isFavorite),
      color: noteData.color || null,
      isIndexed: false,
      lanceDbId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Store in LowDB first
    this.db.data.notes.push(newNote);
    await this.db.write();
    logger.info(`Added new note: ${newNote.id} (title: ${newNote.title || 'Untitled'})`);

    // If there's content, index it into LanceDB via memory service
    const textToIndex = newNote.title ? `${newNote.title}\n\n${newNote.content}` : newNote.content;
    if (textToIndex && textToIndex.trim()) {
      try {
        const metadata = {
          type: 'note',
          sourceId: newNote.id,
          summary: newNote.summary,
          tags: newNote.tags,
          title: newNote.title,
        };
        const lanceDbId = await memoryService.addMemory(textToIndex.trim(), metadata);
        
        // Update LowDB with index status
        const index = this.db.data.notes.findIndex(n => n.id === newNote.id);
        if (index !== -1) {
          this.db.data.notes[index].isIndexed = true;
          this.db.data.notes[index].lanceDbId = lanceDbId;
          await this.db.write();
        }
      } catch (err) {
        logger.error(`Failed to index note ${newNote.id} in LanceDB:`, err);
      }
    }

    return newNote;
  }

  async updateNote(id, patch) {
    await this.init();
    const index = this.db.data.notes.findIndex(n => n.id === id);
    if (index === -1) {
      throw new Error(`Note with id ${id} not found`);
    }

    const current = this.db.data.notes[index];
    const updated = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString()
    };

    // Keep plain text and richContent in sync if edited
    if (patch.richContent !== undefined) {
      updated.richContent = patch.richContent;
      if (updated.contentType === 'rich' || patch.contentType === 'rich') {
        updated.content = stripHtml(patch.richContent);
      }
    } else if (patch.content !== undefined) {
      updated.content = patch.content;
      if (updated.contentType === 'plain' || patch.contentType === 'plain') {
        updated.richContent = patch.content;
      }
    }

    this.db.data.notes[index] = updated;
    await this.db.write();

    // Re-index in LanceDB if content, richContent, title, tags or summary changed
    const contentChanged = patch.content !== undefined || patch.richContent !== undefined || patch.title !== undefined || patch.summary !== undefined || patch.tags !== undefined;
    if (contentChanged) {
      try {
        // Delete previous embedding safely
        await memoryService.deleteMemoryBySourceId(id);

        const textToIndex = updated.title ? `${updated.title}\n\n${updated.content}` : updated.content;
        if (textToIndex && textToIndex.trim()) {
          const metadata = {
            type: 'note',
            sourceId: updated.id,
            summary: updated.summary,
            tags: updated.tags,
            title: updated.title,
          };
          const lanceDbId = await memoryService.addMemory(textToIndex.trim(), metadata);
          const currentIndex = this.db.data.notes.findIndex(n => n.id === id);
          if (currentIndex !== -1) {
            this.db.data.notes[currentIndex].isIndexed = true;
            this.db.data.notes[currentIndex].lanceDbId = lanceDbId;
            await this.db.write();
          }
        }
      } catch (err) {
        logger.error(`Failed to re-index note ${id} in LanceDB:`, err);
      }
    }

    return this.db.data.notes[index];
  }

  async reindexAllNotes() {
    await this.init();
    logger.info('Starting full re-indexing of all notes into LanceDB...');
    const notes = this.db.data.notes || [];
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const plainContent = note.content || (note.richContent ? stripHtml(note.richContent) : '');
      const textToIndex = note.title ? `${note.title}\n\n${plainContent}` : plainContent;

      if (textToIndex && textToIndex.trim()) {
        try {
          await memoryService.deleteMemoryBySourceId(note.id);
          const metadata = {
            type: 'note',
            sourceId: note.id,
            summary: note.summary || '',
            tags: note.tags || [],
            title: note.title || '',
          };
          const lanceDbId = await memoryService.addMemory(textToIndex.trim(), metadata);
          notes[i].content = plainContent;
          notes[i].isIndexed = true;
          notes[i].lanceDbId = lanceDbId;
        } catch (err) {
          logger.error(`Failed to re-index note ${note.id}:`, err);
        }
      }
    }
    await this.db.write();
    logger.info('Finished full re-indexing of notes into LanceDB.');
  }

  async togglePin(id) {
    await this.init();
    const index = this.db.data.notes.findIndex(n => n.id === id);
    if (index === -1) throw new Error(`Note with id ${id} not found`);
    this.db.data.notes[index].isPinned = !this.db.data.notes[index].isPinned;
    this.db.data.notes[index].updatedAt = new Date().toISOString();
    await this.db.write();
    return this.db.data.notes[index];
  }

  async toggleFavorite(id) {
    await this.init();
    const index = this.db.data.notes.findIndex(n => n.id === id);
    if (index === -1) throw new Error(`Note with id ${id} not found`);
    this.db.data.notes[index].isFavorite = !this.db.data.notes[index].isFavorite;
    this.db.data.notes[index].updatedAt = new Date().toISOString();
    await this.db.write();
    return this.db.data.notes[index];
  }

  async deleteNote(id) {
    await this.init();
    const initialLength = this.db.data.notes.length;
    this.db.data.notes = this.db.data.notes.filter(n => n.id !== id);
    
    if (this.db.data.notes.length !== initialLength) {
      await this.db.write();
      
      try {
        await memoryService.deleteMemoryBySourceId(id);
      } catch (err) {
        logger.error(`Failed to delete note ${id} from LanceDB:`, err);
      }
      
      return true;
    }
    return false;
  }
}

export default new NoteDbService();
