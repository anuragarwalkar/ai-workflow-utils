import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../logger.ts';

export interface ReminderData {
  id: string;
  title: string;
  description?: string;
  remindAt?: string | null;
  snoozedUntil?: string | null;
  status: 'pending' | 'snoozed' | 'done';
  createdAt: string;
  updatedAt: string;
}

export interface ReminderDbSchema {
  reminders: ReminderData[];
}

class ReminderDbService {
  adapter: JSONFile<ReminderDbSchema>;
  db: Low<ReminderDbSchema>;

  constructor() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.ai-workflow-utils');
    const dbPath = path.join(configDir, 'reminders.json');

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    this.adapter = new JSONFile<ReminderDbSchema>(dbPath);
    this.db = new Low<ReminderDbSchema>(this.adapter, { reminders: [] });
  }

  async init(): Promise<void> {
    await this.db.read();
    if (!this.db.data) {
      this.db.data = { reminders: [] };
      await this.db.write();
    }
  }

  async getReminders(): Promise<ReminderData[]> {
    await this.init();
    return this.db.data.reminders || [];
  }

  async addReminder(reminderData: Partial<ReminderData>): Promise<ReminderData> {
    await this.init();
    const newReminder: ReminderData = {
      id: uuidv4(),
      title: reminderData.title || 'Untitled Reminder',
      description: reminderData.description || '',
      remindAt: reminderData.remindAt || null,
      snoozedUntil: null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.db.data.reminders.push(newReminder);
    await this.db.write();
    logger.info(`Added new reminder: ${newReminder.id}`);
    return newReminder;
  }

  async updateReminder(id: string, patch: Partial<ReminderData>): Promise<ReminderData> {
    await this.init();
    const index = this.db.data.reminders.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error(`Reminder with id ${id} not found`);
    }

    this.db.data.reminders[index] = {
      ...this.db.data.reminders[index],
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    await this.db.write();
    return this.db.data.reminders[index];
  }

  async deleteReminder(id: string): Promise<boolean> {
    await this.init();
    const initialLength = this.db.data.reminders.length;
    this.db.data.reminders = this.db.data.reminders.filter(r => r.id !== id);

    if (this.db.data.reminders.length !== initialLength) {
      await this.db.write();
      return true;
    }
    return false;
  }

  async snoozeReminder(id: string, untilIsoString: string): Promise<ReminderData> {
    return this.updateReminder(id, {
      snoozedUntil: untilIsoString,
      status: 'snoozed',
    });
  }
}

export default new ReminderDbService();
