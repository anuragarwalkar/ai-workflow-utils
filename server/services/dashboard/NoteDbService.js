import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../logger.js';
import memoryService from './MemoryService.js';

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
    // Return sorted by newest first
    return [...(this.db.data.notes || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async addNote(noteData) {
    await this.init();
    const newNote = {
      id: uuidv4(),
      content: noteData.content || '',
      summary: noteData.summary || '',
      tags: noteData.tags || [],
      type: noteData.type || 'General',
      isIndexed: false,
      lanceDbId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Store in LowDB first
    this.db.data.notes.push(newNote);
    await this.db.write();
    logger.info(`Added new note: ${newNote.id}`);

    // If there's content, index it into LanceDB via memory service
    if (newNote.content) {
      try {
        const metadata = {
          type: 'note',
          sourceId: newNote.id,
          summary: newNote.summary,
          tags: newNote.tags,
        };
        const lanceDbId = await memoryService.addMemory(newNote.content, metadata);
        
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

    this.db.data.notes[index] = {
      ...this.db.data.notes[index],
      ...patch,
      updatedAt: new Date().toISOString()
    };
    
    await this.db.write();
    return this.db.data.notes[index];
  }

  async deleteNote(id) {
    await this.init();
    const initialLength = this.db.data.notes.length;
    this.db.data.notes = this.db.data.notes.filter(n => n.id !== id);
    
    if (this.db.data.notes.length !== initialLength) {
      await this.db.write();
      // Note: we might want to delete from LanceDB here if it supported easy deletes by metadata id
      return true;
    }
    return false;
  }
}

export default new NoteDbService();
